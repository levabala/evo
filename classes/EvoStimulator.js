class EvoStimulator {
  constructor(sim_master) {
    this.sim_master = sim_master
      .addEventListener("tick_end", this._stimulate.bind(this))
      .addEventListener("sim_speed_changed", this._changeSimSpeed.bind(this));
    this.stimulate_interval = this.sim_master.creatures_controller.NEW_CREATURE_MAX_AGE / 5;
    this.timeout = this.stimulate_interval;
    this.last_sim_time = this.sim_master.sim_time;
    this.next_stimulate_timeout = this.sim_master.lastTimecode;

    // constants
    this.CREATURES_DENSITY_TRIGGER = 0.022;
    this.CREATURES_DENSITY_LOW_TRIGGER = 0.01;
    this.FOOD_VARIETY_ADDITION = -0.001;
    this.FOOD_VARIETY_ADDITION_COEFF = 1.01;
    this.FOOD_VARIETY_MIN = -0.45;
    this.FOOD_VARIETY_MAX = -0.497;
    this.SEA_LEVEL_MIN = 0.1;
    this.SEA_LEVEL_MAX = 0.6;
    this.SEA_LEVEL_ADDITION = 0.000;
  }

  static _food_variety_fun(value) {
    return ((value + 0.5) ** 2) * value;
  }

  _changeSimSpeed(sim_speeds) {
    this.next_stimulate_timeout = this.sim_master.lastTimecode + this.timeout * sim_speeds.last / sim_speeds.new;
    // TODO: make it normal, please)
  }

  _stimulate() {
    const delta = this.next_stimulate_timeout - this.sim_master.lastTimecode;
    this.timeout = delta;

    if (delta <= 0) {
      if (this.sim_master.creatures_controller.creatures_density >= this.CREATURES_DENSITY_TRIGGER) {
        this.sim_master.map.SEA_GLOBAL_LEVEL = Math.min(this.sim_master.map.SEA_GLOBAL_LEVEL + this.SEA_LEVEL_ADDITION, this.SEA_LEVEL_MAX);
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY += this.FOOD_VARIETY_ADDITION;
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY =
          Math.max(this.FOOD_VARIETY_MAX, this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY);
      } else if (this.sim_master.creatures_controller.creatures_density <= this.CREATURES_DENSITY_LOW_TRIGGER) {
        this.sim_master.map.SEA_GLOBAL_LEVEL = Math.max(this.sim_master.map.SEA_GLOBAL_LEVEL - this.SEA_LEVEL_ADDITION, this.SEA_LEVEL_MIN);
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY -= this.FOOD_VARIETY_ADDITION;
        const last = this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY;
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY =
          Math.min(this.FOOD_VARIETY_MIN, this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY);
      }
      this.next_stimulate_timeout = this.sim_master.lastTimecode + this.stimulate_interval / this.sim_master.sim_speed;
    }
  }
}