class SimSaver {
  constructor(master) {
    this.master = master;
    this.saved_creatures = {};
    this.saving_seed = guid();

    //constants
    this.CHECK_INTERVAL = 1000;
    this.MAX_SAVED = 10;
    this.MIN_GENERATION_NEED = 50;
    this.MIN_POPULATION_ID_DIFF = 1000;

    this.check();
  }

  check() {
    let saved = Object.values(this.saved_creatures);
    let replace = (who, whom, obj) => {
      this.saved_creatures[whom.id] = obj;
      saved.push(whom);

      delete this.saved_creatures[who.id];
      saved.splice(saved.indexOf(who), 1);
    };

    for (let creature of Object.values(this.master.creatures_controller.creatures)) {
      //check for min generation
      if (creature.generation < this.MIN_GENERATION_NEED)
        continue;

      //generate potential replaced
      let obj = creature.generateJsonObjectConstructor();
      let less_generation = saved.filter(
        (saved_c) =>
        creature.generation > saved_c.generation
      );
      if (less_generation.length > 0) {
        //check for replace similiar
        let similiar = less_generation.filter(
          (saved_c) =>
          Math.abs(creature.population_id - saved_c.population_id) < this.MIN_POPULATION_ID_DIFF
        );
        if (similiar.length > 0) {
          let to_replace = similiar.sort((a, b) => b.generation > a.generation ? 1 : -1)[0];
          replace(to_replace, creature, obj);
          continue;
        }

        //replace lowest unsimiliar
        let lowest = less_generation.sort((a, b) => b.generation > a.generation ? 1 : -1)[0];
        replace(lowest, creature, obj);
      }

      //check for just add
      if (saved.length < this.MAX_SAVED) {
        this.saved_creatures[creature.id] = obj;
        saved.push(obj);
        continue;
      }
    }

    store.set(`${this.saving_seed}`, this.saved_creatures);

    setTimeout(this.check.bind(this), this.CHECK_INTERVAL);
  }

  getCurrentStore() {
    return store.get(`${this.saving_seed}`);
  }
}