class CreaturesController {
  constructor() {
    //add reactor
    Reactor.apply(this, []);

    this.creatures_counter = 0;
    this.creatures = {};

    //constants
    this.NEW_CREATURE_SATIETY = 0.3;
    this.TOXICIETY_RESISTANCE = 0.05;
    this.NEW_CREATURE_EVENT = "new_creature";
    this.DEAD_CREATURE_EVENT = "deawd_creature";
    this.MOVE_CREATURE_EVENT = "move_creature";
    this.MOVE_CREATURES_EVENT = "move_creatures";

    //events    
    this.registerEvent(this.NEW_CREATURE_EVENT);
    this.registerEvent(this.DEAD_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURES_EVENT);
  }

  tick(time) {
    for (var creature of this.creatures)
      creature.tick(time);
  }

  reset() {
    this.creatures = [];
    this.creatures_counter = 0;
  }

  _generateCreature(x_range, y_range) {
    this.creatures_counter++;
    var creature = new Creature(
      this.creatures_counter - 1,
      new P(x_range.generateNumber(), y_range.generateNumber()),
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      Math.random()
    )
    this.dispatchEvent(this.NEW_CREATURE_EVENT, creature);
    return creature;
  }

  _generateCreatures(x_range, y_range, amount) {
    var creatures = []
    for (var i = 0; i < amount; i++)
      creatures.push(this.generateCreature(x_range, y_range));
    return creatures;
  }


}