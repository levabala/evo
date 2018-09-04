class SimSaver {
  constructor(master) {
    this.master = master;
    this.saved_creatures = {};
    this.saving_seed = guid();

    // constants
    this.CHECK_INTERVAL = 1000;
    this.MAX_SAVED = 4;
    this.MIN_GENERATION_NEED = 150;
    this.MIN_POPULATION_ID_DIFF = 1000;

    this.check();
  }

  static get allSessions() {
    const sessions = {};
    store.each((el, session_id) => {
      if (Object.keys(el).length > 0)
        sessions[session_id] = el;
    });
    return sessions;
  }

  static get allSessionsAsArrays() {
    const sessions = {};
    store.each((el, session_id) => {
      if (Object.keys(el).length > 0)
        sessions[session_id] = Object.values(el);
    });
    return sessions;
  }

  static get allSavedCreatures() {
    let creatures = [];
    store.each((el, session_id) => {
      creatures = creatures.concat(Object.values(el));
    });
    creatures = creatures.sort((a, b) => {
      if (a.generation > b.generation)
        return -1;
      return 1;
    });
    return creatures;
  }

  checkDeadCreature(creature) { }

  check() {
    const saved = Object.values(this.saved_creatures);
    const replace = (who, whom, obj) => {
      this.saved_creatures[whom.id] = obj;
      saved.push(whom);

      delete this.saved_creatures[who.id];
      saved.splice(saved.indexOf(who), 1);
    };

    const creatures = Object.values(this.master.creatures_controller.creatures);
    /* eslint no-continue: 0 */
    for (let i = 0; i < creatures.length; i++) {
      const creature = creatures[i];
      this.checkCreature(creature, saved, replace);
    }

    store.set(`${this.saving_seed}`, this.saved_creatures);

    setTimeout(this.check.bind(this), this.CHECK_INTERVAL);
  }

  checkCreature(creature, saved, replace) {
    // check for min generation
    if (creature.generation < this.MIN_GENERATION_NEED || creature.children < 3)
      return;

    // generate potential replaced
    const obj = creature.generateJsonObjectConstructor();
    const less_generation = saved.filter(
      saved_c => creature.generation > saved_c.generation,
    );
    if (less_generation.length > 0) {
      // check for replace similiar
      const similiar = less_generation.filter(
        saved_c => Math.abs(creature.population_id - saved_c.population_id) < this.MIN_POPULATION_ID_DIFF,
      );
      if (similiar.length > 0) {
        const to_replace = similiar.sort((a, b) => (b.generation > a.generation ? 1 : -1))[0];
        replace(to_replace, creature, obj);
        return;
      }

      // replace lowest unsimiliar
      const lowest = less_generation.sort((a, b) => (b.generation > a.generation ? 1 : -1))[0];
      replace(lowest, creature, obj);
    }

    // check for just add
    if (saved.length < this.MAX_SAVED) {
      this.saved_creatures[creature.id] = obj;
      saved.push(obj);
      return;
    }
  }

  getCurrentStore() {
    return store.get(`${this.saving_seed}`);
  }
}