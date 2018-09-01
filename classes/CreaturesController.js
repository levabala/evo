class CreaturesController {
  constructor(map) {
    //add reactor
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


    //constants    
    this.MINIMAL_CREATURES_DENSITY = 0.005; //creatures per cell
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
    this.CREATURE_SATIETY_DOWNGRADE = 0.00002;
    this.CHILD_NET_MUTATE_RANGE = new Range(-0.03, 0.03);
    this.CHILD_PROPS_MUTATE_RANGE = new Range(-0.05, 0.05);
    this.MINIMAL_SATIETY_ALIVE = 0.05;
    this.NEW_CREATURES_PER_SECS = 1;
    this.NEW_CREATURE_FOOD_VARIETY = -0.47;
    this.NEW_CREATURE_MAX_AGE = 200 * 1000;
    this.MOVE_COST = 0.01;
    this.RANDOM_CREATURES_ADDED_PER_SECOND_FOR_CELL = 0.0003;
    this.MAX_NEW_CREATURES_AT_ONCE = 1000000;

    //other    
    this.new_creature_buffer = 0;
    this.new_random_creautures_createn = 0;
    this._time_buffer_1 = 0;
    this._time_buffer_2 = 0;

    //events    
    this.registerEvent(this.NEW_CREATURE_EVENT);
    this.registerEvent(this.DEAD_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURE_EVENT);
    this.registerEvent(this.MOVE_CREATURES_EVENT);
    this.registerEvent(this.PROCESS_CELL_EVENT);
  }

  tick(time, timecode, tick_length, sim_speed) {
    this.sim_speed = sim_speed;

    let real_delta = timecode - this.last_tick_timecode;
    let sim_delta = real_delta * sim_speed;

    this._auto_add_creatures(0);
    let creatures = Object.values(this.creatures);
    let max_actions_count = creatures.reduce(
      (max_count, creature) => {
        return Math.max(max_count, creature.actionsToDoCount(sim_delta));
      }, 0
    );
    let min_time_per_action = creatures.reduce(
      (time_per_action, creature) => {
        return Math.min(time_per_action, creature.timePerAction());
      }, Number.MAX_SAFE_INTEGER
    );
    this.maximal_actions_count = max_actions_count;

    if (max_actions_count == 0)
      return false;

    this.eaten_creatures = this.interactions_per_tick = 0;

    let real_time_per_tick = min_time_per_action / sim_speed;
    let sim_time_per_tick = min_time_per_action;
    for (let i = 0; i < max_actions_count; i++) {
      this._auto_add_creatures(sim_time_per_tick);
      this._internal_tick(sim_time_per_tick);
      this.last_tick_timecode += real_time_per_tick;
    }

    this.interaction_per_sec = this.interactions_per_tick / sim_time_per_tick / max_actions_count * 1000;
    this.interaction_per_sec_buffer.push(this.interaction_per_sec);
    if (this.interaction_per_sec_buffer.length > 5)
      this.interaction_per_sec_buffer.shift();

    this.interaction_per_sec_average = 0;
    for (let rate of this.interaction_per_sec_buffer)
      this.interaction_per_sec_average += rate;
    this.interaction_per_sec_average /= this.interaction_per_sec_buffer.length;

    this.eaten_creatures_rate =
      this.interactions_per_tick > 0 ?
      this.eaten_creatures / this.interactions_per_tick :
      0;

    this.eaten_creatures_per_sec_buffer.push(this.eaten_creatures_rate);
    if (this.eaten_creatures_per_sec_buffer.length > 5)
      this.eaten_creatures_per_sec_buffer.shift();

    this.eaten_creatures_per_sec_average = 0;
    for (let rate of this.eaten_creatures_per_sec_buffer)
      this.eaten_creatures_per_sec_average += rate;
    this.eaten_creatures_per_sec_average /= this.eaten_creatures_per_sec_buffer.length;

    return true;
  }

  _auto_add_creatures(time) {
    this.new_creature_buffer += time / 1000 * (this.RANDOM_CREATURES_ADDED_PER_SECOND_FOR_CELL * this.map.width * this.map.height);
    this.new_creature_buffer = Math.min(this.MAX_NEW_CREATURES_AT_ONCE, this.new_creature_buffer);
    while (this.new_creature_buffer > 1) {
      this._generateAndAddCreature();
      this.new_creature_buffer--;
    }
    while (this._checkCreaturesLimit()) {}
  }

  _internal_tick(time) {
    this.maximal_generation = 0;
    this.maximal_age = 0;
    this.maximal_effectivity = 0;
    this.maximal_eaten_creatures = 0;

    //all creatures tick    
    let change = this.CREATURE_SATIETY_DOWNGRADE * time;
    let count = 0;
    for (let id in this.creatures) {
      let creature = this.creatures[id];

      //interact other one
      let pos = creature.coordinates;
      let near_cells = [
        this.map.cells[pos.x][pos.y],
        this.map.cellAtCoordinates(pos.x - 1, pos.y),
        this.map.cellAtCoordinates(pos.x - 1, pos.y - 1),
        this.map.cellAtCoordinates(pos.x, pos.y - 1),
        this.map.cellAtCoordinates(pos.x + 1, pos.y),
        this.map.cellAtCoordinates(pos.x + 1, pos.y + 1),
        this.map.cellAtCoordinates(pos.x, pos.y + 1),
        this.map.cellAtCoordinates(pos.x - 1, pos.y + 1),
        this.map.cellAtCoordinates(pos.x + 1, pos.y - 1),
      ];
      for (let cell of near_cells) {
        let new_creatures = cell.walking_creatures;
        for (let id in new_creatures) {
          let c = new_creatures[id];
          if (id == creature.id || c.satiety >= creature.satiety)
            continue;
          if (!creature.interact(c))
            break;
        }
      }

      //perform other actions
      creature.tick(time);

      //downgrade
      creature.satiety -= change;
      if (creature.satiety <= this.MINIMAL_SATIETY_ALIVE)
        this._removeCreature(creature);

      //statistic
      this.maximal_generation = Math.max(this.maximal_generation, creature.generation);
      this.maximal_age = Math.max(this.maximal_age, creature.age);
      this.maximal_effectivity = Math.max(this.maximal_effectivity, creature.effectivity);
      this.maximal_eaten_creatures = Math.max(this.maximal_eaten_creatures, creature.eaten_creatures);

      count++;
    }
    this.creatures_count = count;
  }

  reset() {
    this.creatures = [];
    this.creatures_counter = 0;
  }

  viewZoneGetter(pos) {
    let view_zone = {
      left: this.map.cellAtPoint(pos.clone().move(-1, 0)).update(this.last_tick_timecode, this.sim_speed),
      left2: this.map.cellAtPoint(pos.clone().move(-2, 0)).update(this.last_tick_timecode, this.sim_speed),
      right: this.map.cellAtPoint(pos.clone().move(1, 0)).update(this.last_tick_timecode, this.sim_speed),
      right2: this.map.cellAtPoint(pos.clone().move(2, 0)).update(this.last_tick_timecode, this.sim_speed),
      top: this.map.cellAtPoint(pos.clone().move(0, -1)).update(this.last_tick_timecode, this.sim_speed),
      top2: this.map.cellAtPoint(pos.clone().move(0, -2)).update(this.last_tick_timecode, this.sim_speed),
      bottom: this.map.cellAtPoint(pos.clone().move(0, 1)).update(this.last_tick_timecode, this.sim_speed),
      bottom2: this.map.cellAtPoint(pos.clone().move(0, 2)).update(this.last_tick_timecode, this.sim_speed),
      center: this.map.cells[pos.x][pos.y].update(this.last_tick_timecode, this.sim_speed)
    };

    return view_zone;
  }

  _splitCreature(creature) {
    let center = creature.coordinates;

    //square 3x3 without the center
    let deltas = [
      new P(1, 0), new P(1, 1), new P(0, 1),
      new P(-1, 1), new P(-1, 0), new P(-1, -1),
      new P(0, -1), new P(1, -1)
    ];

    let free_deltas = deltas.filter(
      function (delta) {
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
    new_creature.food_variety = this.NEW_CREATURE_FOOD_VARIETY;
    new_creature.max_age = this.NEW_CREATURE_MAX_AGE;

    this._processNewCreature(new_creature);
    this.addCreature(new_creature);

    creature.satiety -= this.SPLIT_COST;
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
    let creatures_count = Object.keys(this.creatures).length;
    let density = creatures_count == 0 ? 0 : creatures_count / (this.map.width * this.map.height - this.map.sea_cells_count);
    this.creatures_density = density;
    return density;
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

  pushCreatures(creature_dump, count) {
    for (let i = 0; i < count; i++) {
      let creature = this.pushCreature(
        creature_dump, this.map.HORIZONTAL_AXIS_RANGE, this.map.VERTICAL_AXIS_RANGE
      );
    }
  }

  pushCreature(creature_dump, x_range, y_range) {
    this.creatures_counter++;
    let creature = Creature.fromJsonObject(
      creature_dump,
      this.creatures_counter,
      this._generateSpawnPosition(x_range, y_range),
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      this.NEW_CREATURE_FOOD_VARIETY,
      this.NEW_CREATURE_MAX_AGE,
      this._generateControlNetInput.bind(this),
      this._generateCreatureInteractInput.bind(this)
    )
    this._processNewCreature(creature);
    this.addCreature(creature);
    return creature;
  }

  _generateCreature(x_range, y_range) {
    this.creatures_counter++;
    var creature = new Creature(
      this.creatures_counter,
      this._generateSpawnPosition(x_range, y_range),
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      Math.random(),
      this._generateControlNetInput.bind(this),
      this._generateCreatureInteractInput.bind(this),
      this._generateControlNet(),
      this._generateCreatureInteractNet(),
      this.NEW_CREATURE_FOOD_VARIETY,
      this.NEW_CREATURE_MAX_AGE
    );
    this._processNewCreature(creature);
    return creature;
  }

  _generateSpawnPosition(x_range, y_range) {
    const generateNewPos = () => {
      return new P(Math.floor(x_range.generateNumber()), Math.floor(y_range.generateNumber()));
    };
    let pos;
    let checkNext = () => {
      pos = generateNewPos();
      return this.map.cells[pos.x][pos.y].isSea;
    };
    while (checkNext()) {}
    return pos;
  }

  _generateCreatureAtPosition(pos) {
    this.creatures_counter++;
    var creature = new Creature(
      this.creatures_counter,
      pos,
      this.NEW_CREATURE_SATIETY,
      this.TOXICIETY_RESISTANCE,
      Math.random(),
      this.viewZoneGetter.bind(this),
      this._generateCreatureInteractInput.bind(this),
      this._generateControlNet(),
      this._generateCreatureInteractNet(),
      this.NEW_CREATURE_FOOD_VARIETY,
      this.NEW_CREATURE_MAX_AGE
    );
    this._processNewCreature(creature);
    return creature;
  }

  _cratureWannaEat(creature) {
    let cell = this.map.cells[creature.coordinates.x][creature.coordinates.y];
    creature.eat(cell.update(this.last_tick_timecode, this.sim_speed));
  }

  _processNewCreature(creature) {
    creature
      .addEventListener(
        "wanna_move",
        function (new_position) {
          this._creatureWannaMove(creature, new_position);
        }.bind(this))
      .addEventListener(
        "wanna_eat",
        function () {
          this._cratureWannaEat(creature);
        }.bind(this))
      .addEventListener(
        "wanna_split",
        function () {
          this._splitCreature(creature);
        }.bind(this))
      .addEventListener(
        "eaten",
        function () {
          this.eaten_creatures++;
        }.bind(this))
      .addEventListener(
        "interaction",
        function () {
          this.interactions_per_tick++;
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

    let now_cell = this.map.cells[creature.coordinates.x][creature.coordinates.y];
    let new_cell = this.map.cells[new_position.x][new_position.y];

    //check cell for sea
    if (new_cell.is_sea)
      return false;

    //remove from last cell    
    delete now_cell.walking_creatures[creature.id];

    //update coordinates
    creature.coordinates = new_position;

    //add to new one    
    new_cell.walking_creatures[creature.id] = creature;

    //downgrade satiety
    creature.satiety -= this.MOVE_COST;

    //notify controller&visualizer
    this.dispatchEvent(this.MOVE_CREATURE_EVENT, creature);
  }

  _generateCreatures(x_range, y_range, amount) {
    var creatures = []
    for (var i = 0; i < amount; i++)
      creatures.push(this.generateCreature(x_range, y_range));
    return creatures;
  }

  _generateCreatureInteractNet() {
    //input:
    //+ eating_type diff
    //+ my satiety
    //+ its satiety
    //output: eat/none
    let v = this.BASE_NET_VALUE;
    return new NeuralNetwork(
      [
        //2 neurons in hidden layer
        [v, v],
        [v, v],
        [v, v]
      ], //input
      [
        //2 outputs & 2 hidden neurons
        [v, v],
        [v, v],
      ], //output
      new OneLayer(
        PROCESS_FUNCTIONS.Lineral_OneLimited
      ),
      PROCESS_FUNCTIONS.Lineral,
      PROCESS_FUNCTIONS.Lineral_OneLimited
    ).mutate(this.START_MUTATE_RANGE);
  }

  _generateControlNet() {
    //input: 
    //+ viewzone(9 cells -> x3(food_type + food_amount + is_sea))
    //+ satiety + fatigue
    //+ 4 creatures per each direction (x2 -> food_type + satiety)    
    //output: move_up/move_right/move_down/move_left/eat/rest
    let v = this.BASE_NET_VALUE;
    return new NeuralNetwork(
      [
        //8 neurons in hidden layer
        //food type
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        //food amount
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        //is sea
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],

        //satiety
        [v, v, v, v, v, v, v, v],

        //fatigue
        [v, v, v, v, v, v, v, v],

        //creatures food_type
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        //creatures satiety
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
        [v, v, v, v, v, v, v, v],
      ], //input
      [
        //6 outputs & 8 hidden neurons
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
        [v, v, v, v, v, v],
      ], //output
      new OneLayer(
        PROCESS_FUNCTIONS.Lineral_OneLimited
      ),
      PROCESS_FUNCTIONS.Lineral,
      PROCESS_FUNCTIONS.Lineral_OneLimited
    ).mutate(this.START_MUTATE_RANGE);
  }

  _generateCreatureInteractInput(who, whom) {
    return [
      Math.abs(who.eating_type - whom.eating_type),
      who.satiety,
      whom.satiety
    ]
  }

  _generateControlNetInput(creature) {
    let view_zone = this.viewZoneGetter(creature.coordinates);
    let creatures = this._generateCreaturesInput(view_zone);
    return [
      //food type diff
      Math.abs(creature.eating_type - view_zone.right.food_type),
      Math.abs(creature.eating_type - view_zone.bottom.food_type),
      Math.abs(creature.eating_type - view_zone.left.food_type),
      Math.abs(creature.eating_type - view_zone.top.food_type),
      Math.abs(creature.eating_type - view_zone.right2.food_type),
      Math.abs(creature.eating_type - view_zone.bottom2.food_type),
      Math.abs(creature.eating_type - view_zone.left2.food_type),
      Math.abs(creature.eating_type - view_zone.top2.food_type),
      Math.abs(creature.eating_type - view_zone.center.food_type),

      //food amount
      view_zone.right.food_amount,
      view_zone.bottom.food_amount,
      view_zone.left.food_amount,
      view_zone.top.food_amount,
      view_zone.right2.food_amount,
      view_zone.bottom2.food_amount,
      view_zone.left2.food_amount,
      view_zone.top2.food_amount,
      view_zone.center.food_amount,

      //is sea
      view_zone.right.is_sea ? 1 : 0,
      view_zone.bottom.is_sea ? 1 : 0,
      view_zone.left.is_sea ? 1 : 0,
      view_zone.top.is_sea ? 1 : 0,
      view_zone.right2.is_sea ? 1 : 0,
      view_zone.bottom2.is_sea ? 1 : 0,
      view_zone.left2.is_sea ? 1 : 0,
      view_zone.top2.is_sea ? 1 : 0,
      view_zone.center.is_sea ? 1 : 0,

      //satiety
      creature.satiety,

      //fatigue
      creature.fatigue,

      //creatures eating_type
      creatures.eating_type.top,
      creatures.eating_type.right,
      creatures.eating_type.bottom,
      creatures.eating_type.left,

      //creatures satieties
      creatures.satieties.top,
      creatures.satieties.right,
      creatures.satieties.bottom,
      creatures.satieties.left,
    ];
  }

  _generateCreaturesInput(view_zone) {
    let c = {
      top: findMainCreature(view_zone.top.walking_creatures),
      right: findMainCreature(view_zone.right.walking_creatures),
      bottom: findMainCreature(view_zone.bottom.walking_creatures),
      left: findMainCreature(view_zone.left.walking_creatures),
    };

    let eating_type = {
      top: c.top === null ? -1 : c.top.eating_type,
      right: c.right === null ? -1 : c.right.eating_type,
      bottom: c.bottom === null ? -1 : c.bottom.eating_type,
      left: c.left === null ? -1 : c.left.eating_type,
    };

    let satieties = {
      top: c.top === null ? -1 : c.top.satiety,
      right: c.right === null ? -1 : c.right.satiety,
      bottom: c.bottom === null ? -1 : c.bottom.satiety,
      left: c.left === null ? -1 : c.left.satiety,
    };

    return {
      eating_type: eating_type,
      satieties: satieties
    }


    function findMainCreature(creatures) {
      if (creatures.length == 0)
        return null;

      let main_creature = null;
      for (let id in creatures) {
        let creature = creatures[id];
        if (main_creature === null || creature.satiety > main_creature.satiety)
          main_creature = creature;
      }
      return main_creature;
    }
  }
}