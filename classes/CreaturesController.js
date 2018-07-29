class CreaturesController {
  constructor(map) {
    //add reactor
    Reactor.apply(this, []);

    this.map = map;
    this.creatures_counter = 0;
    this.creatures = {};

    //constants    
    this.MINIMAL_CREATURES_DENSITY = 0.2; //creatures per cell -> 2 creatures per 10 cells
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
    //if is's too little of creatures, then add new one
    this._checkCreaturesLimit();

    //all creatures tick
    for (var creature of Object.values(this.creatures))
      creature.tick(time);
  }

  reset() {
    this.creatures = [];
    this.creatures_counter = 0;
  }

  _checkCreaturesLimit() {
    let creatures_count = Object.keys(this.creatures);
    let creatures_density = creatures_count == 0 ? 0 : this.map.width * this.map.height / creatures_count;
    if (creatures_density < this.MINIMAL_CREATURES_DENSITY) {
      this._generateAndAddCreature();
    }
  }

  addCreature(creature) {
    this.creatures[creature.id] = creature;
    console.log("new creature")
  }

  _removeCreature(creature) {
    delete this.creatures[creature.id];
  }

  _generateAndAddCreature() {
    this.addCreature((this._generateCreature(this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE)));
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