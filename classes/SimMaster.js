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
    this.launch_time = Date.now();
    this.sim_time = 0;

    this.lastTimecode = null
    this.simulationTimeout = null;
  }

  resetSimulation() {
    clearTimeout(this.simulationTimeout);
    this.map_controller.reset();
    this.creatures_controller.reset();
  }

  startSimulation() {
    this.lastTimecode = Date.now() - 30000 / this.sim_speed;
    this.simulationTick();
    this.launch_time = Date.now();
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
    this.sim_time += timeDelta;

    console.log(`--- Tick #${this.ticks_counter++} dur: ${this.last_tick_duration}ms ---`);
    console.log(`real duration: ${Math.round((Date.now() - this.launch_time) / 1000)}secs`)
    console.log(`sim duration: ${Math.floor(this.sim_time / 1000)}sec`)
    console.log(`maximal age: ${Math.floor(this.creatures_controller.maximal_age / 1000)}secs`)
    console.log(`maximal generation: ${this.creatures_controller.maximal_generation}`)
    console.log(`latest creature id: #${this.creatures_controller.creatures_counter}`)

    this.map_controller.tick(timeDelta);

    this.creatures_controller.tick(timeDelta);

    var nextTickDelay = Math.max(this.tick_interval - (Date.now() - nowTime), 0);
    this.simulationTimeout = setTimeout(this.simulationTick.bind(this), nextTickDelay);

    this.lastTimecode = nowTime;
    this.last_tick_duration = Date.now() - nowTime;
  }
}