class OneLayer {
  constructor(output_fun) {
    this.output_fun = output_fun;
  }

  calc(input) {
    //normalize output    
    let output = input.slice();
    for (var o in output)
      output[o] = this.output_fun(output[o]);
    return output;
  }

  mutate() {
    //none here
  }
}