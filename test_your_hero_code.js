// Constants
var DIMENSIONS = 8;
var NUM_HEALTHWELLS = 1;
var NUM_MINES = 2;
var NUM_ENEMIES = 1;
var NUM_FRIENDS = 1;


//Get the helper file and the Game logic
var helpers = require('./helpers.js');
var Game = require('./game_logic/Game.js');

//Get my hero's move function ("brain")
var heroMoveFunction = require('./hero.js');

//The move function ("brain") the practice enemy will use
var enemyMoveFunction = function(gameData, helpers) {
  //Move in a random direction
  var choices = ['North', 'South', 'East', 'West'];
  return choices[Math.floor(Math.random()*4)];
}


//Make a new game with a DIMENSIONSxDIMENSIONS board
var game = new Game(DIMENSIONS);
/*
 *  Add health wells, diamond mines, enemies, friends, and myHero
 */
for (var i = 0; i < NUM_HEALTHWELLS; i++) {
    helpers.addRandomHealthWell(game)
}

for (var i = 0; i < NUM_MINES; i++) {
    helpers.addRandomDiamondMine(game);
}

for (var i = 0; i < NUM_ENEMIES; i++) {
    helpers.addRandomEnemy(game);
}

for (var i = 0; i < NUM_FRIENDS; i++) {
    helpers.addRandomFriend(game);
}

helpers.addRandomMyHero(game);

console.log('About to start the game!  Here is what the board looks like:');

//You can run game.board.inspect() in this test code at any time
//to log out the current state of the board (keep in mind that in the actual
//game, the game object will not have any functions on it)
game.board.inspect();

//Play a very short practice game
var turnsToPlay = 20;

for (var i=0; i<turnsToPlay; i++) {
  var hero = game.activeHero;
  var direction;
  if (hero.name === 'MyHero') {

    //Ask your hero brain which way it wants to move
    direction = heroMoveFunction(game, helpers);
  } else {
    direction = enemyMoveFunction(game, helpers);
  }
  console.log('-----');
  console.log('Turn ' + i + ':');
  console.log('-----');
  console.log(hero.name + ' tried to move ' + direction);
  console.log(hero.name + ' owns ' + hero.mineCount + ' diamond mines')
  console.log(hero.name + ' has ' + hero.health + ' health')
  game.handleHeroTurn(direction);
  game.board.inspect();
  console.log("\n\n\n\n");
}
