class NetworkLayer {
  constructor(input_weigths, output_weights, neuron_fun) {
    this.input_weigths = input_weigths;
    this.output_weights = output_weights;
    this.neurons_weights = neurons_weights;
    this.neuron_fun = neuron_fun;
  }

  calc(input) {
    var neurons = [];
    //input processing
    for (var i in input)
      for (var n in this.input_weigths)
        neurons[n] += input[i] * this.input_weigths[n];
    for (var n in neurons)
      neurons[n] = this.neuron_fun(neurons[n]);

    //output processing
    var output = [];
    for (var n in this.output_weights)
      for (var i in this.neurons_weights[n])
        output[n] += neurons[i] * this.neurons_weights[n][i];


    return output;
  }
}