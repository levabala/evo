const PROCESS_FUNCTIONS = {
  Lineral: function Lineral(value) {
    return value;
  },
  Discret: function Discret(value) {
    return Math.sign(value);
  },
  Sigmoid: function Sigmoid(value) {
    return 1 / (1 + Math.exp(-value));
  },
  Tanh: function Tanh(value) {
    return 2 / (1 + Math.exp(-2 * value)) - 1;
  },
  ReLu: function ReLu(value) {
    return Math.max(0, value);
  },
  Lineral_OneLimited: function Lineral_OneLimited(value) {
    return Range.MinusOneToOne.apply(value);
  },
  Discret_OneLimited: function Discret_OneLimited(value) {
    return Range.MinusOneToOne.apply(Math.sign(value));
  },
  Sigmoid_OneLimited: function Sigmoid_OneLimited(value) {
    return Range.MinusOneToOne.apply(1 / (1 + Math.exp(-value)));
  },
  Tanh_OneLimited: function Tanh_OneLimited(value) {
    return Range.MinusOneToOne.apply(2 / (1 + Math.exp(-2 * value)) - 1);
  },
  ReLu_OneLimited: function ReLu_OneLimited(value) {
    return Range.MinusOneToOne.apply(Math.max(0, value));
  },
};