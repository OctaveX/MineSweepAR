

AFRAME.registerComponent('handle-events', {
    init: function () {
                var el = this.el;  // <a-box>
      el.addEventListener('mouseenter', function () {
        el.setAttribute('color', 'lightgrey');  
      });
      el.addEventListener('mouseleave', function () {
        el.setAttribute('color', 'grey');  
      });
      el.addEventListener('click', function () {
        el.setAttribute('scale', {x: 1, y: .1, z: 1});
        el.object3D.position.y = .05;
        el.setAttribute('color', 'darkgrey');
        el.setAttribute('multisrc', 'src2:#tile1');
      });
    } 
  });


  function buildGrid() {
    // Fetch grid and clear out old elements, reset title text
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";

    var titleText = document.getElementById("titleMessage");
    titleText.innerHTML = "Minesweeper";
    titleText.classList.remove("win_text");
    titleText.classList.remove("lose_text");

    setDifficulty(options);

    //Reset mines
    minesLaid = false;
    mineLocations = [];
    remainingMines = options.mines;
    updateMineCount();

    // Build DOM Grid
    var tile;
    for (var x = 0; x < options.columns * options.rows; x++) {
        tile = createTile(x);
        grid.appendChild(tile);
    }
    
    var style = window.getComputedStyle(tile);
    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));    
    grid.style.width = (options.columns * width) + "px";
    grid.style.height = (options.rows * height) + "px";
}
