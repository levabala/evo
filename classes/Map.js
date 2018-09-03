class SimMap {
  constructor(width, height, fertility_base = 0.000005, fertility_range = 0.00000) {
    // add reactor
    Reactor.apply(this, []);

    this.width = width;
    this.height = height;
    this.fertility_base = fertility_base;
    this.fertility_range = fertility_range;
    this.cells = [];
    this.last_sea_rate_seed = 0;
    this.last_sea_level_seed = 0;
    this.last_food_type_seed = 0;
    this.last_fertility_seed = 0;
    this.last_sea_rate_height = 0;
    this.last_sea_level_height = 0;
    this.last_food_type_height = 0;
    this.last_fertility_height = 0;
    this.change_sea_timeout = 0;
    this.sea_cells_count = 0;

    // sea props
    this.change_sea_rate = 16;
    this.changing_sea = 128;
    this.changing_fertility = 64;

    // constants
    this.HORIZONTAL_AXIS_RANGE = new Range(0, this.width - 1);
    this.VERTICAL_AXIS_RANGE = new Range(0, this.height - 1);
    this.SEA_RATE_CHANGE_RATE = 0.007; // 0.003;
    this.SEA_LEVEL_CHANGE_RATE = 0.001; // 0.003;
    this.SEA_GLOBAL_LEVEL = 0.5;
    this.SEA_CHANGE_INTERVAL_SECS = 10;

    // events
    this.registerEvent("sea_changed");

    // generate map
    this.cells = this._generateMapPerlin();
  }

  checkForChange(time) {
    this.change_sea_timeout -= time;
    while (this.change_sea_timeout <= 0) {
      this._changeSea(this.SEA_RATE_CHANGE_RATE, this.SEA_LEVEL_CHANGE_RATE);
      this.change_sea_timeout += this.SEA_CHANGE_INTERVAL_SECS * 1000;
    }
  }

  _generateMapRandom() {
    const map = [];
    for (let x = 0; x < this.width; x++) {
      map.push([]);
      for (let y = 0; y < this.height; y++)
        map[x][y] = new Cell(new P(x, y), this.fertility_base + (Math.random() - 1) * 2 * this.fertility_range);
    }
    return map;
  }

  _generateMapPerlin() {
    const map = [];

    const sea_rate_seed = Math.random();
    const sea_rate_height = 0;
    const sea_rate_map = this._createPerlinMap(this.changing_sea_rate, sea_rate_seed, sea_rate_height);

    const sea_level_seed = Math.random();
    const sea_level_height = 0;
    const sea_map = this._createPerlinMap(this.changing_sea, sea_level_seed, sea_level_height);

    const fertility_seed = Math.random();
    const fertility_height = 0;
    const fertility_map = this._createPerlinMap(this.changing_fertility, fertility_seed, fertility_height);

    const changing_food = 64;
    const food_type_seed = Math.random();
    const food_type_height = 0;
    const food_map = this._createPerlinMap(changing_food, food_type_seed, food_type_height);
    this.sea_cells_count = 0;
    for (let x = 0; x < this.width; x++) {
      map.push([]);
      for (let y = 0; y < this.height; y++) {
        const is_sea = this._isSea(sea_map[x][y], sea_rate_map[x][y]);
        if (is_sea)
          this.sea_cells_count++;
        map[x][y] = new Cell(
          new P(x, y),
          this.fertility_base + fertility_map[x][y] * 2 * this.fertility_range,
          food_map[x][y],
          is_sea,
          sea_map[x][y],
          sea_rate_map[x][y],
        );
      }
    }

    this.last_sea_rate_seed = sea_rate_seed;
    this.last_sea_level_seed = sea_level_seed;
    this.last_food_type_seed = food_type_seed;
    this.last_fertility_seed = fertility_seed;

    this.last_sea_rate_height = sea_rate_height;
    this.last_sea_level_height = sea_level_height;
    this.last_food_type_height = food_type_height;
    this.last_fertility_height = fertility_height;

    return map;
  }

  _isSea(level, rate) {
    return level > (1 - rate * this.SEA_GLOBAL_LEVEL);
  }

  _changeSea(rate_diff, level_diff) {
    const sea_rate_height = this.last_sea_rate_height + Math.random() * rate_diff;
    const sea_level_height = this.last_sea_level_height + Math.random() * level_diff;
    const sea_rate_map = this._createPerlinMap(this.change_sea_rate, this.last_sea_rate_seed, sea_rate_height);
    const sea_map = this._createPerlinMap(this.changing_sea, this.last_sea_level_seed, sea_level_height);

    this.sea_cells_count = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const cell = this.cells[x][y];
        const sea_level = sea_map[x][y];
        const sea_rate = sea_rate_map[x][y];
        const is_sea = this._isSea(sea_level, sea_rate);
        if (is_sea)
          this.sea_cells_count++;
        cell.is_sea = is_sea;
        cell.sea_rate = sea_rate;
        cell.sea_level = sea_level;
        // cell.fertility = !is_sea ? this.fertility_base + (Math.random() - 1) * 2 * this.fertility_range : 0;
      }
    }

    this.last_sea_rate_height = sea_rate_height;
    this.last_sea_level_height = sea_level_height;

    this.dispatchEvent("sea_changed");
  }

  _createPerlinMap(changing, seed, height) {
    const map = [];
    noise.seed(seed);
    let max = Number.MIN_SAFE_INTEGER;
    let min = Number.MAX_SAFE_INTEGER;
    for (let x = 0; x < this.width; x++) {
      map.push([]);
      for (let y = 0; y < this.height; y++) {
        const val = noise.perlin3(x / changing, y / changing, height);
        const food_type = (val + 0.5) / 2;
        max = Math.max(food_type, max);
        min = Math.min(food_type, min);
        map[x][y] = food_type;
      }
    }

    max -= min;
    const coeff = 1 / max;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        map[x][y] -= min;
        map[x][y] *= coeff;
      }
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

  cellAtCoordinates(x, y) {
    let out_x = x;
    let out_y = y;
    if (x > this.HORIZONTAL_AXIS_RANGE.to)
      out_x = this.HORIZONTAL_AXIS_RANGE.from;
    else if (x < this.HORIZONTAL_AXIS_RANGE.from)
      out_x = this.HORIZONTAL_AXIS_RANGE.to;
    if (y > this.VERTICAL_AXIS_RANGE.to)
      out_y = this.VERTICAL_AXIS_RANGE.from;
    else if (y < this.VERTICAL_AXIS_RANGE.from)
      out_y = this.VERTICAL_AXIS_RANGE.to;
    return this.cells[out_x][out_y];
  }
}