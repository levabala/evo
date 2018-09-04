class NeuralNetwork {
  constructor(input_weights, output_weights, hidden_layer, input_fun, output_fun, random = false) {
    this.input_weights = input_weights;
    this.output_weights = output_weights;
    this.hidden_layer = hidden_layer;
    this.input_fun = input_fun;
    this.output_fun = output_fun;

    this._debug = false;

    if (random) {
      for (const i in this.input_weights) {
        for (const i2 in this.input_weights[i])
          this.input_weights[i][i2] = Math.round((Math.random() - 0.5) * 20) / 10;
      }
      for (const i in this.output_weights) {
        for (const i2 in this.output_weights[i])
          this.output_weights[i][i2] = Math.round((Math.random() - 0.5) * 20) / 10;
      }
    }

    // constants
    this.MAX_WEIGHT = 10; // TODO: apply it

    //getters
    this.getRandomMutateModificator =
      () => Math.random() ** 10;
  }

  clone() {
    const cloned_net = new NeuralNetwork(
      clone2dArr(this.input_weights), clone2dArr(this.output_weights),
      this.hidden_layer.clone(), this.input_fun, this.output_fun,
    );
    return cloned_net;
  }

  mutate(range, mutate_hidden = true) {
    for (let i = 0; i < this.input_weights.length; i++) {
      for (let i2 = 0; i2 < this.input_weights[i].length; i2++)
        this.input_weights[i][i2] += range.generateNumber();
    }
    for (let i = 0; i < this.output_weights.length; i++) {
      for (let i2 = 0; i2 < this.output_weights[i].length; i2++)
        this.output_weights[i][i2] += range.generateNumber();
    }

    if (mutate_hidden)
      this.hidden_layer.mutate(range);

    return this;
  }

  mutateWithLimiter(range, mutate_hidden = true) {
    for (let i = 0; i < this.input_weights.length; i++) {
      for (let i2 = 0; i2 < this.input_weights[i].length; i2++)
        this.input_weights[i][i2] += range.generateNumber() * this.getRandomMutateModificator();
    }
    for (let i = 0; i < this.output_weights.length; i++) {
      for (let i2 = 0; i2 < this.output_weights[i].length; i2++)
        this.output_weights[i][i2] += range.generateNumber() * this.getRandomMutateModificator();
    }

    if (mutate_hidden)
      this.hidden_layer.mutateWithLimiter(range);

    return this;
  }

  _CALC_NON_MINIFIED(input) {
    // calc hidden layer input
    const hidden_input = [];
    for (let i = 0; i < this.input_weights[0].length; i++)
      hidden_input[i] = 0;
    for (let i = 0; i < this.input_weights.length; i++) {
      for (let w = 0; w < this.input_weights[i].length; w++) {
        const weight = this.input_weights[i][w];
        const value = this.input_fun(input[i]) * weight;
        hidden_input[w] += value;
      }
    }
    // calc hidden layer
    const hidden_output = this.hidden_layer.calc(hidden_input);

    // calc output
    const output = [];
    for (let i = 0; i < this.output_weights[0].length; i++)
      output[i] = 0;
    for (let ho = 0; ho < this.output_weights.length; ho++) {
      for (let o = 0; o < this.output_weights[ho].length; o++) {
        const weight = this.output_weights[ho][o];
        const addition = hidden_output[ho] * weight;
        output[o] += addition;
      }
    }

    // normalize output
    for (let o = 0; o < output.length; o++)
      output[o] = this.output_fun(output[o]);

    return output;
  }

  calc(a) {
    const b = [];
    for (let e = 0; e < this.input_weights[0].length; e++)
      b[e] = 0;
    for (let e = 0; e < this.input_weights.length; e++) {
      for (let f = 0; f < this.input_weights[e].length; f++)
        b[f] += this.input_fun(a[e]) * this.input_weights[e][f];
      // if (isNaN(b[f]))
      //  debugger
    }
    const c = this.hidden_layer.calc(b);


    const d = [];
    for (let e = 0; e < this.output_weights[0].length; e++)
      d[e] = 0;
    for (let e = 0; e < this.output_weights.length; e++) {
      for (let f = 0; f < this.output_weights[e].length; f++)
        d[f] += c[e] * this.output_weights[e][f];
    }
    for (let e = 0; e < d.length; e++)
      d[e] = this.output_fun(d[e]);
    return d;
  }

  toString() {
    return `input_weights: ${this.input_weights}\noutput_weights: ${this.output_weights}\nhidden_layer: ${this.hidden_layer}\ninput_fun: ${this.input_fun}\noutput_fun: ${this.output_fun}`;
  }

  toJsonObject() {
    return {
      type: this.name,
      input_weights: this.input_weights,
      output_weights: this.output_weights,
      hidden_layer: this.hidden_layer.toJsonObject,
      input_fun_name: this.input_fun.name,
      output_fun_name: this.output_fun.name,
    };
  }
}

NeuralNetwork.fromJsonObject = function (obj) {
  // INVALID FOR ALL EXCEPT OneLayer NETS!
  return new NeuralNetwork(
    obj.input_weights || obj.intput_weight, obj.output_weights,
    (obj.hidden_layer ?
      new NEURAL_NETS[obj.hidden_layer.type](obj.hidden_layer.output_fun_name) :
      new NEURAL_NETS.OneLayer(PROCESS_FUNCTIONS.Lineral_OneLimited)),
    PROCESS_FUNCTIONS[obj.input_fun_name],
    PROCESS_FUNCTIONS[obj.output_fun_name],
  );
};