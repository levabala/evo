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
    this.creatures_drawed = {};

    //initializer canvases
    this.canvas_background = document.createElement("canvas");
    this.canvas_net = document.createElement("canvas");
    this.canvas_cells = document.createElement("canvas");
    this.canvas_creatures = document.createElement("canvas");
    this.canvas_background.id = "canvas_background";
    this.canvas_net.id = "canvas_net";
    this.canvas_cells.id = "canvas_cells";
    this.canvas_creatures.id = "canvas_creatures";
    this.canvases = [this.canvas_background, this.canvas_net, this.canvas_cells, this.canvas_creatures];

    this.context_background = this.canvas_background.getContext("2d");
    this.context_net = this.canvas_net.getContext("2d");
    this.context_cells = this.canvas_cells.getContext("2d");
    this.context_creatures = this.canvas_creatures.getContext("2d");
    this.contextes = [this.context_background, this.context_net, this.context_cells, this.context_creatures];

    let z_index = 0;
    for (let canvas of this.canvases) {
      canvas.setAttribute("style", `position: absolute; z-index: ${z_index++}`);
      canvas.setAttribute("width", this.width);
      canvas.setAttribute("height", this.height);

      this.div.appendChild(canvas);
    }

    //for drawing
    this.render_interval = 100;
    this.matrix = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
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
    this._x_draw_range = new Range(this._view_box.x1, this._view_box.x2);
    this._y_draw_range = new Range(this._view_box.y1, this._view_box.y2);

    //events
    this.registerEvent("scaling_start");
    this.registerEvent("scaling_end");

    this._autoAdjust();
    this.clearAll();
    this._updateViewBox();
    this.updateTranfsorm();
    this.renderAll(true);
    this._addWheelScaling();
    this._addKeybindings();

    //start render loop
    this.render();
  }

  updateTranfsorm() {
    for (let context of this.contextes)
      this._applyMatrix(context);
  }

  _autoAdjust() {
    this.width = this.jq_div.width();
    this.height = this.jq_div.height();
    let scale_x = this.width / (this.map.width + 1);
    let scale_y = this.height / (this.map.height + 1);
    let scale = Math.min(scale_x, scale_y);

    //scaling
    this.matrix = {
      a: scale,
      b: 0,
      c: 0,
      d: scale,
      e: 0,
      f: 0
    }

    //canvas adjusting
    for (let canvas of this.canvases) {
      canvas.setAttribute("width", this.width);
      canvas.setAttribute("height", this.height);
    }
  }

  _applyMatrix(context) {
    let m = this.matrix;
    context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  _addCreature(creature) {

  }

  _removeCreature(creature) {
    let ctx = this.context_creatures;
    if (!(creature.id in this.creatures_drawed))
      return;
    let drawed = this.creatures_drawed[creature.id];
    ctx.clearRect(drawed.x, drawed.y, 1, 1);
    delete this.creatures_drawed[creature.id];
  }

  clearAll() {
    for (let context of this.contextes)
      context.clearRect(-1, -1, this.width + 1, this.height + 1);
  }

  renderAll(forced = false) {
    this._render_background(forced);
    //this._render_net(forced);
    this._render_cells(forced);
    this._render_creatures(forced);
  }

  render() {
    const binded_render_fun = this.render.bind(this);
    this._render_cells();
    this._render_creatures();

    window.requestAnimationFrame(binded_render_fun)
    //setTimeout(this.render.bind(this), this.render_interval);
  }

  _render_background() {
    let ctx = this.context_background;
    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "darkgray"
    ctx.lineWidth = 0.1;
    ctx.strokeRect(0, 0, this.map.width, this.map.height);
    ctx.restore();
  }

  _render_net() {
    let ctx = this.context_net;
    ctx.save();
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
    ctx.restore();
  }

  _render_cells(forced) {
    let ctx = this.context_cells;
    ctx.save();
    if (forced)
      ctx.clearRect(0, 0, this.width, this.height);

    for (var x = this._x_draw_range.from; x < this._x_draw_range.to; x++) {
      for (var y = this._y_draw_range.from; y < this._y_draw_range.to; y++) {
        let cell = this.map.cells[x][y];
        let old_food_amount = cell._last_drawed_food_amount
        let new_food_amount = cell.food_amount;
        if ((cell._last_drawed_type == cell.is_sea) && !forced && !(new_food_amount != old_food_amount && new_food_amount == cell.MAX_FOOD_AMOUNT) && Math.abs(old_food_amount - new_food_amount) < 0.1)
          continue;

        //let color = `hsl(210, 100%, ${new_food_amount * 100}%)`; //this._generateCellColor(cell);
        let color = this._generateCellColor(cell);
        ctx.fillStyle = color;
        ctx.clearRect(x, y, 1, 1);
        ctx.fillRect(x, y, 1, 1);
        cell._last_drawed_food_amount = new_food_amount;
        cell._last_drawed_type = cell.is_sea;
      }
    }
    ctx.restore();
  }

  _render_creatures(forced) {
    let ctx = this.context_creatures;
    ctx.save();
    //ctx.clearRect(0, 0, this.width, this.height);
    let skipped = 0;
    let skipped_position = 0;
    for (let creature of Object.values(this.creatures_controller.creatures)) {
      let x = creature.coordinates.x;
      let y = creature.coordinates.y;
      let pre_processed = creature.id in this.creatures_drawed;
      let drawed = this.creatures_drawed[creature.id];
      if (pre_processed && (!this._x_draw_range.isIn(drawed.x, true) || !this._y_draw_range.isIn(drawed.y, true))) {
        skipped_position++;
        continue;
      }

      let color =
        pre_processed ?
        this.creatures_drawed[creature.id].color :
        this._generateCreatureColor(creature);
      let size = this._getCreatureSize(creature);

      const trigger_move = 1;
      const trigger_size = 0.1
      if (!forced && pre_processed &&
        !(
          Math.abs(drawed.x - x) >= trigger_move ||
          Math.abs(drawed.y - y) >= trigger_move ||
          Math.abs(drawed.size - size) >= trigger_size
        )) {
        skipped++;
        continue;
      }

      if (pre_processed)
        ctx.clearRect(drawed.x, drawed.y, 1, 1);
      this.creatures_drawed[creature.id] = {
        size: size,
        color: color,
        x: x,
        y: y
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.fillRect(x + 0.5 - size / 2, y + 0.5 - size / 2, size, size);
    }
    //console.log(skipped, skipped_position)
    ctx.restore();
  }

  _getCreatureSize(creature) {
    return creature.satiety * 0.7;
  }

  _generateCellColor(cell) {
    if (cell.is_sea) {
      return "#4d94ff";
    }
    const additional_food_coeff = 0.7;
    let additional_food = cell.MAX_FOOD_AMOUNT * additional_food_coeff;
    let hue = Math.round(30 + cell.food_type * 330);
    //let hue = Math.round(cell.food_type * 360);
    let sat = 20;
    let light =
      Math.round(
        (cell.food_amount + additional_food) / (cell.MAX_FOOD_AMOUNT + additional_food) * 40
      );
    let color = `hsl(${hue}, ${sat}%, ${light}%)`;
    return color;
  }

  _generateCreatureColor(creature) {
    let hue = Math.round(30 + creature.eating_type * 330);
    //let hue = Math.round(creature.eating_type * 360);
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
    let el_matrix = new SVG.Matrix();
    for (let i in this.matrix)
      el_matrix[i] = this.matrix[i];
    let zero_point = new SVG.Point(0, 0).transform(el_matrix.inverse());
    let max_point = new SVG.Point(size.width, size.height).transform(el_matrix.inverse());
    this._view_box.x1 = Math.ceil(zero_point.x);
    this._view_box.y1 = Math.ceil(zero_point.y);
    this._view_box.x2 = Math.ceil(max_point.x);
    this._view_box.y2 = Math.ceil(max_point.y);

    let offset = 1;
    let start_x = Math.max(this._view_box.x1 - offset, 0);
    let end_x = Math.min(this.map.width, this._view_box.x2 + offset);
    let start_y = Math.max(this._view_box.y1 - offset, 0);
    let end_y = Math.min(this.map.height, this._view_box.y2 + offset);
    this._x_draw_range = new Range(start_x, end_x);
    this._y_draw_range = new Range(start_y, end_y);
  }

  _addKeybindings() {
    window.addEventListener("keypress", function (e) {
      switch (e.code) {
        case "KeyR":
          this._autoAdjust();
          this.clearAll();
          this._updateViewBox();
          this.updateTranfsorm();
          this.renderAll(true);
          break;
      }
    }.bind(this));
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
        this._scaling = false;
      }, 300);

      let evt = window.event || e;
      let scroll = evt.detail ? evt.detail * scrollSensitivity : (evt.wheelDelta / 120) * scrollSensitivity;
      let matrix = new SVG.Matrix();
      for (let i in this.matrix)
        matrix[i] = this.matrix[i];
      let pointer = new SVG.Point(x, y).transform(matrix.inverse());
      let old_scale = this.matrix.a;
      let new_scale = old_scale * (1 + scroll);
      let coeff = new_scale / old_scale;
      let new_matrix = matrix.scale(coeff, pointer.x, pointer.y);

      for (let i in this.matrix)
        this.matrix[i] = new_matrix[i];

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