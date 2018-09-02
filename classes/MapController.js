class MapController {
  constructor(map) {
    this.map = map;
    this.last_update_timecode = Date.now();
    this.last_line = 0;
    this.lines_per_tick = 10;
  }

  tick(time, timecode, sim_speed) {
    this.map.checkForChange(time);
    /* let to = Math.min(this.map.cells[0].length - 1, this.last_line + this.lines_per_tick);
    for (let y = this.last_line; y <= to; y++)
      for (var x = 0; x < this.map.width; x++) {
        let cell = this.map.cells[x][y];
        cell.update(timecode, sim_speed);
      }
    if (to == this.map.cells[0].length - 1)
      this.last_line = 0;
    else
      this.last_line = to + 1; */
    for (let x = 0; x < this.map.width; x++) {
      for (let y = 0; y < this.map.height; y++) {
        const do_update = Math.random() > 0.9;
        if (do_update) {
          const cell = this.map.cells[x][y];
          cell.update(timecode, sim_speed);
        }
      }
    }
  }

  reset() {
    this.map = new SimMap(
      this.map.width, this.map.height, this.map.fertility_base, this.map.fertility_range,
    );
  }
}