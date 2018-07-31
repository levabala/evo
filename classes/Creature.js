class Creature {
  constructor(
    id, coordinates, satiety, toxicity_resistance,
    eating_type, request_view_zone, action_net, move_net) {

    Reactor.apply(this, []);

    this.id = id;
    this.satiety = satiety;
    this.toxicity_resistance = toxicity_resistance;
    this.eating_type = eating_type;
    this.coordinates = coordinates;
    this.request_view_zone = request_view_zone;
    this.age = 0;
    this.fatigue = 1;
    this.timecode = Date.now();
    this.generation = 1;

    //neural networks
    this.action_net = action_net;
    this.move_net = move_net;

    //constants
    this.FOOD_VARIETY = 4; //less than 1 -> bad, more than 1 -> good
    this.FATIGUE_DONWGRADE = 0.2;
    this.SPLIT_SATIETY_NEEDED = 0.95;
    this.FOOD_MULTIPLITER = 2;
    this.MAX_AGE = 50 * 1000; //seconds

    //events
    this.registerEvent("wanna_eat");
    this.registerEvent("wanna_move");
    this.registerEvent("wanna_split");
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
      this.action_net.clone(), this.move_net.clone()
    );
  }

  _register_update() {
    this.timecode = Date.now();
  }

  tick(time) {
    this.age += time;
    this._downGradeFatigue();
    this._checkForSplit();
    if (this.fatigue == 0)
      this._makeAction();
  }

  _downGradeFatigue() {
    this.fatigue = Math.max(this.fatigue - this.FATIGUE_DONWGRADE, 0);
  }

  _checkForSplit() {
    if (this.satiety >= this.SPLIT_SATIETY_NEEDED)
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
    this.fatigue = 1;
  }

  split() {
    this.dispatchEvent("wanna_split");
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
      view_zone.right ? view_zone.right.food_type : -1, view_zone.bottom ? view_zone.bottom.food_type : -1,
      view_zone.left ? view_zone.left.food_type : -1, view_zone.top ? view_zone.top.food_type : -1,
      view_zone.right ? view_zone.right.food_amount : -1, view_zone.bottom ? view_zone.bottom.food_amount : -1,
      view_zone.left ? view_zone.left.food_amount : -1, view_zone.top ? view_zone.top.food_amount : -1,
      this.satiety
    ];
  }

  eat(cell) {
    if (!cell) {
      this.dispatchEvent("wanna_eat", this.coordinates);
      return;
    }

    var type_diff = Math.abs(this.eating_type - cell.food_type);
    var amount = Math.min(cell.food_amount, 1);
    var age_modificator = Math.pow((1 - this.age / this.MAX_AGE), 1 / 2);
    if (this.age >= this.MAX_AGE)
      age_modificator = 0;
    if (isNaN(age_modificator))
      debugger;
    var effect = (Math.exp(type_diff) - 1) / (1.7 * this.FOOD_VARIETY) * amount * age_modificator * this.FOOD_MULTIPLITER;
    //console.log(`food lost: ${amount - effect}`);

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