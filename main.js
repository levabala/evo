const div_map = document.getElementById("div_drawing");
const div_graph_population = document.getElementById("div_graph2");
const div_graph_generation = document.getElementById("div_graph1");
const div_info = document.getElementById("div_info");
const range_sim_speed = document.getElementById("range_sim_speed");
const size = 600;
const coeff_x = 16 / 25;
const coeff_y = 9 / 25;
const plot_population = new SimplePlot(div_graph_population, 100, "darkgreen");
const plot_generation = new SimplePlot(div_graph_generation, 100, "red");
const map = new SimMap(Math.floor(size * coeff_x), Math.floor(size * coeff_y));
const map_controller = new MapController(map);
const creatures_controller = new CreaturesController(map);
const master = new SimMaster(
  creatures_controller, map_controller, 100, 400,
);
const sim_visualizer = new VisualizerCanvas(div_map, map_controller, creatures_controller)
  .addEventListener("scaling_start", () => master.pauseSimulation())
  .addEventListener("scaling_end", () => master.continueSimulation());

const evo_stimulator = new EvoStimulator(master);
const info_box = new InfoBox(div_info);
const sim_saver = new SimSaver(master);

const power = 2;
range_sim_speed.revert_set = true;
range_sim_speed.value = master.sim_speed ** (1 / power);
range_sim_speed.oninput = function OnInputCallback() {
  if (!range_sim_speed.revert_set)
    master.sim_speed = this.value ** power;
};
range_sim_speed.onmousemove = () => {
  range_sim_speed.revert_set = false;
};
master.addEventListener("sim_speed_changed", () => {
  if (range_sim_speed.value !== master.sim_speed) {
    range_sim_speed.value = master.sim_speed ** (1 / power);
    range_sim_speed.revert_set = true;
  }
});

setTimeout(() => {
  const sim_observer = new SimObserver(master)
    .addEventListener("updates", () => {

      /* plot_population.applyDataSimple(
        _.takeRight(sim_observer.logs.creatures_count, 300)
      );
      plot_generation.applyDataSimple(
        _.takeRight(sim_observer.logs.max_generation, 300)
      ); */
    })
    .connectInfoBox(info_box);
}, 500);

window.onload = () => master.startSimulation();

// clear console
setInterval(() => console.clear(), 10000);