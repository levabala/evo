class Creature {
  constructor(
    id, coordinates, satiety, toxicity_resistance,
    eating_type, request_control_net_input, request_interact_net_input,
    control_net, interact_net, food_variety = -0.483, max_age = 50 * 1000,
  ) {
    Reactor.apply(this, []);

    this.id = id;
    this.population_id = Math.floor((Math.random() + 0.5) * 1000 * 1000 * 1000);
    this.satiety = satiety;
    this.satiety_gained = 0;
    this.toxicity_resistance = toxicity_resistance;
    this.eating_type = eating_type;
    this.coordinates = coordinates;
    this.request_control_net_input = request_control_net_input;
    this.request_interact_net_input = request_interact_net_input;
    this.age = 0;
    this.fatigue = 1;
    this.timecode = Date.now();
    this.generation = 1;
    this.food_variety = food_variety;
    this.max_age = max_age;
    this.effectivity = 0;
    this.split_cooldown = 0;
    this.eated_creatures = 0;
    this.children = 0;

    // neural networks
    this.control_net = control_net;
    this.interact_net = interact_net;

    // constants
    this.REST_FATIGUE_REMOVE = 0.005;
    this.FOOD_PER_ACTION = 0.3;
    this.FATIGUE_DONWGRADE_BASE = 0.005;
    this.FATIGUE_DONWGRADE_NOW = this.FATIGUE_DONWGRADE_BASE;
    this.FATIGUE_DONWGRADE_MIN = 0.001;
    this.SPLIT_SATIETY_NEEDED = 0.9;
    this.SPLIT_MIN_INTERVAL = 5000;
    this.FOOD_MULTIPLITER = 1;
    this.ACTION_COST = 1;
    this.EAT_CREATURE_COST = 2;
    this.EAT_CREATURE_EFFECTIVITY = 0.2;

    // getters
    this.getFatigueDowngrade =
      sat => Math.max(this.FATIGUE_DONWGRADE_BASE * ((1 - sat) ** 0.8), this.FATIGUE_DONWGRADE_MIN);

    // events
    this.registerEvent("eaten");
    this.registerEvent("interaction");
    this.registerEvent("wanna_eat");
    this.registerEvent("wanna_move");
    this.registerEvent("wanna_split");
    this.registerEvent("action_performed");
  }

  static _generationPopulationId() {
    return Math.floor((Math.random() + 0.5) * 1000 * 1000 * 1000);
  }

  mutateProps(range) {
    this.toxicity_resistance += range.generateNumber();
    this.eating_type += range.generateNumber();
    if (this.generation % 100)
      this.population_id = this.constructor._generationPopulationId();
    return this;
  }

  mutateNets(range) {
    this.control_net.mutateWithLimiter(range);
    this.interact_net.mutateWithLimiter(range);
    return this;
  }

  clone() {
    const creature = new Creature(
      this.id, this.coordinates.clone(), this.satiety,
      this.toxicity_resistance, this.eating_type, this.request_control_net_input,
      this.request_interact_net_input, this.control_net.clone(),
      this.interact_net.clone(), this.eating_type, this.max_age,
    );
    creature.population_id = this.population_id;
    return creature;
  }

  _register_update() {
    this.timecode = Date.now();
  }

  actionsToDoCount(time) {
    const fatigue_to_spend = time * this.FATIGUE_DONWGRADE_NOW - Math.max(this.fatigue, 0);
    const actions = Math.floor(Math.max(fatigue_to_spend, 0) / this.ACTION_COST);
    return actions;
  }

  timePerAction() {
    const time = this.ACTION_COST / this.FATIGUE_DONWGRADE_NOW;
    return time;
  }

  tick(time) {
    this.age += time;
    this.split_cooldown -= time;
    this.effectivity = this.satiety_gained / this.age * 1000;
    this.FATIGUE_DONWGRADE_NOW = this.getFatigueDowngrade(this.satiety);
    if (this.fatigue <= 0) {
      this._makeAction(time);
      this._checkForSplit();
    }
  }

  downgradeSatiety(value) {
    this.satiety -= value;
    this.FATIGUE_DONWGRADE_NOW = this.getFatigueDowngrade(this.satiety);
  }

  downgradeFatigue(time) {
    this.fatigue = this.fatigue - this.FATIGUE_DONWGRADE_NOW * time;
  }

  _checkForSplit() {
    if (this.satiety >= this.SPLIT_SATIETY_NEEDED && this.split_cooldown <= 0)
      this.split();
  }

  _makeAction(time) {
    const input = this.request_control_net_input(this);
    const actions_weight = this.control_net.calc(input);

    // execute the most weightful action
    const action = ACTIONS_DECIDE_MAP[
      actions_weight.indexOf(
        Math.max(...actions_weight),
      )
    ];

    action(time, this);
    this.fatigue = this.fatigue + this.ACTION_COST;
  }

  rest(time) {
    this.fatigue = this.fatigue - this.REST_FATIGUE_REMOVE * time;
  }

  split() {
    this.dispatchEvent("wanna_split");
    this.split_cooldown = this.SPLIT_MIN_INTERVAL;
  }

  interact(creature) {
    if (this.fatigue > 0)
      return false;

    this.dispatchEvent("interaction");

    const input = this.request_interact_net_input(this, creature);
    const actions_weight = this.interact_net.calc(
      input,
    );

    if (this.EAT_EVERYBODY) {
      ACTION_EAT_CREATURE(0, this, creature);
      return true;
    }

    // execute the most weightful action
    const action = ACTIONS_INTERACT_MAP[
      actions_weight.indexOf(
        Math.max(...actions_weight),
      )
    ];

    action(0, this, creature);

    return true;
  }

  eatCreature(creature) {
    const effect = creature.satiety * this.EAT_CREATURE_EFFECTIVITY;
    this.satiety = Math.min(this.satiety + effect, 1);
    this.FATIGUE_DONWGRADE_NOW = this.getFatigueDowngrade(this.satiety);
    this.fatigue += this.EAT_CREATURE_COST;
    this.eated_creatures++;

    creature.satiety = -1;
    creature.fatigue = Number.MIN_SAFE_INTEGER;
    creature.dispatchEvent("eaten");

    this._register_update();
  }

  eat(cell) {
    if (!cell) {
      this.dispatchEvent("wanna_eat", this.coordinates);
      return;
    }

    const type_diff = Math.abs(this.eating_type - cell.food_type);
    const amount = Math.min(cell.food_amount, this.FOOD_PER_ACTION);
    let age_modificator = (1 - this.age / this.max_age) ** (1 / 2);
    if (this.age >= this.max_age)
      age_modificator = 0;
    // var effect = (Math.exp(type_diff) - 1) / (1.7 * this.food_variety) * amount * age_modificator * this.FOOD_MULTIPLITER;
    let type_diff_coeff = 1;
    if (type_diff < 0.5)
      type_diff_coeff = (1 - type_diff) ** (1 / (2 * this.food_variety + 1));
    else
      type_diff_coeff = -(type_diff ** (1 / (2 * this.food_variety + 1)));

    // console.log(Math.round(type_diff_coeff * 100) / 100, Math.round(amount * 100) / 100, Math.round(age_modificator * 100) / 100)
    let effect =
      type_diff_coeff *
      amount *
      age_modificator;
    effect = Math.min(this.satiety, effect);
    // console.log(`food lost: ${amount - effect}`);

    this.satiety_gained += effect / ((age_modificator === 0) ? 1 : age_modificator);
    this.satiety = Math.min(this.satiety + effect, 1);
    this.FATIGUE_DONWGRADE_NOW = this.getFatigueDowngrade(this.satiety);
    cell.food_amount -= amount;
    this._register_update();
  }

  move(delta_x, delta_y) {
    const new_position = this.nextPosition(delta_x, delta_y);
    this.dispatchEvent("wanna_move", new_position);
    this._register_update();
  }

  nextPosition(delta_x, delta_y) {
    return this.coordinates.clone().move(delta_x, delta_y);
  }

  say(string) {
    console.log(`#${this.id}:`, string);
  }

  generateJsonObjectConstructor() {
    return {
      type: this.constructor.name,
      id: this.id,
      population_id: this.population_id,
      eating_type: this.eating_type,
      generation: this.generation,
      control_net: this.control_net.toJsonObject(),
      interact_net: this.interact_net.toJsonObject(),
    };
  }
}

Creature.fromJsonObject = function fromJsonObject(
  obj, id, coordinates, satiety, toxicity_resistance,
  food_variety, max_age, request_control_net_input, request_interact_net_input,
) {
  const creature = new Creature(
    id, coordinates, satiety, toxicity_resistance, Math.random(),
    request_control_net_input, request_interact_net_input, NeuralNetwork.fromJsonObject(obj.control_net),
    NeuralNetwork.fromJsonObject(obj.interact_net), food_variety, max_age,
  );
  creature.generation = obj.generation || 0;
  if (obj.population_id)
    creature.population_id = obj.population_id;
  return creature;
};

Creature.prototype.EAT_EVERYBODY = false;