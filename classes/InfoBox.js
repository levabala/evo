class InfoBox {
  constructor(div) {
    this.div = div;
    this.data = {}; // name - element
  }

  static _createInfoEl(name) {
    const div = document.createElement("div");
    const title = document.createElement("b");
    title.innerHTML = `${name}: `;
    const value_span = document.createElement("div");
    value_span.setAttribute("style", "display: inline-block; float: right; margin-left: 5px");
    div.appendChild(title);
    div.appendChild(value_span);
    div.setValue = function setDivValue(new_value) {
      this.children[1].innerHTML = new_value;
    };
    return div;
  }

  addInfo(id, info) {
    const el = InfoBox._createInfoEl(info.name);
    el.setValue(info.value);
    this.data[id] = el;
    this.div.appendChild(el);
    info.addEventListener("changed", () => el.setValue(info.styled_value));
  }

  removeInfo(id) {
    this.div.removeChild(this.data[id]);
    delete this.data[id];
  }
}

class Info {
  constructor(
    name, value,
    process_fun = val => val, max_digits = 3,
  ) {
    Reactor.apply(this, []);

    this.name = name;
    this.max_digits = max_digits;
    this.process_fun = process_fun;
    this._value = value;

    // events
    this.registerEvent("changed");
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = Math.round(value * (10 ** this.max_digits)) / (10 ** this.max_digits);
    this.dispatchEvent("changed", this._value);
  }

  get styled_value() {
    return this.process_fun(this._value);
  }
}