class SimVisualizer {
  constructor(div, map_contoller, creatures_controller) {
    //constants
    this.VISUALIZER_CONSTRUCTOR = VisualizerSVG;

    this.visualizer = new this.VISUALIZER_CONSTRUCTOR(div, map_contoller, creatures_controller);
  }
}

////////////////// DEPRECATED //////////////////