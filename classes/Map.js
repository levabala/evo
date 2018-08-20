class SimMap {
  constructor(width, height, fertility_base = 0.000005, fertility_range = 0.00000) {
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
    map = [];

    const changing_sea_rate = 192;
    let sea_rate_map = this._createPerlinMap(changing_sea_rate);

    const changing_sea = 16;
    let sea_map = this._createPerlinMap(changing_sea);

    const changing_food = 64;
    const sea_level = 0.4;
    let food_map = this._createPerlinMap(changing_food);
    for (var x = 0; x < this.width; x++) {
      map.push([]);
      for (var y = 0; y < this.height; y++) {
        let is_sea = sea_map[x][y] > (1 - sea_rate_map[x][y] * sea_level); //sea_rate_map);                     
        map[x][y] = new Cell(
          new P(x, y), !is_sea ? this.fertility_base + (Math.random() - 1) * 2 * this.fertility_range : 0, !is_sea ? food_map[x][y] : -1,
          is_sea
        );
      }
    }

    return map;
  }

  _createPerlinMap(changing) {
    let map = [];
    noise.seed(Math.random());
    var max = Number.MIN_SAFE_INTEGER;
    var min = Number.MAX_SAFE_INTEGER;
    for (var x = 0; x < this.width; x++) {
      map.push([]);
      for (var y = 0; y < this.height; y++) {
        let val = noise.perlin2(x / changing, y / changing);
        let food_type = (val + 0.5) / 2;
        max = Math.max(food_type, max);
        min = Math.min(food_type, min);
        map[x][y] = food_type;
      }
    }

    max -= min;
    var coeff = 1 / max;
    for (var x = 0; x < this.width; x++)
      for (var y = 0; y < this.height; y++) {
        map[x][y] -= min
        map[x][y] *= coeff;
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