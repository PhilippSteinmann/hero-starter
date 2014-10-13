var helpers = {};

// Returns false if the given coordinates are out of range
helpers.validCoordinates = function(board, distanceFromTop, distanceFromLeft) {
  return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
      distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
};

// Returns the tile [direction] (North, South, East, or West) of the given X/Y coordinate
helpers.getTileNearby = function(board, distanceFromTop, distanceFromLeft, direction) {

  // These are the X/Y coordinates
  var fromTopNew = distanceFromTop;
  var fromLeftNew = distanceFromLeft;

  // This associates the cardinal directions with an X or Y coordinate
  if (direction === 'North') {
    fromTopNew -= 1;
  } else if (direction === 'East') {
    fromLeftNew += 1;
  } else if (direction === 'South') {
    fromTopNew += 1;
  } else if (direction === 'West') {
    fromLeftNew -= 1;
  } else {
    return false;
  }

  // If the coordinates of the tile nearby are valid, return the tile object at those coordinates
  if (helpers.validCoordinates(board, fromTopNew, fromLeftNew)) {
    return board.tiles[fromTopNew][fromLeftNew];
  } else {
    return false;
  }
};

// Returns an object with certain properties of the nearest object we are looking for
helpers.findNearestObjectDirectionAndDistance = function(board, fromTile, tileCallback) {
  // Storage queue to keep track of places the fromTile has been
  var queue = [];

  //Keeps track of places the fromTile has been for constant time lookup later
  var visited = {};

  // Variable assignments for fromTile's coordinates
  var dft = fromTile.distanceFromTop;
  var dfl = fromTile.distanceFromLeft;

  // Stores the coordinates, the direction fromTile is coming from, and it's location
  var visitInfo = [dft, dfl, 'None', 'START'];

  //Just a unique way of storing each location we've visited
  visited[dft + '|' + dfl] = true;

  // Push the starting tile on to the queue
  queue.push(visitInfo);

  // While the queue has a length
  while (queue.length > 0) {

    // Shift off first item in queue
    var coords = queue.shift();

    // Reset the coordinates to the shifted object's coordinates
    var dft = coords[0];
    var dfl = coords[1];

    // Loop through cardinal directions
    var directions = ['North', 'East', 'South', 'West'];
    for (var i = 0; i < directions.length; i++) {

      // For each of the cardinal directions get the next tile...
      var direction = directions[i];

      // ...Use the getTileNearby helper method to do this
      var nextTile = helpers.getTileNearby(board, dft, dfl, direction);

      // If nextTile is a valid location to move...
      if (nextTile) {

        // Assign a key variable the nextTile's coordinates to put into our visited object later
        var key = nextTile.distanceFromTop + '|' + nextTile.distanceFromLeft;

        var isGoalTile = false;
        try {
          isGoalTile = tileCallback(nextTile);
        } catch(err) {
          isGoalTile = false;
        }

        // If we have visited this tile before
        if (visited.hasOwnProperty(key)) {

          //Do nothing--this tile has already been visited

        //Is this tile the one we want?
        } else if (isGoalTile) {

          // This variable will eventually hold the first direction we went on this path
          var correctDirection = direction;

          // This is the distance away from the final destination that will be incremented in a bit
          var distance = 1;

          // These are the coordinates of our target tileType
          var finalCoords = [nextTile.distanceFromTop, nextTile.distanceFromLeft];

          // Loop back through path until we get to the start
          while (coords[3] !== 'START') {

            // Haven't found the start yet, so go to previous location
            correctDirection = coords[2];

            // We also need to increment the distance
            distance++;

            // And update the coords of our current path
            coords = coords[3];
          }

          //Return object with the following pertinent info
          return {
            direction: correctDirection,
            distance: distance,
            coords: finalCoords
          };

          // If the tile is unoccupied, then we need to push it into our queue
        } else if (nextTile.type === 'Unoccupied') {

          queue.push([nextTile.distanceFromTop, nextTile.distanceFromLeft, direction, coords]);

          // Give the visited object another key with the value we stored earlier
          visited[key] = true;
        }
      }
    }
  }

  // If we are blocked and there is no way to get where we want to go, return false
  return false;
};

// Returns the direction of the nearest non-team diamond mine or false, if there are no diamond mines
helpers.findNearestNonTeamDiamondMine = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
    if (mineTile.type === 'DiamondMine') {
      if (mineTile.owner) {
        return mineTile.owner.team !== hero.team;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }, board);

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the nearest unowned diamond mine or false, if there are no diamond mines
helpers.findNearestUnownedDiamondMine = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
    if (mineTile.type === 'DiamondMine') {
      if (mineTile.owner) {
        return mineTile.owner.id !== hero.id;
      } else {
        return true;
      }
    } else {
      return false;
    }
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the nearest health well or false, if there are no health wells
helpers.findNearestHealthWell = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(healthWellTile) {
    return healthWellTile.type === 'HealthWell';
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the direction of the nearest enemy with lower health
// (or returns false if there are no accessible enemies that fit this description)
helpers.findNearestWeakerEnemy = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile) {
    return enemyTile.type === 'Hero' && enemyTile.team !== hero.team && enemyTile.health < hero.health;
  });

  //Return the direction that needs to be taken to achieve the goal
  //If no weaker enemy exists, will simply return undefined, which will
  //be interpreted as "Stay" by the game object
  return pathInfoObject.direction;
};

// Returns the direction of the nearest enemy
// (or returns false if there are no accessible enemies)
helpers.findNearestEnemy = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile) {
    return enemyTile.type === 'Hero' && enemyTile.team !== hero.team
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the direction of the nearest friendly champion
// (or returns false if there are no accessible friendly champions)
helpers.findNearestTeamMember = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(heroTile) {
    return heroTile.type === 'Hero' && heroTile.team === hero.team;
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

helpers.oppositeDirection = function(direction) {
    if (direction == "North")
        return "South";
    else if (direction == "South")
        return "North";
    else if (direction == "West")
        return "East";
    else if (direction == "East")
        return "West";
    else
        return "Stay";
};

helpers.randomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// returns a random empty tile on board
helpers.randomEmptyTile = function(game) {

    // Start by picking random tile (x, y)
    var x = helpers.randomInt(0, game.board.tiles.length);
    var y = helpers.randomInt(0,  game.board.tiles.length);
    var randomTile = game.board.tiles[y][x];

    // If tile is unoccupied, return it
    if (randomTile.type == "Unoccupied")
        return [x, y];

    // If tile is occupied, return nearest unoccupied tile
    else {
        var nearestUnoccupied = helpers.findNearestObjectDirectionAndDistance(game.board, randomTile, function(tile) {
            return tile.type == "Unoccupied";
        });
        return [nearestUnoccupied.coords[0], nearestUnoccupied.coords[1]];
    }
}

// Add a health well at a random location
helpers.addRandomHealthWell = function(game) {
    var randomTile = helpers.randomEmptyTile(game);
    var x = randomTile[0];
    var y = randomTile[1];
    game.addHealthWell(x, y);
}

// Add a diamond mine at a random location
helpers.addRandomDiamondMine = function(game) {
    var randomTile = helpers.randomEmptyTile(game);
    var x = randomTile[0];
    var y = randomTile[1];
    game.addDiamondMine(x, y);
}

// Add an enemy (Team 1) at a random location
helpers.addRandomEnemy = function(game) {
    var randomTile = helpers.randomEmptyTile(game);
    var x = randomTile[0];
    var y = randomTile[1];
    game.addHero(x, y, "Enemy (" + x + "," + y + ")", 1);
}

// Add a friend (Team 0) at a random location
helpers.addRandomFriend = function(game) {
    var randomTile = helpers.randomEmptyTile(game);
    var x = randomTile[0];
    var y = randomTile[1];
    game.addHero(x, y, "Friend (" + x + "," + y + ")", 0);
}

// Add the hero (Team 0) at a random location
helpers.addRandomMyHero = function(game) {
    var randomTile = helpers.randomEmptyTile(game);
    var x = randomTile[0];
    var y = randomTile[1];
    game.addHero(x, y, "MyHero", 0);
}

helpers.findObjectsInRadius = function(game, x, y, radius, tileCallBack) {
    console.log("HELLO");
    // array to return, contains Tile obects
    var results = [];

    // 8 possible directions from tile
    var translations = [[1, 0], [-1, 0], [0, 1], [0, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]];

    // all tiles we've checked already.
    // 1D so that we can add every checked tile here, and then use it as a 
    // starting point in the next iteration.
    var checked_tiles_1d = [];
    checked_tiles_1d.push([x, y]);


    // all tiles we've checked aleady.
    // 2D so that we can quickly check whether tile has been checked already.
    var checked_tiles_2d = [];
    for (var col_n = 0; col_n < game.board.tiles.length; col_n++) {
        var col = [];
        for (var row_n = 0; row_n < game.board.tiles.length; row_n++)
            col.push(0);
        checked_tiles_2d.push(col);
    }
    checked_tiles_2d[x][y] = 1;
    
    // At iteration = 0, we check all 8 directions from the starting tile.
    // At iteration = 1, we check all 8 directions of all tiles we've checked already.
    for (var iteration = 0; iteration < radius; iteration++) {

        // A temporary array in which we put the ones we check this round.
        // If we put checked tiles straight into checked_tiles_1d, there's an infinite loop.
        var checked_in_this_iteration = [];

        // For every checked tile
        for (var n = 0; n < checked_tiles_1d.length; n++) {
            var checked_tile = checked_tiles_1d[n];

            // For every direction (of 8)
            for (var m = 0; m < translations.length; m++) {
                var translation = translations[m];

                // Compute (x, y) of new tile to check
                var x = checked_tile[0] + translation[0];
                var y = checked_tile[1] + translation[1];

                // If within the board and not checked yet
                if (helpers.validCoordinates(game.board, y, x)) {
                    if (checked_tiles_2d[x][y] == 0) {
                        // If it's what we're lookng for
                        if (tileCallBack(game.board.tiles[y][x])) {
                            results.push(game.board.tiles[y][x]);
                        }
                    }
                    checked_in_this_iteration.push([x, y]);
                    checked_tiles_2d[x][y] = 1;
                }
            }
        }
        var checked_tiles_1d = checked_tiles_1d.concat(checked_in_this_iteration);
    }
    return results
}

module.exports = helpers;
