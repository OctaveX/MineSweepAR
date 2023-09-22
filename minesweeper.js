var timeValue = 0;
var remainingMines = 0;
var interval;
var minesLaid = false;
let options = { columns: 10, rows: 10, mines: 1 };
var mineLocations = [];

AFRAME.registerComponent('tile', {
    schema: {
      tileIndex: {type: 'int', default: -1},
    },
    init: function () {
      let el = this.el;  // <a-box>
      let tileIndex = this.data.tileIndex
      

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

      //tile.addEventListener("mousedown", handleTileDown, true); // All Clicks
      // tile.addEventListener("mouseover", handleTileDown, true);
      // tile.addEventListener("mouseout", handleTileOut, true);
      //el.addEventListener("mouseup", handleTileUp, true);

      el.addEventListener('click', handleTileUp, true);
        

        // el.setAttribute('scale', {x: 1, y: .1, z: 1});
        // el.object3D.position.y = .05;
        // el.setAttribute('color', 'darkgrey');
        // el.setAttribute('multisrc', 'src2:#tile1');
      //});
      
    },
  });

  function handleTileUp(event) {
    //smiley.classList.remove("face_limbo");

    // Left Click
    let tileIndex = event.target.components.tile.data.tileIndex;
    if (!minesLaid) {
      console.log(tileIndex);
      layMines(tileIndex);
    }

    revealTile(tileIndex);
    

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
}

function revealTile(clickedTile) {
  //Do nothing to flagged or revealed tiles
  console.log(clickedTile);
  if (clickedTile.classList.contains("flag") || clickedTile.classList.contains("revealed")) {
      return;
  }
  //Mark this tile as revealed
  clickedTile.classList.add("revealed");
  clickedTile.classList.remove("hidden");
  
  //Check if the clicked tile was a mine
  if (mineLocations.indexOf(parseInt(clickedTile.id)) > -1) {
      //Enter lose state
      clickedTile.classList.add("mine_hit");
      document.getElementById("smiley").classList.add("face_lose");

      stopTimer();
      removeEventListenersFromTiles();

      var titleText = document.getElementById("titleMessage");
      titleText.innerHTML = "You Lose.";
      titleText.classList.add("lose_text");

      var flags = document.getElementsByClassName("flag");

      for (var i = 0; i < flags.length; i++) {
          if (mineLocations.indexOf(parseInt(flags[i].id)) === -1) {
              flags[i].classList.add("mine_marked")
          }
      }
      for (var i = 0; i < mineLocations.length; i++) {
          if (!document.getElementById(mineLocations[i]).classList.contains("flag")) {
              document.getElementById(mineLocations[i]).classList.add("mine");
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
      clickedTile.classList.add("tile_" + adjacentMineCount);
  } else {
      for (var i = 0; i < adjacentTiles.length; i++) {
          revealTile(document.getElementById(adjacentTiles[i]));
      }
  }

  //Check if the number of hidden tiles remaining == number of mines
  if(mineLocations.length === document.getElementsByClassName("hidden").length){
      //Enter win state
      document.getElementById("smiley").classList.add("face_win");
      stopTimer();
      removeEventListenersFromTiles();

      var titleText = document.getElementById("titleMessage");
      titleText.innerHTML = "You Win!!!";
      titleText.classList.add("win_text");
  }

}

  

  buildGrid();


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