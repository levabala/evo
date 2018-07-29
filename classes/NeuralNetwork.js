class NeuralNetwork {
  constructor(input_weights, output_weights, hidden_layer, input_fun, output_fun, random = false) {
    this.input_weights = input_weights;
    this.output_weights = output_weights;
    this.hidden_layer = hidden_layer;
    this.input_fun = input_fun;
    this.output_fun = output_fun;

    this._debug = true;

    if (random) {
      for (var i in this.input_weights)
        for (var i2 in this.input_weights[i])
          this.input_weights[i][i2] = Math.round((Math.random() - 0.5) * 20) / 10;
      for (var i in this.output_weights)
        for (var i2 in this.output_weights[i])
          this.output_weights[i][i2] = Math.round((Math.random() - 0.5) * 20) / 10;
    }
  }

  toString() {
    return `input_weights: ${this.input_weights}\noutput_weights: ${this.output_weights}\nhidden_layer: ${this.hidden_layer}\ninput_fun: ${this.input_fun}\noutput_fun: ${this.output_fun}`;
  }

  calc(input) {
    if (this._debug)
      console.log("-- calc-iteration --");
    if (this._debug)
      console.log("input:", input);
    //calc hidden layer input
    var hidden_input = [];
    for (var i = 0; i < this.input_weights[0].length; i++)
      hidden_input[i] = 0;
    for (var i in this.input_weights)
      for (var w in this.input_weights[i]) {
        var weight = this.input_weights[i][w];
        var value = this.input_fun(input[i]) * weight;
        hidden_input[i] += value;
      }

    if (this._debug)
      console.log("hidden_input:", hidden_input);

    //calc hidden layer
    var hidden_output = this.hidden_layer.calc(hidden_input);

    if (this._debug)
      console.log("hidden_output:", hidden_output);

    //calc output
    var output = [];
    for (var i = 0; i < this.output_weights[0].length; i++)
      output[i] = 0;
    for (var ho in this.output_weights)
      for (var o in this.output_weights[ho]) {
        var weight = this.output_weights[ho][o];
        var addition = hidden_output[ho] * weight;
        output[o] += addition;
      }

    if (this._debug)
      console.log("output:", output);

    //normalize output
    for (var o in output)
      output[o] = this.output_fun(output[o]);

    if (this._debug)
      console.log("output_normalized:", output);
    if (this._debug)
      console.log("-- calc-iteration-end --");
    return output;
  }
}