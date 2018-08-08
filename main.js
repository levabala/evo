var div_map = document.getElementById("div_drawing");
var div_graph_population = document.getElementById("div_graph2");
var div_graph_generation = document.getElementById("div_graph1");
var div_info = document.getElementById("div_info");
var range_sim_speed = document.getElementById("range_sim_speed");
var size = 100;
var coeff_x = 9 / 13;
var coeff_y = 5 / 13;
var plot_population = new SimplePlot(div_graph_population, 100, "darkgreen");
var plot_generation = new SimplePlot(div_graph_generation, 100, "red");
var map = new SimMap(Math.floor(size * coeff_x), Math.floor(size * coeff_y));
var map_controller = new MapController(map);
var creatures_controller = new CreaturesController(map);
var sim_visualizer = new VisualizerSVG(div_map, map_controller, creatures_controller);
var master = new SimMaster(
  sim_visualizer, creatures_controller, map_controller, 100, 30
);
var evo_stimulator = new EvoStimulator(master);
var info_box = new InfoBox(div_info);

let power = 2;
range_sim_speed.value = Math.pow(master.sim_speed, 1 / power);
range_sim_speed.oninput = function () {
  if (!range_sim_speed.revert_set)
    master.sim_speed = Math.pow(this.value, power);
  else
    range_sim_speed.revert_set = false;
}
range_sim_speed.onclick = () => range_sim_speed.revert_set = false;
master.addEventListener("sim_speed_changed", function () {
  if (range_sim_speed.value != master.sim_speed) {
    range_sim_speed.value = Math.pow(master.sim_speed, 1 / power);
    range_sim_speed.revert_set = true;
  }
});

setTimeout(function () {
  var sim_observer =
    new SimObserver(master)
    .addEventListener("updates", function () {
      plot_population.applyDataSimple(
        _.takeRight(sim_observer.logs.creatures_count, 300)
      );
      plot_generation.applyDataSimple(
        _.takeRight(sim_observer.logs.max_generation, 300)
      );
    })
    .connectInfoBox(info_box);
}.bind(this), 500);

master.startSimulation();