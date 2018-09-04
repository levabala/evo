class Cell {
  constructor(
    coordinates, fertility = 0.1, food_type = Math.random(), is_sea = false,
    sea_level = 0, sea_rate = 0, toxicity = 0,
    detoxification_rate = 0.1, food_amount = 0,
  ) {
    this.coordinates = coordinates;
    this.food_type = food_type;
    this.food_amount = food_amount;
    this.fertility = fertility;
    this.detoxification_rate = detoxification_rate;
    this.toxicity = toxicity;
    this.walking_creatures = [];
    this.processed_time = 0;
    this.last_update_timecode = Date.now();
    this.buffer = 0;
    this.is_sea = is_sea;
    this.sea_level = sea_level;
    this.sea_rate = sea_rate;

    // constants
    this.MAX_FOOD_AMOUNT = 0.2;
    this.AMOUNT_CHANGE_TRIGGER = this.MAX_FOOD_AMOUNT * 0.2;
    this.TIME_TRIGGER = this.AMOUNT_CHANGE_TRIGGER / this.fertility; // 0.1 = fertility * time

    // this.food_amount = this.MAX_FOOD_AMOUNT;

    this._do_all_stuff(0);
  }

  addCreature(creature) {
    this.walking_creatures.push(creature);
  }

  removeCreature(creature) {
    const index = this.walking_creatures.find(c => c.id === creature.id);
    this.walking_creatures.splice(index, 1);
  }

  update(timecode, sim_speed) {
    if (this.is_sea)
      return this;

    const delta = (timecode - this.last_update_timecode) * sim_speed;
    if (delta < this.TIME_TRIGGER)
      return this;

    this.last_update_timecode = Math.max(timecode, this.last_update_timecode);

    if (delta > 0)
      this._do_all_stuff(delta);
    if (delta < 0) {}

    return this;
  }

  _do_all_stuff(time) {
    this.grow(time);
    this.detoxificate(time);
  }

  grow(time) {
    // console.log(Math.round(this.fertility * time * 100) / 100);
    this.food_amount += this.fertility * time;
    this.food_amount = Math.max(Math.min(this.food_amount, this.MAX_FOOD_AMOUNT), 0);
  }

  detoxificate(time) {
    this.toxicity -= this.detoxification_rate * time;
    this.toxicity = Math.max(this.toxicity, 0);
  }
}