class Creature {
  constructor(
    id, coordinates, staiety, toxicity_resistance,
    eating_type, request_view_zone, action_net, move_net) {
    this.id = id;
    this.staiety = staiety;
    this.toxicity_resistance = toxicity_resistance;
    this.eating_type = eating_type;
    this.coordinates = coordinates;
    this.request_view_zone = request_view_zone;

    //neural networks
    this.action_net = action_net;
    this.move_net = move_net;

    //constants
    this.FOOD_VARIETY = 1; //less than 1 -> bad, more than 1 -> good
  }

  tick() {
    let view_zone = this.request_view_zone();
  }

  eat(food) {
    var type_diff = Math.abs(this.eating_type - food.type);
    var amount = Math.max(food.amount, 1);
    var effect = (Math.exp(type_diff) - 1) / (1.7 * this.FOOD_VARIETY) * amount;

    this.staiety += effect;
    food.amount -= amount;
  }

  move(delta_x, delta_y) {
    this.coordinates.move(delta_x, delta_y);
  }

  nextPosition(delta_x, delta_y) {
    return this.coordinates.clone().move(delta_x, delta_y);
  }
}