class OneLayer {
  constructor(output_fun) {
    this.output_fun = output_fun;
  }

  toJsonObject() {
    return {
      type: this.name,
      output_fun_name: this.output_fun.name
    }
  }

  calc(input) {
    //normalize output    
    let output = input.slice();
    for (let o in output)
      output[o] = this.output_fun(output[o]);
    return output;
  }

  mutate() {
    //none here
  }

  clone() {
    return new OneLayer(this.output_fun);
  }
}

OneLayer.fromJsonObject = function (obj) {
  return new OneLayer(PROCESS_FUNCTIONS[obj.output_fun_name]);
}