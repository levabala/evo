class CreaturesController {
  constructor(map) {
    //add reactor
    Reactor.apply(this, []);

    this.map = map;
    this.creatures_counter = 0;
    this.creatures = {};
    this.maximal_generation = 0;
    this.maximal_age = 0;
    this.last_tick_timecode = Date.now();
    this.sim_speed = 1;

    //constants    
    this.MINIMAL_CREATURES_DENSITY = 0.03//0.005; //creatures per cell
    this.NEW_CREATURE_SATIETY = 0.3;
    this.AFTER_SPLIT_SATIETY = 0.5;
    this.TOXICIETY_RESISTANCE = 0.05;
    this.NEW_CREATURE_EVENT = "new_creature";
    this.DEAD_CREATURE_EVENT = "deawd_creature";
    this.MOVE_CREATURE_EVENT = "move_creature";
    this.MOVE_CREATURES_EVENT = "move_creatures";
    this.PROCESS_CELL_EVENT = "process_cell";
    this.MUTATE_RANGE = new Range(-0.3, 0.3);
    this.BASE_NET_VALUE = 0.1;
    this.CREATURE_SATIETY_DOWNGRADE = 0.0003;
    this.CHILD_NET_MUTATE_RANGE = new Range(-0.001, 0.001);
    this.CHILD_PROPS_MUTATE_RANGE = new Range(-0.005, 0.005);
    this.MINIMAL_SATIETY_ALIVE = 0.05;
    this.NEW_CREATURES_PER_SECS = 1;

    //other
    this._debug = false;
    this._time_buffer_1 = 0;

    //events    
    this.registerEvent(this.NEW_CREATURE_EVENT);
    this.registerEvent(this.DEAD_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURES_EVENT);
    this.registerEvent(this.PROCESS_CELL_EVENT);
  }

  tick(time, timecode, sim_speed) {
    this.last_tick_timecode = timecode;
    this.sim_speed = sim_speed;

    //if is's too little of creatures, then add new one
    const MAX_CREATURE_PER_TICK_ADDED = 50;
    let added = 0;
    this._time_buffer_1 += time;
    let new_creatures_count = Math.floor(((time + this._time_buffer_1) / 1000) * this.NEW_CREATURES_PER_SECS);
    this._time_buffer_1 = Math.max(this._time_buffer_1 - new_creatures_count * 1000, 0);
    for (var i = 0; i < new_creatures_count; i++)
      this._generateAndAddCreature();
    while (this._checkCreaturesLimit() && added++ < MAX_CREATURE_PER_TICK_ADDED) { }

    this.maximal_generation = 0;
    this.maximal_age = 0;

    //all creatures tick
    for (var creature of Object.values(this.creatures)) {
      creature.tick(time);
      creature.satiety -= this.CREATURE_SATIETY_DOWNGRADE * time;
      if (isNaN(creature.satiety))
        debugger;
      if (creature.satiety <= this.MINIMAL_SATIETY_ALIVE)
        this._removeCreature(creature)

      this.maximal_generation = Math.max(this.maximal_generation, creature.generation);
      this.maximal_age = Math.max(this.maximal_age, creature.age);
    }
  }

  reset() {
    this.creatures = [];
    this.creatures_counter = 0;
  }

  viewZoneGetter(pos) {
    let view_zone = {
      left: this.map.cellAtPoint(pos.move(-1, 0)),
      right: this.map.cellAtPoint(pos.move(1, 0)),
      top: this.map.cellAtPoint(pos.move(0, -1)),
      bottom: this.map.cellAtPoint(pos.move(0, 1)),
      center: this.map.cells[pos.x][pos.y]
    };

    return view_zone;
  }

  _splitCreature(creature) {
    let center = creature.coordinates;

    //square 3x3 without the center
    let deltas = [
      new P(1, 0), new P(1, 1), new P(0, 1),
      new P(-1, 1), new P(-1, 0), new P(-1, -1),
      new P(0, -1), new P(1, -1)];

    let free_deltas = deltas.filter(
      function(delta) {
        let pos = center.clone().add(delta);
        if (!pos.inRange(this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE))
          return false;
        let cell_creatures_count = Object.keys(
          this.map.cellAtPoint.bind(map)(pos)
            .walking_creatures).length;
        return cell_creatures_count == 0;
      }.bind(this)
    );
    if (free_deltas.length == 0) {
      return;
    }

    let spawn_position = center.clone().add(free_deltas[
      Math.floor(
        Math.random() * (free_deltas.length - 1)
      )
    ]);
    let new_creature =
      creature.clone()
        .mutateProps(this.CHILD_PROPS_MUTATE_RANGE)
        .mutateNets(this.CHILD_NET_MUTATE_RANGE);
    new_creature.coordinates = spawn_position;
    new_creature.satiety = this.NEW_CREATURE_SATIETY;
    this.creatures_counter++;
    new_creature.id = this.creatures_counter;
    new_creature.generation = creature.generation + 1;
    new_creature.fatigue = 0;

    this._processNewCreature(new_creature);
    this.addCreature(new_creature);

    creature.satiety = this.AFTER_SPLIT_SATIETY;
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
    this.map.cells[creature.coordinates.x][creature.coordinates.y].walking_creatures[creature.id] = creature;
    this.creatures[creature.id] = creature;
    this.dispatchEvent(this.NEW_CREATURE_EVENT, creature);
  }

  _removeCreature(creature) {
    this.dispatchEvent(this.DEAD_CREATURE_EVENT, creature);
    delete this.map.cells[creature.coordinates.x][creature.coordinates.y].walking_creatures[creature.id];
    delete this.creatures[creature.id];
  }

  _generateAndAddCreature() {
    this.addCreature((this._generateCreature(this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE)));
  }

  _generateCreature(x_range, y_range, parent_action_net = null, parent_move_net = null) {
    this.creatures_counter++;
    var creature = new Creature(
      this.creatures_counter,
      new P(Math.floor(x_range.generateNumber()), Math.floor(y_range.generateNumber())),
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      Math.random(),
      this.viewZoneGetter.bind(this),
      parent_action_net ? parent_action_net : this._generateActionNet(),
      parent_move_net ? parent_move_net : this._generateMoveNet()
    );
    this._processNewCreature(creature);
    return creature;
  }

  _generateCreatureAtPosition(pos, parent_action_net = null, parent_move_net = null) {
    this.creatures_counter++;
    var creature = new Creature(
      this.creatures_counter,
      pos,
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      Math.random(),
      this.viewZoneGetter.bind(this),
      parent_action_net ? parent_action_net : this._generateActionNet(),
      parent_move_net ? parent_move_net : this._generateMoveNet()
    );
    this._processNewCreature(creature);
    return creature;
  }

  _processNewCreature(creature) {
    creature
      .addEventListener(
        "wanna_move",
        function(new_position) {
          this._creatureWannaMove(creature, new_position);
        }.bind(this))
      .addEventListener(
        "wanna_eat",
        function() {
          let cell = this.map.cells[creature.coordinates.x][creature.coordinates.y];
          cell.process(Date.now(), this.sim_speed);
          creature.eat(cell);
        }.bind(this))
      .addEventListener(
        "wanna_split",
        function(pos) {
          this._splitCreature(creature);
        }.bind(this));
  }

  _creatureWannaMove(creature, new_position) {
    if (new_position.x > this.map.HORIZONTAL_AXIS_RANGE.to)
      new_position.x = this.map.HORIZONTAL_AXIS_RANGE.from;
    else if (new_position.x < this.map.HORIZONTAL_AXIS_RANGE.from)
      new_position.x = this.map.HORIZONTAL_AXIS_RANGE.to;
    if (new_position.y > this.map.VERTICAL_AXIS_RANGE.to)
      new_position.y = this.map.VERTICAL_AXIS_RANGE.from;
    else if (new_position.y < this.map.VERTICAL_AXIS_RANGE.from)
      new_position.y = this.map.VERTICAL_AXIS_RANGE.to;

    //remove from last cell
    let previous_cell = this.map.cells[creature.coordinates.x][creature.coordinates.y];
    delete previous_cell.walking_creatures[creature.id];

    //update coordinates
    creature.coordinates = new_position;

    //add to new one
    let cell = this.map.cells[new_position.x][new_position.y];
    cell.walking_creatures[creature.id] = creature;

    //notify controller&visualizer
    this.dispatchEvent(this.MOVE_CREATURE_EVENT, creature);
    if (this._debug)
      creature.say("moved to " + new_position);
  }

  _generateCreatures(x_range, y_range, amount) {
    var creatures = []
    for (var i = 0; i < amount; i++)
      creatures.push(this.generateCreature(x_range, y_range));
    return creatures;
  }

  _generateActionNet() {
    //input: viewzone(5 cells -> x2(food_type + food_amount)) + satiety
    //output: move/eat
    let v = this.BASE_NET_VALUE;
    return new NeuralNetwork(
      [[v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v]], //input
      [[v, v], [v, v], [v, v]], //output
      new OneLayer(
        PROCESS_FUNCTIONS.Lineral_OneLimited
      ),
      PROCESS_FUNCTIONS.Lineral,
      PROCESS_FUNCTIONS.Lineral_OneLimited
    ).mutate(this.MUTATE_RANGE);
  }

  _generateMoveNet() {
    //input: viewzone(5 cells -> x2(food_type + food_amount)) + satiety
    //output: right/bottom/left/up
    let v = this.BASE_NET_VALUE;
    return new NeuralNetwork(
      [[v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v], [v, v, v]], //input
      [[v, v, v, v], [v, v, v, v], [v, v, v, v]], //output
      new OneLayer(
        PROCESS_FUNCTIONS.Lineral_OneLimited
      ),
      PROCESS_FUNCTIONS.Lineral,
      PROCESS_FUNCTIONS.Lineral_OneLimited
    ).mutate(this.MUTATE_RANGE);
  }
}