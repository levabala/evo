class MapController {
  constructor(map) {
    this.map = map;
  }

  tick(time, timecode) {
    for (var x = 0; x < this.map.width; x++)
      for (var y = 0; y < this.map.height; y++) {
        let cell = this.map.cells[x][y];
        cell.last_update_timecode = timecode;
        cell.tick(time);
      }
  }

  reset() {
    this.map = new SimMap(
      this.map.width, this.map.height, this.map.fertility_base, this.map.fertility_range
    );
  }
}