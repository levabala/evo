class VisualizerNet {
  constructor(div, net) {
    this.div = div;
    this.net = net;
    this.draw = SVG(div).size("95%", "95%");
    this.main_nest = this.draw.nested();
    this.main_group = this.main_nest.group();
  }
}