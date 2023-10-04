var timeValue = 0;
var remainingMines = 0;
var interval;
var minesLaid = false;
let options = { columns: 9, rows: 9, mines: 10 };
var mineLocations = [];
var difficultyIndex = 0;

AFRAME.registerComponent('smiley', {
  schema: {
    
  },
  init: function () {
    let el = this.el;  // <a-box>

    el.addEventListener('mouseenter', function () {
      el.setAttribute('color', 'lightgrey');  
    });
    el.addEventListener('mouseleave', function () {
      el.setAttribute('color', 'grey');  
    }); 

    el.addEventListener('click', resetGame, true);

    
  },
});

AFRAME.registerComponent('tile', {
    schema: {
      tileIndex: {type: 'int', default: -1},
      flagged: {type: 'bool', default: false},
      revealed: {type: 'bool', default: false},
    },
    init: function () {
      let el = this.el;  // <a-box>
      let tileIndex = this.data.tileIndex

      this.el.id = tileIndex;

      if(this.data.tileIndex >= 0){
        el.object3D.position.x = this.data.tileIndex % options.columns;
        el.object3D.position.z = Math.floor(this.data.tileIndex / options.columns);
      }

      this.handleMouseEnter = function() {
        el.setAttribute('color', 'lightgrey');  
      }
      el.addEventListener('mouseenter', this.handleMouseEnter);

      this.handleMouseLeave = function () {
        el.setAttribute('color', 'grey');  
      };
      el.addEventListener('mouseleave', this.handleMouseLeave);

      this.handleClick = function(event) {handleClick(event);};
      el.addEventListener('click', this.handleClick , true);      
    },
    remove: function() {
      let el = this.el;  // <a-box>
      el.removeEventListener('click', this.handleClick);
      el.removeEventListener('mouseenter', this.handleMouseEnter);
      el.removeEventListener('mouseleave', this.handleMouseLeave);
    }
  });
  
  function handleClick(event) {
    //Check the aframe event to see if the nested event is mouse or touch
    let clickX = event.detail.mouseEvent ? event.detail.mouseEvent.x : event.detail.touchEvent.changedTouches[0].clientX 
    
    if(clickX > (window.innerWidth/2)){
      let tileIndex = event.target.id;
      if (!minesLaid) {
        layMines(tileIndex);
      }
      revealTile(event.target);
    } else {
      toggleFlag(event.target);
  }
}

function toggleFlag(element){
  //If the tile has already been revealed do nothing
  if(element.components.tile.data.revealed){
    return;
  }

  if (!element.components.tile.data.flagged) {
    element.setAttribute('tile', 'flagged:true');
    element.setAttribute('multisrc', 'src2:#flag');
    remainingMines--;
  } else {
    element.setAttribute('tile', 'flagged:false');
    element.setAttribute('multisrc', 'src2:#hidden');
    remainingMines++;
  }
  updateMineCount();
}

function revealTile(clickedTile, adjacentCheck = false) {
  //Do nothing to flagged or revealed tiles
  if (clickedTile.components.tile.data.flagged) {
    return;
  }
  if (clickedTile.components.tile.data.revealed && adjacentCheck == false) {
    //Check if the number of adjacent flags is the same as the number of adjacent mines
    var adjacentTiles = getAdjacentTiles(parseInt(clickedTile.id));
    var adjacentMineCount = 0;
    var adjacentFlagCount = 0;
    for (var i = 0; i < adjacentTiles.length; i++) {
        if(document.getElementById(adjacentTiles[i]).components.tile.data.flagged){
            adjacentFlagCount++;
        }
        if (mineLocations.indexOf(adjacentTiles[i]) > -1) {
            adjacentMineCount++;
        }
    }
    if (adjacentMineCount > 0 && adjacentFlagCount === adjacentMineCount) {
        for (var i = 0; i < adjacentTiles.length; i++) {
          let adjacentTile = document.getElementById(adjacentTiles[i]);
          if(!adjacentTile.components.tile.data.revealed){ 
            revealTile(adjacentTile, true);
          }
        }
    }
    return;
  }

  //Mark this tile as revealed
  clickedTile.setAttribute('multisrc', 'src2:#clear');
  clickedTile.setAttribute('tile', 'revealed:true');

  
  //Check if the clicked tile was a mine
  if (mineLocations.indexOf(parseInt(clickedTile.id)) > -1) {
      //Enter lose state
      clickedTile.setAttribute('multisrc', 'src2:#mine_hit');
      document.getElementById("smiley").setAttribute('multisrc', 'src2:#face_lose');

      stopTimer();
      //removeEventListenersFromTiles();

      var flags = document.getElementsByClassName("flag");

      for (var i = 0; i < flags.length; i++) {
          if (mineLocations.indexOf(parseInt(flags[i].id)) === -1) {
              flags[i].setAttribute('multisrc', 'src2:#mine_marked');
          }
      }
      for (var i = 0; i < mineLocations.length; i++) {
          if (!document.getElementById(mineLocations[i]).components.tile.data.flagged) {
              document.getElementById(mineLocations[i]).setAttribute('multisrc', 'src2:#mine');
          }
      }
      return;
  }

  //Check adjacent tiles for a mine
  var adjacentTiles = getAdjacentTiles(parseInt(clickedTile.id));
  var adjacentMineCount = 0;
  for (var i = 0; i < adjacentTiles.length; i++) {
      if (mineLocations.indexOf(adjacentTiles[i]) > -1) {
          adjacentMineCount++;
      }
  }

  //Number tiles for mine if none reveal adjacent tiles
  if (adjacentMineCount > 0) {
      clickedTile.setAttribute('multisrc', 'src2:#tile' + adjacentMineCount);
  } else {
      for (var i = 0; i < adjacentTiles.length; i++) {
          revealTile(document.getElementById(adjacentTiles[i]));
      }
  }

  //Check if the number of hidden tiles remaining == number of mines
  if(mineLocations.length === document.getElementsByClassName("hidden").length){
      //Enter win state
      document.getElementById("smiley").setAttribute('multisrc', 'src2:#face_win');
      stopTimer();
      // removeEventListenersFromTiles();
  }

}

function resetGame() {
  if(!minesLaid){
    setDifficulty(difficultyIndex);
    difficultyIndex = (difficultyIndex + 1) % 3;
  }

  document.getElementById("smiley").setAttribute('multisrc', 'src2:#face_up');
  buildGrid();
}


function buildGrid() {
  // Fetch grid and clear out old elements, reset title text
  
  //setDifficulty(options);

  var grid = document.getElementById("minefield");
  grid.object3D.clear();
  grid.innerHTML = '';
  grid.object3D.position.x = 0.5 - (options.columns/2);

  //Reset mines
  minesLaid = false;
  mineLocations = [];
  remainingMines = options.mines;
  updateMineCount();

  // Build DOM Grid
  var tile;
  for (var index = 0; index < options.columns * options.rows; index++) {
      tile = createTile(index);
      grid.appendChild(tile);
  }
    
}

function createTile(index){
  const element = document.createElement('a-box');
  element.setAttribute('tile', {tileIndex: index});
  element.setAttribute('multisrc', 'src2:#hidden;');
  element.object3D.position.y = 0.15;
  element.object3D.scale.set(1, .3, 1);
  element.setAttribute('color', 'grey');  
  return element;
}

function layMines(firstTileIndex) {
  //Get an array of ids that matches the number of tiles on the screen
  var tilesArray = Array.from(Array(options.columns * options.rows).keys());
  
  //Remove the currently clicked and adjacent tiles to ensure that the clicked tile will be blank
  var idsToRemove = getAdjacentTiles(parseInt(firstTileIndex));
  tilesArray.splice(tilesArray.indexOf(parseInt(firstTileIndex)), 1);
  for (var x = 0; x < idsToRemove.length; x++){
      tilesArray.splice(tilesArray.indexOf(idsToRemove[x]), 1);
  }

  //Remove and push random tiles and add them into the mineLocation
  for (var x = 0; x < options.mines; x++) {
      mineLocations.push(tilesArray.splice(Math.floor(Math.random() * tilesArray.length), 1)[0]);
  }
  minesLaid = true;
}

/* Function to get the 8 (or less) adjacent tiles */
function getAdjacentTiles(id) {
  var minArray = 0;
  var maxArray = options.rows * options.columns;

  var adjacentTileArrayLocation = [];
  
  if(id % options.columns !== 0){        
      adjacentTileArrayLocation.push(id - 1);
      adjacentTileArrayLocation.push(id + options.columns - 1);
      adjacentTileArrayLocation.push(id - options.columns - 1);
  }

  if (id % options.columns !== options.columns-1) {
      adjacentTileArrayLocation.push(id + 1);
      adjacentTileArrayLocation.push(id + options.columns + 1);
      adjacentTileArrayLocation.push(id - options.columns + 1);
  }

  adjacentTileArrayLocation.push(id - options.columns);
  adjacentTileArrayLocation.push(id + options.columns);

  return adjacentTileArrayLocation.filter(x => x >= minArray && x < maxArray);
}


/* Timer */
function startTimer() {
  interval = window.setInterval(onTimerTick, 1000);
}

function stopTimer(isReset) {
  window.clearInterval(interval);
  if (isReset) {
      timeValue = 0;
  }
  updateTimer();
}

function onTimerTick() {
  timeValue++;
  updateTimer();
}

function updateTimer() {
  document.getElementById("timer").setAttribute('value', timeValue);
}

/* Mine Count */
function updateMineCount() {
  document.getElementById("remainingMineCount").setAttribute('value', remainingMines);
}

function setDifficulty(difficulty) {
  //Easy - 9x9 grid, 10 mines.
  if (difficulty == 0) {
    document.getElementById("difficultyName").setAttribute('value', "Easy");
    options.columns = 9;
    options.rows = 9;
    options.mines = 10;
  }
  //Medium - 16x16 grid, 40 mines.
  else if (difficulty == 1) {
    document.getElementById("difficultyName").setAttribute('value', "Medium");
    options.columns = 16;
    options.rows = 16;
    options.mines = 40;
  }
  //Hard - 30x16 grid, 99 mines.
  else if (difficulty == 2) {
    document.getElementById("difficultyName").setAttribute('value', "Hard");
    options.columns = 30;
    options.rows = 16;
    options.mines = 99;
  }
}

function removeEventListenersFromTiles(){
  document.getElementById
}