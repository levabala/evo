class SimObserver {
  constructor(sim_master) {
    Reactor.apply(this, []);

    this.sim_master = sim_master;
    this.logs = {
      creatures_count: [],
      max_generation: [],
    };

    // info
    this.info = {
      real_time: new Info("Real time", 0, value => `${Math.round(value / 1000)}sec`),
      sim_time: new Info("Simulation time", 0, value => `${Math.round(value / 1000)}sec`),
      tick_duration: new Info("Tick duration", 0, value => `${Math.round(value)}ms`),
      sim_speed: new Info("Simulation speed", 0, value => `x${value}`),
      creature_max_id: new Info("Max id", 0, value => `#${value}`),
      creatures_count: new Info("Creatures count", 0),
      creatures_density: new Info("Creatures density", 0),
      max_generation: new Info("Max generation", 0),
      max_actions_count: new Info("Max actions count", 0, value => `${value}a/t`),
      max_age: new Info("Max age", 0, value => `${value / 1000}sec`, 1),
      max_effectivity: new Info("Max effectivity", 0, value => `${value}f/sec`, 2),
      eaten_creatures_rate: new Info("Eated creatures rate", 0, value => `${Math.round(value * 100)}%`),
      interaction_per_sec: new Info("Interactions", 0, value => `${value}i/sec`, 1),
      food_variety: new Info("Food variety", 0),
    };

    // constants
    this.UDPDATE_INTERVAL = 100;

    // events
    this.registerEvent("updates");

    setInterval(this._updateLogs.bind(this), this.UDPDATE_INTERVAL);
  }

  connectInfoBox(info_box) {
    const entries = Object.entries(this.info);
    for (let i = 0; i < entries.length; i++)
      info_box.addInfo(entries[i][0], entries[i][1]);
    return this;
  }

  _updateLogs() {
    const controller = this.sim_master.creatures_controller;
    this.logs.creatures_count.push(controller.creatures_count);
    this.logs.max_generation.push(controller.maximal_generation);

    this.info.real_time.value = this.sim_master.sim_time / this.sim_master.sim_speed;
    this.info.sim_time.value = this.sim_master.sim_time;
    this.info.sim_speed.value = controller.sim_speed;
    this.info.creature_max_id.value = controller.creatures_counter;
    this.info.creatures_count.value = controller.creatures_count;
    this.info.creatures_density.value = controller.creatures_density;
    this.info.max_actions_count.value = controller.maximal_actions_count;
    this.info.max_generation.value = controller.maximal_generation;
    this.info.max_age.value = controller.maximal_age;
    this.info.eaten_creatures_rate.value = controller.eaten_creatures_per_sec_average;
    this.info.interaction_per_sec.value = controller.interaction_per_sec_average;
    this.info.food_variety.value = controller.NEW_CREATURE_FOOD_VARIETY;
    this.info.tick_duration.value = this.sim_master.last_ticks_duration_average;
    this.info.max_effectivity.value = controller.maximal_effectivity;

    this.dispatchEvent("updates");
  }
}