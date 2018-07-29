class VisualizerSVG {
  constructor(div, map_contoller, creatures_controller) {
    this.div = div;
    this.draw = SVG(div).size("95%", "95%");
    this.main_nest = this.draw.nested().fill("red");
    this.main_group = this.main_nest.group();
    this.map_contoller = map_contoller;
    this.creatures_controller = creatures_controller;
    this.map = map_contoller.map;
    //this.zero_matrix = this.main_group.

    this._drawBackground();
    setTimeout(() => this.auto_scale(), 100);
  }

  auto_scale() {
    var scales = this._calcScale();
    console.log(scales)
    this.main_group.scale(scales.sx, scales.sy);
  }

  _calcScale() {
    let jq_div = $(this.div);
    console.log(this.map.width, jq_div.width(), jq_div.height())
    return {
      sx: jq_div.width() / this.map.width,
      sy: jq_div.height() / this.map.height,
    }
  }

  _drawBackground() {
    this.main_group.clear();
    let background_rect = this.main_group.rect().size(
      this.map.width,
      this.map.height,
    ).move(this.map.width,
      this.map.height).fill({ color: "#FFFFFF", opacity: 0.1 });
    //let rect2 = this.main_group.rect(100, 100).fill("none").back();
  }

  _drawNet() {
    for (var x = 0; x < this.map.width; x++) {
      let line = this.main_group.line(x, 0, x, this.map.height).stroke({ color: "white", opacity: 0.3 });
      for (var y = 0; y < this.map.height; y++) {

      }
    }
  }
}