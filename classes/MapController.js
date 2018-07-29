class MapController {
  constructor(map) {
    this.map = map;
  }

  tick(time) {
    for (var x = 0; x < this.map.width; x++)
      for (var y = 0; y < this.map.height; y++)
        this.map.cells[x][y].tick(time);
  }

  reset() {
    this.map = new SimMap(
      this.map.width, this.map.height, this.map.fertility_base, this.map.fertility_range
    );
  }
}