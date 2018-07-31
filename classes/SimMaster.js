class SimMaster {
  constructor(
    visualizer, creatures_controller, map_controller,
    tick_interval = 20, sim_speed = 1) {
    this.visualizer = visualizer;
    this.creatures_controller = creatures_controller;
    this.map_controller = map_controller;
    this.tick_interval = tick_interval;
    this.sim_speed = sim_speed;
    this.last_tick_duration = 0;
    this.ticks_counter = 0;

    this.lastTimecode = null
    this.simulationTimeout = null;
  }

  resetSimulation() {
    clearTimeout(this.simulationTimeout);
    this.map_controller.reset();
    this.creatures_controller.reset();
  }

  startSimulation() {
    this.continueSimulation();
  }

  continueSimulation() {
    this.lastTimecode = Date.now();
    this.simulationTimeout = setTimeout(this.simulationTick.bind(this), 0);
  }

  pauseSimulation() {
    clearTimeout(this.simulationTimeout);
  }

  simulationTick() {
    var nowTime = Date.now();
    var timeDelta = (nowTime - this.lastTimecode) * this.sim_speed;

    console.log(`---------- Tick #${this.ticks_counter++} dur: ${this.last_tick_duration}ms ----------`);

    this.map_controller.tick(timeDelta);

    this.creatures_controller.tick(timeDelta);

    var nextTickDelay = Math.max(this.tick_interval - (Date.now() - nowTime), 0);
    this.simulationTimeout = setTimeout(this.simulationTick.bind(this), nextTickDelay);

    this.lastTimecode = nowTime;
    this.last_tick_duration = Date.now() - nowTime;
  }
}