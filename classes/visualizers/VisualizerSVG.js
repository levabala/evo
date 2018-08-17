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
    this.width = 0;
    this.height = 0;
    this._div_offset = null;
    this._scale_timeout = null;
    this._scaling = false;
    this._view_box = {
      x1: 0,
      x2: Number.MAX_SAFE_INTEGER,
      y1: 0,
      y2: Number.MAX_SAFE_INTEGER
    }

    //constants
    this.CELL_SIZE = 1; //no effect nowday 
    this.UPDATE_CELLS_INTERVAL = 100;
    this.UPDATE_CREATURES_INTERVAL = 30;
    this.SIZE_REDRAW_TIGGER = 0.01;
    this.OFFSET = 10;

    //events
    this.registerEvent("scaling_start");
    this.registerEvent("scaling_end");

    this._drawBackground();
    //this._drawNet();
    //this._createCells();

    /*setTimeout(function () {
      this.auto_scale()
      setTimeout(this._resize_main_div.bind(context), 1000);
    }.bind(context), 100);*/

    //start redrawing cycle
    this._updateSize();
    this._update_creatures();
    //this._update_cells();
    this.auto_scale();
    this._resize_main_div();
    this._addWheelScaling();
  }

  auto_scale() {
    var scales = this._calcScale();
    var scale = Math.min(scales.sx, scales.sy);
    this.main_group.scale(scale, scale);
    var matrix = this._getElMatrix(this.main_group);
    let no_translate_matrix = this._resetMatrixTranslate(matrix);
    this.main_group.matrix(no_translate_matrix);
  }

  _updateViewBox() {
    let size = {
      width: this.width,
      height: this.height
    };
    let el_matrix = new SVG.Matrix(this.main_group);
    let zero_point = new SVG.Point(0, 0).transform(el_matrix.inverse());
    let max_point = new SVG.Point(size.width, size.height).transform(el_matrix.inverse());
    this._view_box.x1 = Math.ceil(zero_point.x);
    this._view_box.y1 = Math.ceil(zero_point.y);
    this._view_box.x2 = Math.ceil(max_point.x);
    this._view_box.y2 = Math.ceil(max_point.y);
  }

  _addWheelScaling() {
    const scrollSensitivity = 0.1;
    let x = 0;
    let y = 0;
    this.div.addEventListener("mousewheel", function (e) {
      clearTimeout(this._scale_timeout);
      if (!this._scaling) {
        this.dispatchEvent("scaling_start");
        this._scaling = true;
      }
      this._scale_timeout = setTimeout(() => this.dispatchEvent("scaling_end"), 300);

      let evt = window.event || e;
      let scroll = evt.detail ? evt.detail * scrollSensitivity : (evt.wheelDelta / 120) * scrollSensitivity;
      let el_matrix = new SVG.Matrix(this.main_group);
      let pointer = new SVG.Point(x, y).transform(el_matrix.inverse());
      let old_scale = el_matrix.a;
      let new_scale = old_scale * (1 + scroll); //old_scale + scroll;
      let coeff = new_scale / old_scale;
      let new_matrix = el_matrix.scale(coeff, pointer.x, pointer.y);
      //console.log(pointer, x, y)

      this.main_group.matrix(new_matrix)
      this._updateViewBox();

      return true;
    }.bind(this), false);

    let jq_nest = $(this.div);
    this._div_offset = jq_nest.offset();
    this.div.addEventListener("mousemove", function (evt) {
      x = evt.pageX - this._div_offset.left;
      y = evt.pageY - this._div_offset.top;
    }.bind(this));
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
        cells[x][y].food_amount = cell.food_amount;
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

  _updateSize() {
    let jq_div = $(this.div);
    this.width = jq_div.width();
    this.height = jq_div.height()
  }

  _calcScale() {
    return {
      sx: this.width / (this.map.width),
      sy: this.height / (this.map.height),
    }
  }

  _getCreatureSize(creature) {
    return creature.satiety * 0.7;
  }

  _update_creatures() {
    let start_x = Math.max(this._view_box.x1, 0);
    let end_x = Math.min(this.map.width, this._view_box.x2);
    let start_y = Math.max(this._view_box.y1, 0);
    let end_y = Math.min(this.map.height, this._view_box.y2);
    let offset = 3;
    let x_range = new Range(start_x - offset, end_x + offset);
    let y_range = new Range(start_y - offset, end_y + offset);
    for (let entrie of Object.entries(this.creatures_drawings)) {
      let id = entrie[0];
      let drawing = entrie[1];
      let creature = this.creatures_controller.creatures[id];
      if (!x_range.isIn(creature.coordinates.x) || !y_range.isIn(creature.coordinates.y)) {
        drawing.removed = true;
        drawing.remove();
        continue;
      }

      if (drawing.removed) {
        this.main_group.add(drawing);
        drawing.removed = false;
      }

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

      //view range testing
      //drawing.fill({
      //color: no_viewed ? "red" : "green"
      //})
    }
    setTimeout(this._update_creatures.bind(this), this.UPDATE_CREATURES_INTERVAL);
  }

  _update_cells() {
    let offset = 1;
    let start_x = Math.max(this._view_box.x1 - offset, 0);
    let end_x = Math.min(this.map.width, this._view_box.x2 + offset);
    let start_y = Math.max(this._view_box.y1 - offset, 0);
    let end_y = Math.min(this.map.height, this._view_box.y2 + offset);
    //let skips = 0;
    for (let x = 0; x < start_x; x++) {
      for (let y = 0; y < start_y; y++) {
        let drawing = this.cells_drawings[x][y];
        drawing.removed = true;
        drawing.remove();
      }
      for (let y = end_y; y < this.map.height; y++) {
        let drawing = this.cells_drawings[x][y];
        drawing.removed = true;
        drawing.remove();
      }
    }
    for (let x = end_x; x < this.map.width; x++) {
      for (let y = 0; y < start_y; y++) {
        let drawing = this.cells_drawings[x][y];
        drawing.removed = true;
        drawing.remove();
      }
      for (let y = end_y; y < this.map.height; y++) {
        let drawing = this.cells_drawings[x][y];
        drawing.removed = true;
        drawing.remove();
      }
    }

    for (var x = start_x; x < end_x; x++)
      for (var y = start_y; y < end_y; y++) {
        let cell = this.map.cells[x][y];
        let drawing = this.cells_drawings[x][y];
        let old_food_amount = drawing.food_amount;
        let new_food_amount = cell.food_amount;
        if (!drawing.removed && !(new_food_amount != old_food_amount && new_food_amount == cell.MAX_FOOD_AMOUNT) && Math.abs(old_food_amount - new_food_amount) < 0.1) {
          //skips++;          
          continue;
        }
        if (drawing.removed) {
          this.main_group.add(drawing);
          drawing.removed = false;
        }
        let new_color = this._generateCellColor(cell);
        drawing.fill(new_color);
        drawing.food_amount = new_food_amount;
      }
    //console.log(`skips: ${skips}/${(end_x - start_x) * (end_y - start_y)}`);

    setTimeout(this._update_cells.bind(this), this.UPDATE_CELLS_INTERVAL);
  }

  _drawBackground() {
    this.main_group.clear();
    this.main_group.rect(this.map.width, this.map.height).stroke({
      color: "white",
      width: 0.1
    });
  }

  _drawNet() {
    for (var x = 0; x < this.map.width + 1; x++)
      this.main_group.line(x, 0, x, this.map.height).stroke({
        color: "white",
        opacity: 0.5,
        width: 0.05
      });
    for (var y = 0; y < this.map.height + 1; y++)
      this.main_group.line(0, y, this.map.width, y).stroke({
        color: "white",
        opacity: 0.5,
        width: 0.05
      });
  }

  _getElMatrix(el) {
    return el.attr("transform")
      .split("(")[1]
      .replace(")", "")
      .split(",")
      .map((el) => parseFloat(el));
  }
}