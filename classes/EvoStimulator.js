class EvoStimulator {
  constructor(sim_master) {
    this.sim_master =
      sim_master
      .addEventListener("tick_end", this._stimulate.bind(this))
      .addEventListener("sim_speed_changed", this._changeSimSpeed.bind(this));
    this.stimulate_interval = this.sim_master.creatures_controller.NEW_CREATURE_MAX_AGE / 5;
    this.timeout = this.stimulate_interval;
    this.last_sim_time = this.sim_master.sim_time;
    this.next_stimulate_timeout = this.sim_master.lastTimecode;

    //constants
    this.CREATURES_DENSITY_TRIGGER = 0.03;
    this.CREATURES_DENSITY_LOW_TRIGGER = 0.007;
    this.FOOD_VARIETY_ADDITION = -0.001;
    this.FOOD_VARIETY_ADDITION_COEFF = 1.01;
    this.FOOD_VARIETY_MIN = -0.47;
    this.FOOD_VARIETY_MAX = -0.497;
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
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY =
          Math.max(this.FOOD_VARIETY_MAX, this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY);
        console.warn("NEED STIMULATE");
      } else
      if (this.sim_master.creatures_controller.creatures_density <= this.CREATURES_DENSITY_LOW_TRIGGER) {
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY -= this.FOOD_VARIETY_ADDITION;
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY =
          Math.min(this.FOOD_VARIETY_MIN, this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY);
        console.warn("NEED DOWN STIMULATE");
      }
      this.next_stimulate_timeout = this.sim_master.lastTimecode + this.stimulate_interval / this.sim_master.sim_speed;
    }
  }
}