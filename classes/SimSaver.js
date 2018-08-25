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
    for (let creature of Object.values(this.master.creatures_controller.creatures)) {
      let replaced = false;
      for (let saved_c of saved) {
        if (saved_c.generation > creature.generation || (creature.id in this.saved_creatures))
          continue;
        let diff = Math.abs(saved_c.population_id - creature.population_id);
        if (diff < this.MIN_POPULATION_ID_DIFF) {
          let obj = creature.generateJsonObjectConstructor();
          this.saved_creatures[creature.id] = obj;
          saved.push(obj);

          delete this.saved_creatures[saved_c.id];
          saved.splice(saved.indexOf(saved_c), 1);
          replaced = true;
          break;
        }
      }
      if (replaced)
        continue;

      let min_generation = saved.length > 0 ? saved.reduce((c, generation) => {
        return Math.min(c.generation, generation);
      }) : 0;
      //TODO     FIIIIIIIIIIIIIIIIIIIIIIIIIIIIIX  ITTTTTTTTTTTTTTTTTTTTT      
      if (
        creature.generation > this.MIN_GENERATION_NEED &&
        (creature.generation > min_generation || saved.length < this.MAX_SAVED) &&
        !(creature.id in this.saved_creatures)
      ) {
        let obj = creature.generateJsonObjectConstructor();
        this.saved_creatures[creature.id] = obj;
        saved.push(obj);
        if (saved.length > this.MAX_SAVED) {
          let min_creature = saved.reduce((creature, min_creature) => {
            if (min_creature.generation > creature.generation)
              return creature;
            return min_creature;
          });
          delete this.saved_creatures[min_creature.id];
          saved.splice(saved.indexOf(min_creature), 1);
        }
      }
    }

    setTimeout(this.check.bind(this), this.CHECK_INTERVAL);
  }
}