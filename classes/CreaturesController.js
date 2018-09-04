class CreaturesController {
  constructor(map) {
    // add reactor
    Reactor.apply(this, []);

    this.map = map;
    this.creatures_counter = 0;
    this.creatures = {};
    this.creatures_count = 0;
    this.maximal_generation = 0;
    this.maximal_age = 0;
    this.maximal_effectivity = 0;
    this.maximal_eaten_creatures = 0;
    this.maximal_actions_count = 0;
    this.maximal_children = 0;
    this.last_tick_timecode = Date.now();
    this.sim_speed = 1;
    this.creatures_density = 0;
    this.eaten_per_tick = 0;
    this.interactions_per_tick = 0;
    this.eaten_creatures_per_sec = 0;
    this.eaten_creatures_per_sec_buffer = [];
    this.eaten_creatures_per_sec_average = 0;
    this.interaction_per_sec = 0;
    this.interaction_per_sec_buffer = [];
    this.interaction_per_sec_average = 0;


    // constants
    this.MINIMAL_CREATURES_DENSITY = 0.005; // creatures per cell
    this.NEW_CREATURE_SATIETY = 0.3;
    this.SPLIT_COST = 0.5;
    this.TOXICIETY_RESISTANCE = 0.05;
    this.NEW_CREATURE_EVENT = "new_creature";
    this.DEAD_CREATURE_EVENT = "deawd_creature";
    this.MOVE_CREATURE_EVENT = "move_creature";
    this.MOVE_CREATURES_EVENT = "move_creatures";
    this.PROCESS_CELL_EVENT = "process_cell";
    this.START_MUTATE_RANGE = new Range(-0.5, 0.5);
    this.BASE_NET_VALUE = 0;
    this.CREATURE_SATIETY_DOWNGRADE = 0.000004;
    this.CHILD_NET_MUTATE_RANGE = new Range(-0.1, 0.1);
    this.CHILD_PROPS_MUTATE_RANGE = new Range(-0.05, 0.05);
    this.MINIMAL_SATIETY_ALIVE = 0.05;
    this.NEW_CREATURES_PER_SECS = 1;
    this.NEW_CREATURE_FOOD_VARIETY = -0.35;
    this.NEW_CREATURE_MAX_AGE = 200 * 1000;
    this.MOVE_COST = 0.01;
    this.RANDOM_CREATURES_ADDED_PER_SECOND_FOR_CELL = 0.0003;
    this.MAX_NEW_CREATURES_AT_ONCE = 1000000;

    // other
    this.new_creature_buffer = 0;
    this.new_random_creautures_createn = 0;
    this._time_buffer_1 = 0;
    this._time_buffer_2 = 0;

    // events
    this.registerEvent(this.NEW_CREATURE_EVENT);
    this.registerEvent(this.DEAD_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURES_EVENT);
    this.registerEvent(this.PROCESS_CELL_EVENT);
  }

  tick(time, timecode, tick_length, sim_speed) {
    this.sim_speed = sim_speed;

    const real_delta = timecode - this.last_tick_timecode;
    const sim_delta = real_delta * sim_speed;

    this._auto_add_creatures(0);
    const creatures = Object.values(this.creatures);
    const max_actions_count = creatures.reduce(
      (max_count, creature) => Math.max(max_count, creature.actionsToDoCount(sim_delta)), 0,
    );
    const min_time_per_action = creatures.reduce(
      (time_per_action, creature) => Math.min(time_per_action, creature.timePerAction()),
      Number.MAX_SAFE_INTEGER,
    );
    this.maximal_actions_count = max_actions_count;

    if (max_actions_count === 0)
      return false;

    this.eaten_creatures = 0;
    this.interactions_per_tick = 0;

    const real_time_per_tick = min_time_per_action / sim_speed;
    const sim_time_per_tick = min_time_per_action;
    for (let i = 0; i < max_actions_count; i++) {
      this._auto_add_creatures(sim_time_per_tick);
      this._internal_tick(sim_time_per_tick);
      this.last_tick_timecode += real_time_per_tick;
    }

    this.interaction_per_sec =
      this.interactions_per_tick /
      sim_time_per_tick /
      max_actions_count *
      1000;
    this.interaction_per_sec_buffer.push(this.interaction_per_sec);
    if (this.interaction_per_sec_buffer.length > 5)
      this.interaction_per_sec_buffer.shift();

    this.interaction_per_sec_average = 0;
    for (let i = 0; i < this.interaction_per_sec_buffer.length; i++)
      this.interaction_per_sec_average += this.interaction_per_sec_buffer[i];
    this.interaction_per_sec_average /= this.interaction_per_sec_buffer.length;

    this.eaten_creatures_rate =
      this.interactions_per_tick > 0 ?
        this.eaten_creatures / this.interactions_per_tick :
        0;

    this.eaten_creatures_per_sec_buffer.push(this.eaten_creatures_rate);
    if (this.eaten_creatures_per_sec_buffer.length > 5)
      this.eaten_creatures_per_sec_buffer.shift();

    this.eaten_creatures_per_sec_average = 0;
    for (let i = 0; i < this.eaten_creatures_per_sec_buffer.length; i++)
      this.eaten_creatures_per_sec_average += this.eaten_creatures_per_sec_buffer[i];
    this.eaten_creatures_per_sec_average /= this.eaten_creatures_per_sec_buffer.length;

    return true;
  }

  _auto_add_creatures(time) {
    this.new_creature_buffer +=
      time /
      1000 *
      (this.RANDOM_CREATURES_ADDED_PER_SECOND_FOR_CELL * this.map.width * this.map.height);
    this.new_creature_buffer = Math.min(this.MAX_NEW_CREATURES_AT_ONCE, this.new_creature_buffer);
    while (this.new_creature_buffer > 1) {
      this._generateAndAddCreature();
      this.new_creature_buffer--;
    }
    while (this._checkCreaturesLimit()) { }
  }

  _internal_tick(time) {
    this.maximal_generation = 0;
    this.maximal_age = 0;
    this.maximal_effectivity = 0;
    this.maximal_eaten_creatures = 0;
    this.maximal_children = 0;

    // all creatures tick
    const change = this.CREATURE_SATIETY_DOWNGRADE * time;
    let count = 0;
    const creatures = Object.values(this.creatures);
    for (let i = 0; i < creatures.length; i++) {
      const creature = creatures[i];

      // perform other actions
      creature.downgradeFatigue(time);

      // interact other one
      const pos = creature.coordinates;
      const near_creatures = this.map.cells[pos.x][pos.y].near_creatures;
      for (let i2 = 0; i2 < near_creatures.length; i2++) {
        const c = near_creatures[i2];
        if (
          c.satiety >= creature.satiety &&
          c.id !== creature.id &&
          !creature.interact(c)
        )
          break;
      }

      // perform other actions
      creature.tick(time);

      // downgrade
      creature.downgradeSatiety(change);
      if (creature.satiety <= this.MINIMAL_SATIETY_ALIVE)
        this._removeCreature(creature);

      // statistic
      this.maximal_generation =
        Math.max(this.maximal_generation, creature.generation);
      this.maximal_age =
        Math.max(this.maximal_age, creature.age);
      this.maximal_effectivity =
        Math.max(this.maximal_effectivity, creature.effectivity);
      this.maximal_eaten_creatures =
        Math.max(this.maximal_eaten_creatures, creature.eaten_creatures);
      this.maximal_children =
        Math.max(this.maximal_children, creature.children);

      count++;
    }
    this.creatures_count = count;
  }

  reset() {
    this.creatures = [];
    this.creatures_counter = 0;
  }

  viewZoneGetter(p) {
    const view_zone = {
      left: this.map.cellAtCoordinates(p.x - 1, p.y).update(this.last_tick_timecode, this.sim_speed),
      left2: this.map.cellAtCoordinates(p.x - 2, p.y).update(this.last_tick_timecode, this.sim_speed),
      right: this.map.cellAtCoordinates(p.x + 1, p.y).update(this.last_tick_timecode, this.sim_speed),
      right2: this.map.cellAtCoordinates(p.x + 2, p.y).update(this.last_tick_timecode, this.sim_speed),
      top: this.map.cellAtCoordinates(p.x, p.y - 1).update(this.last_tick_timecode, this.sim_speed),
      top2: this.map.cellAtCoordinates(p.x, p.y - 2).update(this.last_tick_timecode, this.sim_speed),
      bottom: this.map.cellAtCoordinates(p.x, p.y + 1).update(this.last_tick_timecode, this.sim_speed),
      bottom2: this.map.cellAtCoordinates(p.x, p.y + 2).update(this.last_tick_timecode, this.sim_speed),
      center: this.map.cells[p.x][p.y].update(this.last_tick_timecode, this.sim_speed),
    };


    return view_zone;
  }

  _splitCreature(creature) {
    const center = creature.coordinates;

    // square 3x3 without the center
    const deltas = [
      new P(1, 0), new P(1, 1), new P(0, 1),
      new P(-1, 1), new P(-1, 0), new P(-1, -1),
      new P(0, -1), new P(1, -1),
    ];

    const free_deltas = deltas.filter(
      (delta) => {
        const pos = center.clone().add(delta);
        if (!pos.inRange(this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE))
          return false;
        const cell_creatures_count = this.map.cellAtPoint.bind(map)(pos).walking_creatures.length;
        return cell_creatures_count === 0;
      },
    );
    if (free_deltas.length === 0)
      return;


    const spawn_position = center.clone().add(free_deltas[
      Math.floor(
        Math.random() * (free_deltas.length - 1),
      )
    ]);
    const new_creature = creature.clone()
      .mutateProps(this.CHILD_PROPS_MUTATE_RANGE)
      .mutateNets(this.CHILD_NET_MUTATE_RANGE);
    new_creature.coordinates = spawn_position;
    new_creature.satiety = this.NEW_CREATURE_SATIETY;
    this.creatures_counter++;
    new_creature.id = this.creatures_counter;
    new_creature.generation = creature.generation + 1;
    new_creature.fatigue = 0;
    new_creature.food_variety = this.NEW_CREATURE_FOOD_VARIETY;
    new_creature.max_age = this.NEW_CREATURE_MAX_AGE;

    this._processNewCreature(new_creature);
    this.addCreature(new_creature);

    creature.satiety -= this.SPLIT_COST;
    creature.children++;
  }

  _checkCreaturesLimit() {
    this.creatures_density = this._creaturesDensity();
    if (this.creatures_density < this.MINIMAL_CREATURES_DENSITY) {
      this._generateAndAddCreature();
      this.creatures_density = this._creaturesDensity();
      return true;
    }
    return false;
  }

  _creaturesDensity() {
    const creatures_count = Object.keys(this.creatures).length;
    const density = creatures_count === 0 ? 0 : creatures_count / (this.map.width * this.map.height - this.map.sea_cells_count);
    this.creatures_density = density;
    return density;
  }

  addCreature(creature) {
    this.map.cells[creature.coordinates.x][creature.coordinates.y].addCreature(creature);
    this.creatures[creature.id] = creature;
    this.dispatchEvent(this.NEW_CREATURE_EVENT, creature);
  }

  _removeCreature(creature) {
    this.dispatchEvent(this.DEAD_CREATURE_EVENT, creature);
    this.map.cells[creature.coordinates.x][creature.coordinates.y].removeCreature(creature.id);
    delete this.creatures[creature.id];
  }

  _generateAndAddCreature() {
    this.addCreature((this._generateCreature(this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE)));
  }

  pushCreatures(creature_dump, count) {
    for (let i = 0; i < count; i++) {
      this.pushCreature(
        creature_dump, this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE,
      );
    }
  }

  pushCreature(creature_dump, x_range, y_range) {
    this.creatures_counter++;
    const creature = Creature.fromJsonObject(
      creature_dump,
      this.creatures_counter,
      this._generateSpawnPosition(x_range, y_range),
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      this.NEW_CREATURE_FOOD_VARIETY,
      this.NEW_CREATURE_MAX_AGE,
      this._generateControlNetInput.bind(this),
      this.constructor._generateCreatureInteractInput,
    );
    this._processNewCreature(creature);
    this.addCreature(creature);
    return creature;
  }

  _generateCreature(x_range, y_range) {
    this.creatures_counter++;
    const creature = new Creature(
      this.creatures_counter,
      this._generateSpawnPosition(x_range, y_range),
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      Math.random(),
      this._generateControlNetInput.bind(this),
      this.constructor._generateCreatureInteractInput,
      this._generateControlNet(),
      this._generateCreatureInteractNet(),
      this.NEW_CREATURE_FOOD_VARIETY,
      this.NEW_CREATURE_MAX_AGE,
    );
    this._processNewCreature(creature);
    return creature;
  }

  _generateSpawnPosition(x_range, y_range) {
    const generateNewPos = () => new P(Math.floor(x_range.generateNumber()), Math.floor(y_range.generateNumber()));
    let pos;
    const checkNext = () => {
      pos = generateNewPos();
      const next = this.map.cells[pos.x][pos.y].is_sea;
      return next;
    };
    while (checkNext()) { }
    return pos;
  }

  _generateCreatureAtPosition(pos) {
    this.creatures_counter++;
    const creature = new Creature(
      this.creatures_counter,
      pos,
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      Math.random(),
      this._generateControlNetInput.bind(this),
      this.constructor._generateCreatureInteractInput,
      this._generateControlNet(),
      this._generateCreatureInteractNet(),
      this.NEW_CREATURE_FOOD_VARIETY,
      this.NEW_CREATURE_MAX_AGE,
    );
    this._processNewCreature(creature);
    return creature;
  }

  _cratureWannaEat(creature) {
    const cell = this.map.cells[creature.coordinates.x][creature.coordinates.y];
    creature.eat(cell.update(this.last_tick_timecode, this.sim_speed));
  }

  _processNewCreature(creature) {
    creature
      .addEventListener(
        "wanna_move",
        (new_position) => {
          this._creatureWannaMove(creature, new_position);
        },
    )
      .addEventListener(
        "wanna_eat",
        () => {
          this._cratureWannaEat(creature);
        },
    )
      .addEventListener(
        "wanna_split",
        () => {
          this._splitCreature(creature);
        },
    )
      .addEventListener(
        "eaten",
        () => {
          this.eaten_creatures++;
          this._removeCreature(creature);
        },
    )
      .addEventListener(
        "interaction",
        () => {
          this.interactions_per_tick++;
        },
    );
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

    const now_cell = this.map.cells[creature.coordinates.x][creature.coordinates.y];
    const new_cell = this.map.cells[new_position.x][new_position.y];

    // check cell for sea
    if (new_cell.is_sea)
      return false;

    // remove from last cell
    now_cell.removeCreature(creature);

    // remove from near cells
    const p = creature.coordinates;
    const near_cells_last = [
      this.map.cellAtCoordinates(p.x - 1, p.y),
      this.map.cellAtCoordinates(p.x - 1, p.y - 1),
      this.map.cellAtCoordinates(p.x, p.y - 1),
      this.map.cellAtCoordinates(p.x + 1, p.y),
      this.map.cellAtCoordinates(p.x + 1, p.y + 1),
      this.map.cellAtCoordinates(p.x, p.y + 1),
      this.map.cellAtCoordinates(p.x - 1, p.y + 1),
      this.map.cellAtCoordinates(p.x + 1, p.y - 1),
    ];
    for (let i = 0; i < near_cells_last.length; i++)
      near_cells_last[i].removeNearCreature(creature);

    // update coordinates
    creature.coordinates = new_position;

    // add to new one
    new_cell.addCreature(creature);

    //add to new near cells
    const near_cells_now = [
      this.map.cellAtCoordinates(new_position.x - 1, new_position.y),
      this.map.cellAtCoordinates(new_position.x - 1, new_position.y - 1),
      this.map.cellAtCoordinates(new_position.x, new_position.y - 1),
      this.map.cellAtCoordinates(new_position.x + 1, new_position.y),
      this.map.cellAtCoordinates(new_position.x + 1, new_position.y + 1),
      this.map.cellAtCoordinates(new_position.x, new_position.y + 1),
      this.map.cellAtCoordinates(new_position.x - 1, new_position.y + 1),
      this.map.cellAtCoordinates(new_position.x + 1, new_position.y - 1),
    ];
    for (let i = 0; i < near_cells_now.length; i++)
      near_cells_now[i].addNearCreature(creature);

    // downgrade satiety
    creature.satiety -= this.MOVE_COST;

    // notify controller&visualizer
    this.dispatchEvent(this.MOVE_CREATURE_EVENT, creature);

    return true;
  }

  _generateCreatures(x_range, y_range, amount) {
    const creatures = [];
    for (let i = 0; i < amount; i++)
      creatures.push(this.generateCreature(x_range, y_range));
    return creatures;
  }

  _generateCreatureInteractNet() {
    // input:
    // + eating_type diff
    // + my satiety
    // + its satiety
    // output: eat/none
    const v = this.BASE_NET_VALUE;
    return new NeuralNetwork(
      [
        // 2 neurons in hidden layer
        [v, v],
        [v, v],
        [v, v],
      ], // input
      [
        // 2 outputs & 2 hidden neurons
        [v, v],
        [v, v],
      ], // output
      new OneLayer(
        PROCESS_FUNCTIONS.Lineral_OneLimited,
      ),
      PROCESS_FUNCTIONS.Lineral,
      PROCESS_FUNCTIONS.Lineral_OneLimited,
    ).mutate(this.START_MUTATE_RANGE);
  }

  _generateControlNet() {
    // input:
    // + viewzone(9 cells -> x3(food_type + food_amount + is_sea))
    // + satiety + fatigue
    // + 4 creatures per each direction (x2 -> food_type + satiety)
    // output: move_up/move_right/move_down/move_left/eat/rest
    const v = this.BASE_NET_VALUE;
    return new NeuralNetwork(
      [
        // 8 neurons in hidden layer
        // food type
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        // food amount
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        // is sea
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],

        // satiety
        [v, v, v, v, v, v, v, v],

        // fatigue
        [v, v, v, v, v, v, v, v],

        // creatures food_type
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        // creatures satiety
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
      ], // input
      [
        // 6 outputs & 8 hidden neurons
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
      ], // output
      new OneLayer(
        PROCESS_FUNCTIONS.Lineral_OneLimited,
      ),
      PROCESS_FUNCTIONS.Lineral,
      PROCESS_FUNCTIONS.Lineral_OneLimited,
    ).mutate(this.START_MUTATE_RANGE);
  }

  static _generateCreatureInteractInput(who, whom) {
    return [
      Math.abs(who.eating_type - whom.eating_type),
      who.satiety,
      whom.satiety,
    ];
  }

  _generateControlNetInput(creature) {
    const view_zone = this.viewZoneGetter(creature.coordinates);
    const creatures = this.constructor._generateCreaturesInput(view_zone);
    return [
      // food type diff
      Math.abs(creature.eating_type - view_zone.right.food_type),
      Math.abs(creature.eating_type - view_zone.bottom.food_type),
      Math.abs(creature.eating_type - view_zone.left.food_type),
      Math.abs(creature.eating_type - view_zone.top.food_type),
      Math.abs(creature.eating_type - view_zone.right2.food_type),
      Math.abs(creature.eating_type - view_zone.bottom2.food_type),
      Math.abs(creature.eating_type - view_zone.left2.food_type),
      Math.abs(creature.eating_type - view_zone.top2.food_type),
      Math.abs(creature.eating_type - view_zone.center.food_type),

      // food amount
      view_zone.right.food_amount,
      view_zone.bottom.food_amount,
      view_zone.left.food_amount,
      view_zone.top.food_amount,
      view_zone.right2.food_amount,
      view_zone.bottom2.food_amount,
      view_zone.left2.food_amount,
      view_zone.top2.food_amount,
      view_zone.center.food_amount,

      // is sea
      view_zone.right.is_sea ? 1 : 0,
      view_zone.bottom.is_sea ? 1 : 0,
      view_zone.left.is_sea ? 1 : 0,
      view_zone.top.is_sea ? 1 : 0,
      view_zone.right2.is_sea ? 1 : 0,
      view_zone.bottom2.is_sea ? 1 : 0,
      view_zone.left2.is_sea ? 1 : 0,
      view_zone.top2.is_sea ? 1 : 0,
      view_zone.center.is_sea ? 1 : 0,

      // satiety
      creature.satiety,

      // fatigue
      creature.fatigue,

      // creatures eating_type
      creatures.eating_type.top,
      creatures.eating_type.right,
      creatures.eating_type.bottom,
      creatures.eating_type.left,

      // creatures satieties
      creatures.satieties.top,
      creatures.satieties.right,
      creatures.satieties.bottom,
      creatures.satieties.left,
    ];
  }

  static _generateCreaturesInput(view_zone) {
    function findMainCreature(creatures) {
      if (creatures.length === 0)
        return null;

      let main_creature = null;
      for (let i = 0; i < creatures.length; i++) {
        const creature = creatures[i];
        if (main_creature === null || creature.satiety > main_creature.satiety)
          main_creature = creature;
      }
      return main_creature;
    }

    const c = {
      top: findMainCreature(view_zone.top.walking_creatures),
      right: findMainCreature(view_zone.right.walking_creatures),
      bottom: findMainCreature(view_zone.bottom.walking_creatures),
      left: findMainCreature(view_zone.left.walking_creatures),
    };

    const eating_type = {
      top: c.top === null ? -1 : c.top.eating_type,
      right: c.right === null ? -1 : c.right.eating_type,
      bottom: c.bottom === null ? -1 : c.bottom.eating_type,
      left: c.left === null ? -1 : c.left.eating_type,
    };

    const satieties = {
      top: c.top === null ? -1 : c.top.satiety,
      right: c.right === null ? -1 : c.right.satiety,
      bottom: c.bottom === null ? -1 : c.bottom.satiety,
      left: c.left === null ? -1 : c.left.satiety,
    };

    return {
      eating_type,
      satieties,
    };
  }
}