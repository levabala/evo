class SimMap {
  constructor(width, height, fertility_base = 0.00001, fertility_range = 0.00000) {
    //add reactor
    Reactor.apply(this, []);

    this.width = width;
    this.height = height;
    this.fertility_base = fertility_base;
    this.fertility_range = fertility_range;
    this.cells = this._generateMapPerlin();

    //constants
    this.HORIZONTAL_AXIS_RANGE = new Range(0, this.width - 1);
    this.VERTICAL_AXIS_RANGE = new Range(0, this.height - 1);
  }

  _generateMapRandom() {
    var map = [];
    for (var x = 0; x < this.width; x++) {
      map.push([]);
      for (var y = 0; y < this.height; y++)
        map[x][y] = new Cell(new P(x, y), this.fertility_base + (Math.random() - 1) * 2 * this.fertility_range);
    }
    return map;
  }

  _generateMapPerlin() {
    const changing = 24;
    var map = [];
    noise.seed(Math.random());
    var max_food_type = 0;
    for (var x = 0; x < this.width; x++) {
      map.push([]);
      for (var y = 0; y < this.height; y++) {
        let val = noise.perlin2(x / changing, y / changing);
        let food_type = (val + 0.5) / 2;
        max_food_type = Math.max(food_type, max_food_type);
        map[x][y] = new Cell(
          new P(x, y),
          this.fertility_base + (Math.random() - 1) * 2 * this.fertility_range,
          food_type
        );
      }
    }
    var coeff = 1 / max_food_type;
    for (var x = 0; x < this.width; x++)
      for (var y = 0; y < this.height; y++) {
        map[x][y].food_type *= coeff;
      }

    return map;
  }

  cellAtPoint(p) {
    if (p.x > this.HORIZONTAL_AXIS_RANGE.to)
      p.x = this.HORIZONTAL_AXIS_RANGE.from;
    else if (p.x < this.HORIZONTAL_AXIS_RANGE.from)
      p.x = this.HORIZONTAL_AXIS_RANGE.to;
    if (p.y > this.VERTICAL_AXIS_RANGE.to)
      p.y = this.VERTICAL_AXIS_RANGE.from;
    else if (p.y < this.VERTICAL_AXIS_RANGE.from)
      p.y = this.VERTICAL_AXIS_RANGE.to;
    return this.cells[p.x][p.y];
  }
}