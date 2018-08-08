class VisualizerSVG {
  constructor(div, map_contoller, creatures_controller) {
    Reactor.apply(this, []);

    this.div = div;
    this.draw = SVG(div);
    this.main_nest = this.draw.nested();
    this.main_group = this.main_nest.group();
    this.map_contoller = map_contoller;
    this.creatures_controller =
      creatures_controller
        .addEventListener(
          creatures_controller.NEW_CREATURE_EVENT,
          this._addCreature.bind(this)
        )
        .addEventListener(
          creatures_controller.DEAD_CREATURE_EVENT,
          this._removeCreature.bind(this)
        );
    this.map = map_contoller.map;
    this.creatures_drawings = {}; //id - drawing
    this.cells_drawings = [];

    //constants
    this.CELL_SIZE = 1; //no effect nowday 
    this.UPDATE_CELLS_INTERVAL = 100;
    this.UPDATE_CREATURES_INTERVAL = 30;
    this.SIZE_REDRAW_TIGGER = 0.01;
    this.OFFSET = 10;

    this._drawBackground();
    this._createCells();
    this._drawNet();
    setTimeout(function() {
      this.auto_scale()
      setTimeout(this._resize_main_div.bind(this), 1000);
    }.bind(this), 100);

    //start redrawing cycle
    this._update_creatures();
    this._update_cells();
  }

  auto_scale() {
    var scales = this._calcScale();
    var scale = Math.min(scales.sx, scales.sy);
    this.main_group.scale(scale, scale);
    var matrix = this._getElMatrix(this.main_group);
    let no_translate_matrix = this._resetMatrixTranslate(matrix);
    this.main_group.matrix(no_translate_matrix);
  }

  _createCells() {
    let cells = [];
    for (var x = 0; x < this.map.width; x++) {
      cells.push([]);
      for (var y = 0; y < this.map.height; y++) {
        let cell = this.map.cells[x][y];
        let color = this._generateCellColor(cell);
        cells[x][y] =
          this.main_group.rect(1, 1)
            .move(x, y)
            .fill(color);
      }
    }
    this.cells_drawings = cells;
  }

  _generateCellColor(cell) {
    let hue = Math.round(cell.food_type * 360);
    let sat = 20;
    let light = Math.round(cell.food_amount / cell.MAX_FOOD_AMOUNT * 20);
    let color = `hsl(${hue}, ${sat}%, ${light}%)`;
    return color;
  }

  _generateCreatureColor(creature) {
    let hue = Math.round(creature.eating_type * 360);
    let sat = 50;
    let light = Math.round(Math.max(creature.satiety, 0.5) * 100);
    let color = `hsl(${hue}, ${sat}%, ${light}%)`;
    return color;
  }

  _resetMatrixTranslate(matrix) {
    var map = [1, 1, 1, 1, 0, 0];
    return matrix.map((item, i, array) => item * map[i]);
  }

  _addCreature(creature) {
    let size = this._getCreatureSize(creature);
    this.creatures_drawings[creature.id] =
      this.main_group.rect(size, size)
        .cx(creature.coordinates.x + 0.5)
        .cy(creature.coordinates.y + 0.5)
        .fill(this._generateCreatureColor(creature));
  }

  _removeCreature(creature) {
    this.creatures_drawings[creature.id].remove();
    delete this.creatures_drawings[creature.id];
  }

  _resize_main_div() {
    let bbox = this.main_nest.bbox();
    let width = bbox.width + this.OFFSET;
    let height = bbox.height + this.OFFSET;
    this.draw.size(width + "px", height + "px");
  }

  _calcScale() {
    let jq_div = $(this.div);
    let width = jq_div.width();
    let height = jq_div.height()
    return {
      sx: width / (this.map.width),
      sy: height / (this.map.height),
    }
  }

  _getCreatureSize(creature) {
    return creature.satiety * 0.7;
  }

  _update_creatures() {
    for (let entrie of Object.entries(this.creatures_drawings)) {
      let id = entrie[0];
      let drawing = entrie[1];
      let creature = this.creatures_controller.creatures[id];
      let size = this._getCreatureSize(creature);

      let size_change = Math.abs(size - drawing.width()) >= this.SIZE_REDRAW_TIGGER;

      //positioning  
      if (
        size_change ||
        Math.round(drawing.cx()) != creature.coordinates.x + 1 ||
        Math.round(drawing.cy()) != creature.coordinates.y + 1
      )
        drawing
          .cx(creature.coordinates.x + 0.5)
          .cy(creature.coordinates.y + 0.5);

      //sizing
      if (size_change)
        drawing.width(size).height(size);
    }

    setTimeout(this._update_creatures.bind(this), this.UPDATE_CREATURES_INTERVAL);
  }

  _update_cells() {
    for (var x = 0; x < this.map.width; x++)
      for (var y = 0; y < this.map.height; y++) {
        let cell = this.map.cells[x][y];
        let new_color = this._generateCellColor(cell);
        this.cells_drawings[x][y].fill(new_color);
      }

    setTimeout(this._update_cells.bind(this), this.UPDATE_CELLS_INTERVAL);
  }

  _drawBackground() {
    this.main_group.clear();
  }

  _drawNet() {
    for (var x = 0; x < this.map.width + 1; x++)
      this.main_group.line(x, 0, x, this.map.height).stroke({ color: "white", opacity: 0.5, width: 0.05 });
    for (var y = 0; y < this.map.height + 1; y++)
      this.main_group.line(0, y, this.map.width, y).stroke({ color: "white", opacity: 0.5, width: 0.05 });
  }

  _getElMatrix(el) {
    return el.attr("transform")
      .split("(")[1]
      .replace(")", "")
      .split(",")
      .map((el) => parseFloat(el));
  }
}