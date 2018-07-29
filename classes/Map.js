class SimMap {
  constructor(width, height, fertility_base = 0.2, fertility_range = 0.19) {
    //add reactor
    Reactor.apply(this, []);

    this.width = width;
    this.height = height;
    this.fertility_base = fertility_base;
    this.fertility_range = fertility_range;
    this.cells = this._generateMap();

    //constants
    this.HORIZONTAL_AXIS_RANGE = new Range(0, this.width);
    this.VERTICAL_AXIS_RANGE = new Range(0, this.height);
  }

  _generateMap() {
    var map = [];
    for (var x = 0; x < this.width; x++) {
      map.push([]);
      for (var y = 0; y < this.height; y++)
        map[x][y] = new Cell(new P(x, y), this.fertility_base + (Math.random() - 1) * 2 * this.fertility_range);
    }
    return map;
  }
}