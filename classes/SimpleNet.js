class SimpleNet {
  constructor(weights, output_fun, random = false) {
    this.weights = weights;
    this.output_fun = output_fun;

    this._debug = true;

    if (random) {
      for (var i in this.weights)
        for (var i2 in this.weights[i])
          this.weights[i][i2] = Math.round(Math.random() * 20) / 10;
    }
  }

  calc(input) {
    var output = [];
    for (var o = 0; o < this.weights[0].length; o++)
      output[o] = 0;
    for (var i in this.weights)
      for (var o in this.weights[i])
        output[o] += this.weights[i][o];

    //normalize output
    for (var o in output)
      output[o] = this.output_fun(output[o]);
    return output;
  }
}