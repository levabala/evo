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
    this.processed_time = 0;
    this.last_update_timecode = Date.now();
    this.buffer = 0;

    //constants
    this.MAX_FOOD_AMOUNT = 0.5;
  }

  update(timecode, sim_speed) {
    let real_delta = timecode - this.last_update_timecode;
    let delta = (timecode - this.last_update_timecode) * sim_speed;
    this.last_update_timecode = Math.max(timecode, this.last_update_timecode);

    if (delta == undefined)
      debugger;

    if (delta > 0)
      this._do_all_stuff(delta);
    if (delta < 0) {
      let dd = (timecode - this.last_update_timecode) * sim_speed;
      let a = dd * 23;
      debugger;
    }

    return this;
  }

  _do_all_stuff(time) {
    this.grow(time);
    this.detoxificate(time);
  }

  grow(time) {
    //console.log(Math.round(this.fertility * time * 100) / 100);
    this.food_amount += this.fertility * time;
    this.food_amount = Math.max(Math.min(this.food_amount, this.MAX_FOOD_AMOUNT), 0);
  }

  detoxificate(time) {
    this.toxicity -= this.detoxification_rate * time;
    this.toxicity = Math.max(this.toxicity, 0);
  }
}