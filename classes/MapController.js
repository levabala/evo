class MapController {
  constructor(map) {
    this.map = map;
    this.last_update_timecode = Date.now();
  }

  tick(time, timecode, sim_speed) {
    this.map.checkForChange(time);
    for (var x = 0; x < this.map.width; x++)
      for (var y = 0; y < this.map.height; y++) {
        let cell = this.map.cells[x][y];
        cell.update(timecode, sim_speed);
      }
  }

  reset() {
    this.map = new SimMap(
      this.map.width, this.map.height, this.map.fertility_base, this.map.fertility_range
    );
  }
}