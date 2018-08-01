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

    //constants
    this.MAX_FOOD_AMOUNT = 0.5;
  }

  process(new_timecode, sim_speed) {
    let delta_unscaled = new_timecode - this.last_update_timecode;
    let delta = delta_unscaled * sim_speed;
    this.processed_time += delta;
    console.log(delta, delta_unscaled, this.processed_time, sim_speed);
    this._do_all_stuff(delta);
    this.last_update_timecode = new_timecode;
  }

  tick(time) {
    this.last_update_timecode = Date.now();

    //console.log('r1:', time, this.processed_time)

    let proc_t = Math.max(this.processed_time - time, 0);
    time = Math.max(time - this.processed_time, 0);
    this.processed_time = proc_t;

    //console.log('r2:', time, this.processed_time)

    if (time == 0)
      return;

    this._do_all_stuff(time);
  }

  _do_all_stuff(time) {
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