class VisualizerCanvas {
  constructor(div, map_contoller, creatures_controller) {
    Reactor.apply(this, []);

    this.div = div;
    this.jq_div = $(div);
    this.width = this.jq_div.width();
    this.height = this.jq_div.height();
    this.map_contoller = map_contoller;
    this.creatures_controller = creatures_controller
      .addEventListener(
        creatures_controller.NEW_CREATURE_EVENT,
        this._addCreature.bind(this),
      )
      .addEventListener(
        creatures_controller.DEAD_CREATURE_EVENT,
        this._removeCreature.bind(this),
      );
    this.map = map_contoller.map;
    this.creatures_drawed = {};

    // initializer canvases
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
    for (let i = 0; i < this.canvases.length; i++) {
      const canvas = this.canvases[i];
      canvas.setAttribute("style", `position: absolute; z-index: ${z_index++}`);
      canvas.setAttribute("width", this.width);
      canvas.setAttribute("height", this.height);

      this.div.appendChild(canvas);
    }

    // for drawing
    this.render_interval = 100;
    this.matrix = {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
    };
    this._div_offset = null;
    this._scale_timeout = null;
    this._scaling = false;
    this._view_box = {
      x1: 0,
      x2: Number.MAX_SAFE_INTEGER,
      y1: 0,
      y2: Number.MAX_SAFE_INTEGER,
    };
    this._x_draw_range = new Range(this._view_box.x1, this._view_box.x2);
    this._y_draw_range = new Range(this._view_box.y1, this._view_box.y2);

    // events
    this.registerEvent("scaling_start");
    this.registerEvent("scaling_end");

    this._autoAdjust();
    this.clearAll();
    this._updateViewBox();
    this.updateTranfsorm();
    this.renderAll(true);
    this._addWheelScaling();
    this._addKeybindings();

    // start render loop
    this.render();
  }

  updateTranfsorm() {
    for (let i = 0; i < this.contextes.length; i++)
      this._applyMatrix(this.contextes[i]);
  }

  _autoAdjust() {
    this.width = this.jq_div.width();
    this.height = this.jq_div.height();
    const scale_x = this.width / (this.map.width + 1);
    const scale_y = this.height / (this.map.height + 1);
    const scale = Math.min(scale_x, scale_y);

    // scaling
    this.matrix = {
      a: scale,
      b: 0,
      c: 0,
      d: scale,
      e: 0,
      f: 0,
    };

    // canvas adjusting
    for (let i = 0; i < this.canvases.length; i++) {
      const canvas = this.canvases[i];
      canvas.setAttribute("width", this.width);
      canvas.setAttribute("height", this.height);
    }
  }

  _applyMatrix(context) {
    const m = this.matrix;
    context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  _addCreature(creature) {
    return this;
  }

  _removeCreature(creature) {
    const ctx = this.context_creatures;
    if (!(creature.id in this.creatures_drawed))
      return;
    const drawed = this.creatures_drawed[creature.id];
    ctx.clearRect(drawed.x, drawed.y, 1, 1);
    delete this.creatures_drawed[creature.id];
  }

  clearAll() {
    for (let i = 0; i < this.contextes.length; i++)
      this.contextes[i].clearRect(-1, -1, this.width + 1, this.height + 1);
  }

  renderAll(forced = false) {
    this._render_background(forced);
    // this._render_net(forced);
    this._render_cells(forced);
    this._render_creatures(forced);
  }

  render() {
    const binded_render_fun = this.render.bind(this);
    this._render_cells();
    this._render_creatures();

    window.requestAnimationFrame(binded_render_fun);
    // setTimeout(this.render.bind(this), this.render_interval);
  }

  _render_background() {
    const ctx = this.context_background;
    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "darkgray";
    ctx.lineWidth = 0.1;
    ctx.strokeRect(0, 0, this.map.width, this.map.height);
    ctx.restore();
  }

  _render_net() {
    const ctx = this.context_net;
    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.beginPath();
    ctx.lineWidth = 0.01;
    ctx.strokeStyle = "white";
    for (let x = 0; x < this.map.width + 1; x++) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.map.height);
    }
    for (let y = 0; y < this.map.height + 1; y++) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.map.width, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  _render_cells(forced) {
    const ctx = this.context_cells;
    ctx.save();
    if (forced)
      ctx.clearRect(0, 0, this.width, this.height);

    for (let x = this._x_draw_range.from; x < this._x_draw_range.to; x++) {
      for (let y = this._y_draw_range.from; y < this._y_draw_range.to; y++) {
        const cell = this.map.cells[x][y];
        const old_food_amount = cell._last_drawed_food_amount;
        const new_food_amount = cell.food_amount;
        if (
          (Math.abs(old_food_amount - new_food_amount) > 0.1 && !cell.is_sea) ||
          cell._last_drawed_type !== cell.is_sea ||
          (new_food_amount !== old_food_amount && new_food_amount === cell.MAX_FOOD_AMOUNT) ||
          forced) {
          // const color = `hsl(210, 100%, ${new_food_amount * 100}%)`; // this._generateCellColor(cell);
          const color = this._generateCellColor(cell);
          ctx.fillStyle = color;
          // ctx.clearRect(x, y, 1, 1);
          ctx.fillRect(x, y, 1, 1);
          cell._last_drawed_food_amount = new_food_amount;
          cell._last_drawed_type = cell.is_sea;
        }
      }
    }
    ctx.restore();
  }

  _render_creatures(forced) {
    const ctx = this.context_creatures;
    ctx.save();
    // ctx.clearRect(0, 0, this.width, this.height);
    let skipped = 0;
    let skipped_position = 0;
    let drawed_creatures = 0;
    const creatures = Object.values(this.creatures_controller.creatures);
    /* eslint-disable no-continue */
    for (let i = 0; i < creatures.length; i++) {
      const creature = creatures[i];
      const [x, y] = [creature.coordinates.x, creature.coordinates.y];
      const pre_processed = creature.id in this.creatures_drawed;
      const drawed = this.creatures_drawed[creature.id];
      if (!pre_processed && (!this._x_draw_range.isIn(x, true) || !this._y_draw_range.isIn(y, true)))
        continue;
      if (pre_processed && (!this._x_draw_range.isIn(drawed.x, true) || !this._y_draw_range.isIn(drawed.y, true))) {
        skipped_position++;
        continue;
      }

      const color =
        pre_processed ?
        this.creatures_drawed[creature.id].color :
        this._generateCreatureColor(creature);
      const size = this._getCreatureSize(creature);

      const trigger_move = 1;
      const trigger_size = 0.1;
      if (!forced && pre_processed &&

        Math.abs(drawed.x - x) < trigger_move &&
        Math.abs(drawed.y - y) < trigger_move &&
        Math.abs(drawed.size - size) < trigger_size
      ) {
        skipped++;
        continue;
      }

      if (pre_processed)
        ctx.clearRect(drawed.x, drawed.y, 1, 1);
      this.creatures_drawed[creature.id] = {
        size,
        color,
        x,
        y,
      };

      ctx.fillStyle = color;
      ctx.fillRect(x + 0.5 - size / 2, y + 0.5 - size / 2, size, size);

      drawed_creatures++;
    }
    /* eslint-enable no-continue */
    ctx.restore();
  }

  // eslint-disable-next-line class-methods-use-this
  _getCreatureSize(creature) {
    return Math.max(creature.satiety, 0.2) * 0.7;
  }

  // eslint-disable-next-line class-methods-use-this
  _generateCellColor(cell) {
    if (cell.is_sea)
      return "#4d94ff";

    const additional_food_coeff = 0.7;
    const additional_food = cell.MAX_FOOD_AMOUNT * additional_food_coeff;
    const hue = Math.round(30 + cell.food_type * 330);
    // let hue = Math.round(cell.food_type * 360);
    const sat = 20;
    const light =
      Math.round(
        (cell.food_amount + additional_food) / (cell.MAX_FOOD_AMOUNT + additional_food) * 40,
      );
    const color = `hsl(${hue}, ${sat}%, ${light}%)`;
    return color;
  }

  // eslint-disable-next-line class-methods-use-this
  _generateCreatureColor(creature) {
    const hue = Math.round(30 + creature.eating_type * 330);
    // let hue = Math.round(creature.eating_type * 360);
    const sat = 50;
    const light = Math.round(Math.max(creature.satiety, 0.5) * 100);
    const color = `hsl(${hue}, ${sat}%, ${light}%)`;
    return color;
  }

  _updateViewBox() {
    const size = {
      width: this.width,
      height: this.height,
    };
    const el_matrix = new SVG.Matrix(this.matrix);

    const zero_point = new SVG.Point(0, 0).transform(el_matrix.inverse());
    const max_point = new SVG.Point(size.width, size.height).transform(el_matrix.inverse());
    this._view_box.x1 = Math.ceil(zero_point.x);
    this._view_box.y1 = Math.ceil(zero_point.y);
    this._view_box.x2 = Math.ceil(max_point.x);
    this._view_box.y2 = Math.ceil(max_point.y);

    const offset = 1;
    const start_x = Math.max(this._view_box.x1 - offset, 0);
    const end_x = Math.min(this.map.width, this._view_box.x2 + offset);
    const start_y = Math.max(this._view_box.y1 - offset, 0);
    const end_y = Math.min(this.map.height, this._view_box.y2 + offset);
    this._x_draw_range = new Range(start_x, end_x);
    this._y_draw_range = new Range(start_y, end_y);
  }

  _addKeybindings() {
    window.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyR":
          this._autoAdjust();
          this.clearAll();
          this._updateViewBox();
          this.updateTranfsorm();
          this.renderAll(true);
          break;
        default:
          break;
      }
    });
  }

  _addWheelScaling() {
    const scrollSensitivity = 0.1;
    let x = 0;
    let y = 0;
    this.div.addEventListener("mousewheel", (e) => {
      clearTimeout(this._scale_timeout);
      if (!this._scaling) {
        this.dispatchEvent("scaling_start");
        this._scaling = true;
      }
      this._scale_timeout = setTimeout(() => {
        this.dispatchEvent("scaling_end");
        this._scaling = false;
      }, 300);

      const evt = window.event || e;
      const scroll = evt.detail ? evt.detail * scrollSensitivity : (evt.wheelDelta / 120) * scrollSensitivity;
      const matrix = new SVG.Matrix(this.matrix);

      const pointer = new SVG.Point(x, y).transform(matrix.inverse());
      const old_scale = this.matrix.a;
      const new_scale = old_scale * (1 + scroll);
      const coeff = new_scale / old_scale;
      const new_matrix = matrix.scale(coeff, pointer.x, pointer.y);

      this.matrix = new_matrix;

      this.clearAll();
      this._updateViewBox();
      this.updateTranfsorm();
      this.renderAll(true);

      return true;
    }, false);

    this._div_offset = this.jq_div.offset();
    this.div.addEventListener("mousemove", (evt) => {
      x = evt.pageX - this._div_offset.left;
      y = evt.pageY - this._div_offset.top;
    });
  }
}