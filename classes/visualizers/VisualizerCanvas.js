class VisualizerCanvas {
  constructor(div, map_contoller, creatures_controller) {
    Reactor.apply(this, []);

    this.div = div;
    this.jq_div = $(div);
    this.width = this.jq_div.width();
    this.height = this.jq_div.height();
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

    //initializer canvases
    this.canvas_background = document.createElement("canvas");
    this.canvas_net = document.createElement("canvas");
    this.canvas_cells = document.createElement("canvas");
    this.canvas_creatures = document.createElement("canvas");
    this.canvas_background.id = "canvas_background";
    this.canvas_net.id = "canvas_net";
    this.canvas_cells.id = "canvas_cells";
    this.canvas_creatures.id = "canvas_creatures";
    let canvases = [this.canvas_background, this.canvas_net, this.canvas_cells, this.canvas_creatures];

    this.context_background = this.canvas_background.getContext("2d");
    this.context_net = this.canvas_net.getContext("2d");
    this.context_cells = this.canvas_cells.getContext("2d");
    this.context_creatures = this.canvas_creatures.getContext("2d");
    this.contextes = [this.context_background, this.context_net, this.context_cells, this.context_creatures];

    let z_index = 0;
    for (let canvas of canvases) {
      canvas.setAttribute("style", `position: absolute; z-index: ${z_index++}`);
      canvas.setAttribute("width", this.width);
      canvas.setAttribute("height", this.height);

      this.div.appendChild(canvas);
    }

    //for drawing
    this.render_interval = 100;
    this.matrix = {
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      e: 0,
      f: 0
    }
    this._div_offset = null;
    this._scale_timeout = null;
    this._scaling = false;
    this._view_box = {
      x1: 0,
      x2: Number.MAX_SAFE_INTEGER,
      y1: 0,
      y2: Number.MAX_SAFE_INTEGER
    }

    //events
    this.registerEvent("scaling_start");
    this.registerEvent("scaling_end");

    //start render loop
    this.render();

    this._updateMatrix();
    this.updateTranfsorm();
    this._addWheelScaling();
  }

  updateTranfsorm() {
    for (let context of this.contextes)
      this._applyMatrix(context);
  }

  _updateMatrix() {
    let scale_x = this.width / (this.map.width + 1);
    let scale_y = this.height / (this.map.height + 1);
    let scale = Math.max(scale_x, scale_y);

    //scaling
    this.matrix.a = this.matrix.d = scale;
  }

  _applyMatrix(context) {
    let m = this.matrix;
    context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  _addCreature(creature) {

  }

  _removeCreature(creature) {

  }

  clearAll() {
    for (let context of this.contextes)
      context.clearRect(-1, -1, this.width + 1, this.height + 1);
  }

  renderAll(force = false) {
    this._render_background(force);
    //this._render_net(force);
    this._render_cells(force);
    this._render_creatures(force);
  }

  render() {
    this._render_cells();
    this._render_creatures();

    setTimeout(this.render.bind(this), this.render_interval);
  }

  _render_background() {
    let ctx = this.context_background;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "darkgray"
    ctx.lineWidth = 0.1;
    ctx.strokeRect(0, 0, this.map.width, this.map.height);
  }

  _render_net() {
    let ctx = this.context_net;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.beginPath();
    ctx.lineWidth = 0.01;
    ctx.strokeStyle = "white";
    for (var x = 0; x < this.map.width + 1; x++) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.map.height);
    }
    for (var y = 0; y < this.map.height + 1; y++) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.map.width, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  _render_cells(force) {
    let ctx = this.context_cells;
    if (force)
      ctx.clearRect(0, 0, this.width, this.height);

    let offset = 1;
    let start_x = Math.max(this._view_box.x1 - offset, 0);
    let end_x = Math.min(this.map.width, this._view_box.x2 + offset);
    let start_y = Math.max(this._view_box.y1 - offset, 0);
    let end_y = Math.min(this.map.height, this._view_box.y2 + offset);

    for (var x = start_x; x < end_x; x++) {
      for (var y = start_y; y < end_y; y++) {
        let cell = this.map.cells[x][y];
        let old_food_amount = cell._last_drawed_food_amount
        let new_food_amount = cell.food_amount;
        if (!force && !(new_food_amount != old_food_amount && new_food_amount == cell.MAX_FOOD_AMOUNT) && Math.abs(old_food_amount - new_food_amount) < 0.1)
          continue;

        let color = this._generateCellColor(cell);
        ctx.fillStyle = color;
        ctx.clearRect(x, y, 1, 1);
        ctx.fillRect(x, y, 1, 1);
        cell._last_drawed_food_amount = cell.food_amount;
      }
    }
  }

  _render_creatures() {
    let ctx = this.context_creatures;
    ctx.clearRect(0, 0, this.width, this.height);

    let start_x = Math.max(this._view_box.x1, 0);
    let end_x = Math.min(this.map.width, this._view_box.x2);
    let start_y = Math.max(this._view_box.y1, 0);
    let end_y = Math.min(this.map.height, this._view_box.y2);
    let offset = 3;
    let x_range = new Range(start_x - offset, end_x + offset);
    let y_range = new Range(start_y - offset, end_y + offset);

    for (let creature of Object.values(this.creatures_controller.creatures)) {
      let x = creature.coordinates.x;
      let y = creature.coordinates.y;
      if (!x_range.isIn(creature.coordinates.x) || !y_range.isIn(creature.coordinates.y))
        continue;

      let color = this._generateCreatureColor(creature);
      let size = this._getCreatureSize(creature);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.fillRect(x + 0.5 - size / 2, y + 0.5 - size / 2, size, size);
    }
  }

  _getCreatureSize(creature) {
    return creature.satiety * 0.7;
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
      this._scale_timeout = setTimeout(() => {
        this.dispatchEvent("scaling_end");
      }, 300);

      let evt = window.event || e;
      let scroll = evt.detail ? evt.detail * scrollSensitivity : (evt.wheelDelta / 120) * scrollSensitivity;
      let matrix = new SVG.Matrix();
      for (let i in this.matrix)
        matrix[i] = this.matrix[i];
      let pointer = new SVG.Point(x, y).transform(matrix.inverse());
      let old_scale = this.matrix.a;
      let new_scale = old_scale * (1 + scroll); //old_scale + scroll;
      let coeff = new_scale / old_scale;
      let new_matrix = matrix.scale(coeff, pointer.x, pointer.y);
      //console.log(pointer, x, y)

      for (let i in this.matrix)
        this.matrix[i] = new_matrix[i];

      //this._updateMatrix();
      this.clearAll();
      this._updateViewBox();
      this.updateTranfsorm();
      this.renderAll(true);

      return true;
    }.bind(this), false);

    this._div_offset = this.jq_div.offset();
    this.div.addEventListener("mousemove", function (evt) {
      x = evt.pageX - this._div_offset.left;
      y = evt.pageY - this._div_offset.top;
    }.bind(this));
  }
}