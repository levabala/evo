var div_map = document.getElementById("div_drawing");
var div_graph = document.getElementById("div_graph");
var size = 100;
var coeff_x = 6 / 11;
var coeff_y = 5 / 11;
var plot = new SimplePlot(div_graph, 100);
var map = new SimMap(Math.floor(size * coeff_x), Math.floor(size * coeff_y));
var map_controller = new MapController(map);
var creatures_controller = new CreaturesController(map);
var sim_visualizer = new VisualizerSVG(div_map, map_controller, creatures_controller);
var master = new SimMaster(
  sim_visualizer, creatures_controller, map_controller, 100, 1
);

setTimeout(function() {
  var sim_observer =
    new SimObserver(master)
      .addEventListener("updates", function() {
        let last_several = _.takeRight(sim_observer.logs.creatures_count, 300)
        plot.applyDataSimple(last_several);
      });
}.bind(this), 2000)

master.startSimulation();