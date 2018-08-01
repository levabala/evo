class Cell {
  constructor(
    coordinates, fertility = 0.1, food_type = Math.random(), toxicity = 0,
    detoxification_rate = 0.1, food_amount = 0) {
    this.coordinates = coordinates;
    this.food_type = food_type;
    this.food_amount = food_amount;
    this.fertility = fertility;
    this.detoxification_rate = detoxification_rate;
    this.toxicity = toxicity;
    this.walking_creatures = {};

    //constants
    this.MAX_FOOD_AMOUNT = 0.5;
  }

  tick(time) {
    this.grow(time);
    this.detoxificate(time);
  }

  grow(time) {
    this.food_amount += this.fertility * time;
    this.food_amount = Math.min(this.food_amount, this.MAX_FOOD_AMOUNT);
  }

  detoxificate(time) {
    this.toxicity -= this.detoxification_rate * time;
    this.toxicity = Math.max(this.toxicity, 0);
  }
}