class EvoStimulator {
  constructor(sim_master) {
    this.sim_master =
      sim_master
      .addEventListener("tick_end", this._stimulate.bind(this))
      .addEventListener("sim_speed_changed", this._changeSimSpeed.bind(this));
    this.stimulate_interval = this.sim_master.creatures_controller.NEW_CREATURE_MAX_AGE / 2;
    this.timeout = this.stimulate_interval;
    this.last_sim_time = this.sim_master.sim_time;
    this.next_stimulate_timeout = this.sim_master.lastTimecode;

    //constants
    this.CREATURES_DENSITY_TRIGGER = 0.1;
    this.FOOD_VARIETY_ADDITION = -0.0001;
    this.FOOD_VARIETY_ADDITION_COEFF = 1.01;
  }

  _food_variety_fun(value) {
    return Math.pow(value + 0.5, 2) * value;
  }

  _changeSimSpeed(sim_speeds) {
    this.next_stimulate_timeout = this.sim_master.lastTimecode + this.timeout * sim_speeds.last / sim_speeds.new;
    //TODO: make it normal, please)
  }

  _stimulate() {
    let delta = this.next_stimulate_timeout - this.sim_master.lastTimecode;
    this.timeout = delta;

    if (delta <= 0) {
      if (this.sim_master.creatures_controller.creatures_density >= this.CREATURES_DENSITY_TRIGGER) {
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY += this.FOOD_VARIETY_ADDITION;
        //this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY =
        //  this._food_variety_fun(this.FOOD_VARIETY_ADDITION_COEFF);
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY =
          Math.max(this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY, -0.499);
        console.warn("NEED STIMULATE");
      }
      this.next_stimulate_timeout = this.sim_master.lastTimecode + this.stimulate_interval / this.sim_master.sim_speed;
    }
  }
}