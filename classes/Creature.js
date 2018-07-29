class Creature {
  constructor(id, coordinates, staiety, toxicity_resistance, eating_type) {
    this.id = id;
    this.staiety = staiety;
    this.toxicity_resistance = toxicity_resistance;
    this.eating_type = eating_type;
    this.coordinates = coordinates;

    //constants
    this.FOOD_VARIETY = 1; //less than 1 -> bad, more than 1 -> good
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