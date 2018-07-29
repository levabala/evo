var PROCESS_FUNCTIONS = {
  "Lineral": function(value) {
    return value;
  },
  "Discret": function(value) {
    return Math.sign(value);
  },
  "Sigmoid": function(value) {
    return 1 / (1 + Math.exp(-value));
  },
  "Tanh": function(value) {
    return 2 / (1 + Math.exp(-2 * value)) - 1;
  },
  "ReLu": function(value) {
    return Math.max(0, value);
  },
  "Lineral_OneLimited": function(value) {
    return Range.MinusOneToOne.apply(value);
  },
  "Discret_OneLimited": function(value) {
    return Range.MinusOneToOne.apply(Math.sign(value));
  },
  "Sigmoid_OneLimited": function(value) {
    return Range.MinusOneToOne.apply(1 / (1 + Math.exp(-value)));
  },
  "Tanh_OneLimited": function(value) {
    return Range.MinusOneToOne.apply(2 / (1 + Math.exp(-2 * value)) - 1);
  },
  "ReLu_OneLimited": function(value) {
    return Range.MinusOneToOne.apply(Math.max(0, value));
  },
}