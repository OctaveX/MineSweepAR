var timeValue = 0;
var remainingMines = 0;
var interval;
var minesLaid = false;
let options = { columns: 10, rows: 10, mines: 10 };
var mineLocations = [];

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
        el.object3D.position.z = Math.floor(this.data.tileIndex / options.rows);
      }
      
      el.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
      el.addEventListener("contextmenu", function (e) { e.preventDefault(); }); // Right Click

      el.addEventListener('mouseenter', function () {
        el.setAttribute('color', 'lightgrey');  
      });
      el.addEventListener('mouseleave', function () {
        el.setAttribute('color', 'grey');  
      });
      el.addEventListener('click', handleClick, true);      
    },
  });
  
  function handleClick(event) {
    //Check the aframe event to see if the nested event is mouse or touch
    let clickX = event.detail.mouseEvent ? event.detail.mouseEvent.x : event.detail.touchEvent.changedTouches[0].clientX 
    
    if(clickX > (window.innerWidth/2)){

      console.log("RIGHT SIDE");
      // Left Click
      let tileIndex = event.target.id;
      if (!minesLaid) {
        layMines(tileIndex);
      }
      revealTile(event.target);
    } else {
      console.log("LEFT SIDE");
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
  //updateMineCount();
}

    // Middle Click
    // else if (event.which === 2) {
    //     //If the tile that is middle clicked has not been revealed, do nothing. 
    //     //(This was a funny bug that would let you win the game by middle clicking a tile as the first click)
    //     if (!event.target.classList.contains("revealed")) {
    //         return;
    //     }
    //     //Check if the number of adjacent flags is the same as the number of adjacent mines
    //     var adjacentTiles = getAdjacentTiles(parseInt(event.target.id));
    //     var adjacentMineCount = 0;
    //     var adjacentFlagCount = 0;
    //     for (var i = 0; i < adjacentTiles.length; i++) {
    //         if(document.getElementById(adjacentTiles[i]).classList.contains("flag")){
    //             adjacentFlagCount++;
    //         }
    //         if (mineLocations.indexOf(adjacentTiles[i]) > -1) {
    //             adjacentMineCount++;
    //         }
    //     }
    //     if (adjacentFlagCount === adjacentMineCount) {
    //         for (var i = 0; i < adjacentTiles.length; i++) {
    //             revealTile(document.getElementById(adjacentTiles[i]));
    //         }
    //     }
    // }

    // Right Click, if not revealed apply flag
    // else if (event.which === 3 && !event.target.classList.contains("revealed")) {
    //     if (event.target.classList.toggle("flag")) {
    //         remainingMines--;
    //     } else {
    //         remainingMines++;
    //     }
    //     updateMineCount();
    // }

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
      //document.getElementById("smiley").classList.add("face_lose");

      //stopTimer();
      //removeEventListenersFromTiles();

      var flags = document.getElementsByClassName("flag");

      for (var i = 0; i < flags.length; i++) {
          if (mineLocations.indexOf(parseInt(flags[i].id)) === -1) {
              flags[i].classList.add("mine_marked")
          }
      }
      for (var i = 0; i < mineLocations.length; i++) {
          if (!document.getElementById(mineLocations[i]).classList.contains("flag")) {
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
      // document.getElementById("smiley").classList.add("face_win");
      // stopTimer();
      // removeEventListenersFromTiles();

  }

}

  
  function resetGame() {
    buildGrid();
  }


  function buildGrid() {
    // Fetch grid and clear out old elements, reset title text
    
    //setDifficulty(options);

    var grid = document.getElementById("minefield");
    grid.innerHTML = "";
    grid.object3D.position.x = 0.5 - (options.columns/2);//why doesn't this work?

    //Reset mines
    minesLaid = false;
    mineLocations = [];
    remainingMines = options.mines;
    //updateMineCount();

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
  element.setAttribute('color', 'grey');  
  element.object3D.scale.set(1, .3, 1);
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