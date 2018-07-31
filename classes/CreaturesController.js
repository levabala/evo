class CreaturesController {
  constructor(map) {
    //add reactor
    Reactor.apply(this, []);

    this.map = map;
    this.creatures_counter = 0;
    this.creatures = {};

    //constants    
    this.MINIMAL_CREATURES_DENSITY = 0.05//0.005; //creatures per cell
    this.NEW_CREATURE_SATIETY = 0.3;
    this.TOXICIETY_RESISTANCE = 0.05;
    this.NEW_CREATURE_EVENT = "new_creature";
    this.DEAD_CREATURE_EVENT = "deawd_creature";
    this.MOVE_CREATURE_EVENT = "move_creature";
    this.MOVE_CREATURES_EVENT = "move_creatures";
    this.MUTATE_RANGE = new Range(-0.3, 0.3);
    this.BASE_NET_VALUE = 0.1;
    this.CREATURE_SATIETY_DOWNGRADE = 0.01;

    //other
    this._debug = false;

    //events    
    this.registerEvent(this.NEW_CREATURE_EVENT);
    this.registerEvent(this.DEAD_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURES_EVENT);
  }

  tick(time) {
    //if is's too little of creatures, then add new one
    let added = 0;
    while (this._checkCreaturesLimit() && added++ < 10) { }

    //all creatures tick
    for (var creature of Object.values(this.creatures)) {
      creature.tick(time);
      creature.satiety -= this.CREATURE_SATIETY_DOWNGRADE;
      if (creature.satiety <= 0)
        this._removeCreature(creature)
    }
  }

  reset() {
    this.creatures = [];
    this.creatures_counter = 0;
  }

  viewZoneGetter(pos) {
    let view_zone = {
      left: this.map.HORIZONTAL_AXIS_RANGE.isIn(pos.x - 1) ? this.map.cells[pos.x - 1][pos.y] : null,
      right: this.map.HORIZONTAL_AXIS_RANGE.isIn(pos.x + 1) ? this.map.cells[pos.x + 1][pos.y] : null,
      top: this.map.VERTICAL_AXIS_RANGE.isIn(pos.y - 1) ? this.map.cells[pos.x][pos.y - 1] : null,
      bottom: this.map.VERTICAL_AXIS_RANGE.isIn(pos.y + 1) ? this.map.cells[pos.x][pos.y + 1] : null,
      center: this.map.cells[pos.x][pos.y]
    };

    return view_zone;
  }

  _checkCreaturesLimit() {
    let creatures_density = this._creaturesDensity();
    if (creatures_density < this.MINIMAL_CREATURES_DENSITY) {
      this._generateAndAddCreature();
      creatures_density = this._creaturesDensity();
      if (this._debug)
        console.log("creatures density:", creatures_density)
      return true;
    }
    return false;
  }

  _creaturesDensity() {
    let creatures_count = Object.keys(this.creatures).length;
    return creatures_count == 0 ? 0 : creatures_count / this.map.width / this.map.height;
  }

  addCreature(creature) {
    this.creatures[creature.id] = creature;
    this.dispatchEvent(this.NEW_CREATURE_EVENT, creature);
    console.log("new creature #" + creature.id);
  }

  _removeCreature(creature) {
    this.dispatchEvent(this.DEAD_CREATURE_EVENT, creature);
    delete this.creatures[creature.id];
  }

  _generateAndAddCreature() {
    this.addCreature((this._generateCreature(this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE)));
  }

  _generateCreature(x_range, y_range) {
    this.creatures_counter++;
    var creature = new Creature(
      this.creatures_counter - 1,
      new P(Math.floor(x_range.generateNumber()), Math.floor(y_range.generateNumber())),
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      Math.random(),
      this.viewZoneGetter.bind(this),
      this._generateActionNet(),
      this._generateMoveNet()
    )
      .addEventListener(
        "wanna_move",
        function(new_position) {
          this._creatureWannaMove(creature, new_position);
        }.bind(this))
      .addEventListener(
        "wanna_eat",
        function(pos) {
          creature.eat(this.map.cells[pos.x][pos.y]);
        }.bind(this));
    return creature;
  }

  _creatureWannaMove(creature, new_position) {
    if (new_position.inRange(this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE)) {
      creature.coordinates = new_position;
      this.dispatchEvent(this.MOVE_CREATURE_EVENT, creature);
      if (this._debug)
        creature.say("moved to " + new_position);
    }
    else
      if (this._debug)
        creature.say("can't move")
  }

  _generateCreatures(x_range, y_range, amount) {
    var creatures = []
    for (var i = 0; i < amount; i++)
      creatures.push(this.generateCreature(x_range, y_range));
    return creatures;
  }

  _generateActionNet() {
    //input: viewzone(4 cells -> x2(food_type + food_amount)) + satiety
    //output: move/eat/none
    let v = this.BASE_NET_VALUE;
    return new NeuralNetwork(
      [[v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v]], //input
      [[v, v, v], [v, v, v], [v, v, v]], //output
      new OneLayer(
        PROCESS_FUNCTIONS.Lineral_OneLimited
      ),
      PROCESS_FUNCTIONS.Lineral,
      PROCESS_FUNCTIONS.Lineral_OneLimited
    ).mutate(this.MUTATE_RANGE);
  }

  _generateMoveNet() {
    //input: viewzone(4 cells -> x2(food_type + food_amount)) + satiety
    //output: right/bottom/left/up/none
    let v = this.BASE_NET_VALUE;
    return new NeuralNetwork(
      [[v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v]], //input
      [[v, v, v, v, v], [v, v, v, v, v], [v, v, v, v, v]], //output
      new OneLayer(
        PROCESS_FUNCTIONS.Lineral_OneLimited
      ),
      PROCESS_FUNCTIONS.Lineral,
      PROCESS_FUNCTIONS.Lineral_OneLimited
    ).mutate(this.MUTATE_RANGE);
  }
}