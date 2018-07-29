var div = document.getElementById("div_drawing");
var map = new SimMap(20, 10);
var map_controller = new MapController(map);
var creatures_controller = new CreaturesController(map);
var sim_visualizer = new VisualizerSVG(div, map_controller, creatures_controller);
var master = new SimMaster(sim_visualizer, creatures_controller, map_controller);

master.startSimulation();