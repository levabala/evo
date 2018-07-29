class VisualizerSVG {
  constructor(div, map_contoller, creatures_controller) {
    this.div = div;
    this.draw = SVG(div).size("95%", "95%");
    this.main_nest = this.draw.nested();
    this.main_group = this.main_nest.group();
    this.map_contoller = map_contoller;
    this.creatures_controller = creatures_controller;
    this.map = map_contoller.map;

    this._drawBackground();
    this._drawNet();
    setTimeout(() => this.auto_scale(), 100);
  }

  auto_scale() {
    var scales = this._calcScale();
    var scale = Math.min(scales.sx, scales.sy);
    this.main_group.scale(scale, scale);
    var matrix = this._getElMatrix(this.main_group);
    let no_translate_matrix = this._resetMatrixTranslate(matrix);
    this.main_group.matrix(no_translate_matrix);
  }

  _resetMatrixTranslate(matrix) {
    var map = [1, 1, 1, 1, 0, 0];
    return matrix.map((item, i, array) => item * map[i]);
  }

  _calcScale() {
    let jq_div = $(this.div);
    return {
      sx: jq_div.width() / this.map.width,
      sy: jq_div.height() / this.map.height,
    }
  }

  _drawBackground() {
    this.main_group.clear();
    /*let background_rect = this.main_group.rect().size(
      this.map.width,
      this.map.height,
    ).move(this.map.width,
      this.map.height).fill({ color: "#FFFFFF", opacity: 0.1 });*/
    //let rect2 = this.main_group.rect(100, 100).fill("none").back();
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