function CreatureWorker() {
  //importScripts("requestTypes.js", "../NeuralNetwork.js", "../NetworkLayer.js");  
  let actions_nets = {}; //creature.id - net
  let move_nets = {};

  onmessage = function(e) {
    let type = e.data[0];
    switch (type) {
      case REQUEST_TYPES.ADD_CREATURE:
        let creature = e.data[1];
        action_nets[creature.id] = creature.action_net
        move_nets[creature.id] = creature.move_net
        break;
      case REQUEST_TYPES.REMOVE_CREATURE:
        let creature = e.data[1];
        delete action_nets[creature.id];
        delete move_nets[creature.id];
        break;
      case REQUEST_TYPES.CHANGE_CREATURE:
        //TODO: ?
        break;
      case REQUEST_TYPES.CALC_MOVE_NET_CREATURE:
        let creatures_id = e.data[1];
        let inputs = e.data[2];
        let outputs = [];
        for (let i = 0; i < creatures_id.length; i++)
          outputs[i] = move_nets[creatures_id[i]].calc(inputs[i]);
        break;
      case REQUEST_TYPES.CALC_ACTION_NET_CREATURE:
        let creatures_id = e.data[1];
        let inputs = e.data[2];
        let outputs = [];
        for (let i = 0; i < creatures_id.length; i++)
          outputs[i] = action_nets[creatures_id[i]].calc(inputs[i]);
        break;
      default:
        break;
    }
  }
}