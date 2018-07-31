class Range {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  apply(value) {
    if (this.from >= value)
      return this.from;
    if (this.to <= value)
      return this.to;
    return value;
  }

  isIn(value, include = false) {
    if (
      include && (this.from > value || this.to < value) ||
      !include && (this.from >= value || this.to <= value))
      return false;
    else
      return true;
  }

  generateNumber() {
    return Math.random() * (this.to - this.from) + this.from;
  }
}

Range.Binary = new Range(0, 1);
Range.MinusOneToOne = new Range(-1, 1);

class P {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    return this;
  }

  add(p) {
    this.x += p.x;
    this.y += p.y;
    return this;
  }

  clone() {
    return new P(this.x, this.y);
  }

  inRange(x_range, y_range, include = true) {
    return x_range.isIn(this.x, include) && y_range.isIn(this.y, include);
  }

  toString() {
    return this.x + ":" + this.y;
  }
}