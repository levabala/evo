var div_map = document.getElementById("div_drawing");
var div_net = document.getElementById("div_net");
var size = 150;
var coeff_x = 25 / 55;
var coeff_y = 30 / 55;
//var map = new SimMap(100, 50);
var map = new SimMap(Math.floor(size * coeff_x), Math.floor(size * coeff_y));
var map_controller = new MapController(map);
var creatures_controller = new CreaturesController(map);
var sim_visualizer = new VisualizerSVG(div_map, map_controller, creatures_controller);
var master = new SimMaster(sim_visualizer, creatures_controller, map_controller, 20, 5);

master.startSimulation();

//var net_visualizer = new VisualizerNet(div_net, )