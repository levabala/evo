class SimMaster {
  constructor(
    creatures_controller, map_controller,
    tick_interval = 20, sim_speed = 1) {
    Reactor.apply(this, []);

    this.creatures_controller = creatures_controller;
    this.map_controller = map_controller;
    this._tick_interval = tick_interval;
    this._sim_speed = sim_speed;
    this.last_tick_duration = 0;
    this.ticks_counter = 0;
    this.launch_time = Date.now();
    this.targered_sim_speed = sim_speed;
    this.sim_time = 0;
    this.debug = false;
    this.paused = false;

    this.lastTimecode = null;
    this.simulationTimeout = null;

    //constants
    this.MAX_TICK_SIM_TIME = 7000;
    this.MAP_UPDATE_FREQ = 2; //1 update per 10 ticks

    //events
    this.registerEvent("tick_start");
    this.registerEvent("tick_end");
    this.registerEvent("sim_speed_changed");
  }

  set sim_speed(value) {
    let last = this.sim_speed;
    this._sim_speed = value;
    this.targered_sim_speed = value;
    this.dispatchEvent("sim_speed_changed", {
      last: last,
      new: value
    });
  }

  get sim_speed() {
    return this._sim_speed;
  }

  set tick_interval(value) {
    this._tick_interval = Math.min(value, 500);
  }

  get tick_interval() {
    return this._tick_interval;
  }

  silentSimSpeed(value) {
    let last = this.sim_speed;
    this._sim_speed = value;
    this.dispatchEvent("sim_speed_changed", {
      last: last,
      new: value
    });
  }

  resetSimulation() {
    clearTimeout(this.simulationTimeout);
    this.map_controller.reset();
    this.creatures_controller.reset();
  }

  startSimulation() {
    this.lastTimecode = Date.now() - 30000 / this._sim_speed;
    this.simulationTick();
    this.launch_time = Date.now();
  }

  continueSimulation() {
    this.lastTimecode = this.creatures_controller.last_tick_timecode = Date.now();
    this.paused = false;

    for (let x = 0; x < this.map_controller.map.width; x++)
      for (let y = 0; y < this.map_controller.map.height; y++)
        this.map_controller.map.cells[x][y].last_update_timecode = this.lastTimecode - this.map_controller.map.cells[x][y].buffer;

    this.simulationTick();
  }

  pauseSimulation() {
    clearTimeout(this.simulationTimeout);
    this.paused = true;

    let nowTime = Date.now();
    for (let x = 0; x < this.map_controller.map.width; x++)
      for (let y = 0; y < this.map_controller.map.height; y++)
        this.map_controller.map.cells[x][y].buffer = nowTime - this.map_controller.map.cells[x][y].last_update_timecode;
  }

  simulationTick() {
    if (this.paused)
      return;

    this.dispatchEvent("tick_start");

    var nowTime = Date.now();
    //this._sim_speed = Math.min(this._sim_speed, this._tick_interval);
    var timeDelta = (nowTime - this.lastTimecode) * this._sim_speed;
    timeDelta = Math.min(timeDelta, this.MAX_TICK_SIM_TIME);
    this.sim_time += timeDelta;

    if (this.debug) {
      console.log(`--- Tick #${this.ticks_counter} dur: ${this.last_tick_duration}ms ---`);
      console.log(`real duration: ${Math.round((Date.now() - this.launch_time) / 1000)}secs`)
      console.log(`sim duration: ${Math.floor(this.sim_time / 1000)}sec`)
      console.log(`maximal age: ${Math.floor(this.creatures_controller.maximal_age / 1000)}secs`)
      console.log(`maximal generation: ${this.creatures_controller.maximal_generation}`)
      console.log(`latest creature id: #${this.creatures_controller.creatures_counter}`)
    }

    let anything_done = this.creatures_controller.tick(timeDelta, nowTime, this._tick_interval * this._sim_speed, this._sim_speed);
    if (anything_done && this.ticks_counter % this.MAP_UPDATE_FREQ == 0)
      this.map_controller.tick(
        this.creatures_controller - this.lastTimecode,
        this.creatures_controller.last_tick_timecode,
        this._sim_speed
      );

    if (this.last_tick_duration > 400)
      this.silentSimSpeed(this.sim_speed * 0.7);
    else
    if (this.last_tick_duration < 100 && this.sim_speed < this.targered_sim_speed)
      this.silentSimSpeed(Math.min(this.sim_speed * 1.01, this.targered_sim_speed));

    this.dispatchEvent("tick_end");
    this.ticks_counter++;

    if (this.debug && this.ticks_counter % 500 == 0)
      console.clear();

    var nextTickDelay = Math.max(this._tick_interval - (Date.now() - nowTime), 10);
    this.simulationTimeout = setTimeout(this.simulationTick.bind(this), nextTickDelay);

    this.lastTimecode = nowTime;
    this.last_tick_duration = Date.now() - nowTime;
  }
}