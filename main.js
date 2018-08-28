var div_map = document.getElementById("div_drawing");
var div_graph_population = document.getElementById("div_graph2");
var div_graph_generation = document.getElementById("div_graph1");
var div_info = document.getElementById("div_info");
var range_sim_speed = document.getElementById("range_sim_speed");
var size = 400;
var coeff_x = 16 / 25;
var coeff_y = 9 / 25;
var plot_population = new SimplePlot(div_graph_population, 100, "darkgreen");
var plot_generation = new SimplePlot(div_graph_generation, 100, "red");
var map = new SimMap(Math.floor(size * coeff_x), Math.floor(size * coeff_y));
var map_controller = new MapController(map);
var creatures_controller = new CreaturesController(map);
var master = new SimMaster(
  creatures_controller, map_controller, 100, 400
);
var sim_visualizer =
  new VisualizerCanvas(div_map, map_controller, creatures_controller)
  .addEventListener("scaling_start", () => master.pauseSimulation())
  .addEventListener("scaling_end", () => master.continueSimulation());

var evo_stimulator = new EvoStimulator(master);
var info_box = new InfoBox(div_info);
let sim_saver = new SimSaver(master);

let power = 2;
range_sim_speed.revert_set = true;
range_sim_speed.value = Math.pow(master.sim_speed, 1 / power);
range_sim_speed.oninput = function () {
  if (!range_sim_speed.revert_set) {
    master.sim_speed = Math.pow(this.value, power);
  }
}
range_sim_speed.onmousemove = () => {
  range_sim_speed.revert_set = false;
}
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
      /*plot_generation.applyDataSimple(
        _.takeRight(sim_observer.logs.max_generation, 300)
      );*/
    })
    .connectInfoBox(info_box);
}.bind(this), 500);

window.onload = () => master.startSimulation();