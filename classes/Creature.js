class Creature {
  constructor(
    id, coordinates, satiety, toxicity_resistance,
    eating_type, request_view_zone,
    action_net, move_net, food_variety = -0.483, max_age = 50 * 1000) {

    Reactor.apply(this, []);

    this.id = id;
    this.satiety = satiety;
    this.satiety_gained = 0;
    this.toxicity_resistance = toxicity_resistance;
    this.eating_type = eating_type;
    this.coordinates = coordinates;
    this.request_view_zone = request_view_zone;
    this.age = 0;
    this.fatigue = 1;
    this.timecode = Date.now();
    this.generation = 1;
    this.food_variety = food_variety;
    this.max_age = max_age;
    this.effectivity = 0;
    this.split_cooldown = 0;

    //neural networks
    this.action_net = action_net;
    this.move_net = move_net;

    //constants    
    this.FOOD_PER_ACTION = 0.3;
    this.FATIGUE_DONWGRADE = 0.005;
    this.SPLIT_SATIETY_NEEDED = 0.9;
    this.SPLIT_MIN_INTERVAL = 5000;
    this.FOOD_MULTIPLITER = 1;
    this.ACTION_COST = 1;

    //events
    this.registerEvent("wanna_eat");
    this.registerEvent("wanna_move");
    this.registerEvent("wanna_split");
    this.registerEvent("action_performed");
  }

  mutateProps(range) {
    this.toxicity_resistance += range.generateNumber();
    this.eating_type += range.generateNumber();
    return this;
  }

  mutateNets(range) {
    this.action_net.mutate(range);
    this.move_net.mutate(range);
    return this;
  }

  clone() {
    return new Creature(
      this.id, this.coordinates.clone(), this.satiety,
      this.toxicity_resistance, this.eating_type, this.request_view_zone,
      this.action_net.clone(), this.move_net.clone(), this.eating_type, this.max_age
    );
  }

  _register_update() {
    this.timecode = Date.now();
  }

  actionsToDoCount(time) {
    let fatigue_lost = time * this.FATIGUE_DONWGRADE;
    return Math.floor(Math.max(fatigue_lost, 0) / this.ACTION_COST);
  }

  timePerAction() {
    return this.ACTION_COST / this.FATIGUE_DONWGRADE;
  }

  tick(time) {
    this.age += time;
    this.split_cooldown -= time;
    if (this.age == 0)
      debugger;
    this.effectivity = this.satiety_gained / this.age * 1000;
    this._downGradeFatigue(time);
    if (this.fatigue <= 0) {
      this._makeAction();
      this._checkForSplit();
    }
  }

  _downGradeFatigue(time) {
    this.fatigue = this.fatigue - this.FATIGUE_DONWGRADE * time;
  }

  _checkForSplit() {
    if (this.satiety >= this.SPLIT_SATIETY_NEEDED && this.split_cooldown <= 0)
      this.split();
  }

  _makeAction() {
    let actions_weight = this.action_net.calc(
      this._generateNetInput()
    );

    //execute the most weightful action
    let action = ACTIONS_DECIDE_MAP[
      actions_weight.indexOf(
        Math.max(...actions_weight)
      )
    ];

    action(this);
    this.fatigue = Math.max(0, this.fatigue + this.ACTION_COST);
  }

  split() {
    this.dispatchEvent("wanna_split");
    this.split_cooldown = this.SPLIT_MIN_INTERVAL;
  }

  move_decide() {
    let move_weight = this.move_net.calc(
      this._generateNetInput()
    );

    //move to the most weightful direction
    let move_action = ACTIONS_MOVE_MAP[
      move_weight.indexOf(
        Math.max(...move_weight)
      )
    ];
    move_action(this);
  }

  _generateNetInput() {
    let view_zone = this.request_view_zone(this.coordinates);
    return [
      view_zone.right ? Math.abs(this.eating_type - view_zone.right.food_type) : -1,
      view_zone.bottom ? Math.abs(this.eating_type - view_zone.bottom.food_type) : -1,
      view_zone.left ? Math.abs(this.eating_type - view_zone.left.food_type) : -1,
      view_zone.top ? Math.abs(this.eating_type - view_zone.top.food_type) : -1,
      view_zone.right2 ? Math.abs(this.eating_type - view_zone.right2.food_type) : -1,
      view_zone.bottom2 ? Math.abs(this.eating_type - view_zone.bottom2.food_type) : -1,
      view_zone.left2 ? Math.abs(this.eating_type - view_zone.left2.food_type) : -1,
      view_zone.top2 ? Math.abs(this.eating_type - view_zone.top2.food_type) : -1,
      view_zone.right ? view_zone.right.food_amount : -1,
      view_zone.bottom ? view_zone.bottom.food_amount : -1,
      view_zone.left ? view_zone.left.food_amount : -1,
      view_zone.top ? view_zone.top.food_amount : -1,
      view_zone.right2 ? view_zone.right2.food_amount : -1,
      view_zone.bottom2 ? view_zone.bottom2.food_amount : -1,
      view_zone.left2 ? view_zone.left2.food_amount : -1,
      view_zone.top2 ? view_zone.top2.food_amount : -1,
      Math.abs(this.eating_type - view_zone.center.food_type),
      view_zone.center.food_amount,
      this.satiety
    ];
  }

  eat(cell) {
    if (!cell) {
      this.dispatchEvent("wanna_eat", this.coordinates);
      return;
    }

    var type_diff = Math.abs(this.eating_type - cell.food_type);
    var amount = Math.min(cell.food_amount, this.FOOD_PER_ACTION);
    var age_modificator = Math.pow((1 - this.age / this.max_age), 1 / 2);
    if (this.age >= this.max_age)
      age_modificator = 0;
    //var effect = (Math.exp(type_diff) - 1) / (1.7 * this.food_variety) * amount * age_modificator * this.FOOD_MULTIPLITER;
    let type_diff_coeff = 1;
    if (type_diff < 0.5) {
      type_diff_coeff = Math.pow(1 - type_diff, 1 / (2 * this.food_variety + 1));
    } else {
      type_diff_coeff = -Math.pow(type_diff, 1 / (2 * this.food_variety + 1));
    }
    //console.log(Math.round(type_diff_coeff * 100) / 100, Math.round(amount * 100) / 100, Math.round(age_modificator * 100) / 100)
    var effect =
      type_diff_coeff *
      amount *
      age_modificator
    if (isNaN(effect))
      debugger;
    effect = Math.min(this.satiety, effect);
    //console.log(`food lost: ${amount - effect}`);

    this.satiety_gained += effect / age_modificator;
    this.satiety = Math.min(this.satiety + effect, 1);
    cell.food_amount -= amount;
    this._register_update();
  }

  move(delta_x, delta_y) {
    let new_position = this.nextPosition(delta_x, delta_y);
    this.dispatchEvent("wanna_move", new_position);
    this._register_update();
  }

  nextPosition(delta_x, delta_y) {
    return this.coordinates.clone().move(delta_x, delta_y);
  }

  say(string) {
    console.log("#" + this.id + ":", string);
  }
}