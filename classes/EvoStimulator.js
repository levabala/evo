class EvoStimulator {
  constructor(sim_master) {
    this.sim_master = sim_master.addEventListener("tick_end", this._stimulate.bind(this));
    this.stimulate_interval = this.sim_master.creatures_controller.NEW_CREATURE_MAX_AGE;
    this.timeout = this.stimulate_interval;
    this.last_sim_time = this.sim_master.sim_time;

    //constants
    this.CREATURES_DENSITY_TRIGGER = 0.17;
    this.FOOD_VARIETY_ADDITION = -0.002;
  }

  _stimulate() {
    let delta = this.sim_master.last_tick_duration * this.sim_master.sim_speed;
    this.timeout -= delta;

    if (this.timeout <= 0) {
      if (this.sim_master.creatures_controller.creatures_density >= this.CREATURES_DENSITY_TRIGGER) {
        this.sim_master.creatures_controller.NEW_CREATURE_FOOD_VARIETY += this.FOOD_VARIETY_ADDITION;
        console.warn("NEED STIMULATE")
      }
      this.timeout = this.stimulate_interval;
    }
    console.log(this.timeout, delta, Math.round(
      this.sim_master.creatures_controller.creatures_density * 1000
    ) / 1000)
  }
}