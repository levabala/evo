const times = [];

// fps counter
function refreshLoop() {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000)
      times.shift();

    times.push(now);
    window.FPS = times.length;
    refreshLoop();
  });
}
refreshLoop();

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

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
    /* if (
      include && (this.from > value || this.to < value) ||
      !include && (this.from >= value || this.to <= value))
      return false;
    return true; */
    return !(include && !(this.from <= value && this.to >= value)) &&
      !(!include && !(this.from < value && this.to > value));
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
    return `${this.x}:${this.y}`;
  }
}

function cloneObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function clone2dArr(array) {
  return array.map(arr => arr.slice());
}

function creatureWorkerURL(worker_function) {
  return URL.createObjectURL(
    new Blob([`(${worker_function.toString()})()`], {
      type: "text/javascript",
    }),
  );
}