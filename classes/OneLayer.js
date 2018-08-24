class OneLayer {
  constructor(output_fun) {
    this.output_fun = output_fun;
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