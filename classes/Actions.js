let _debug = false;

var ACTION_MOVE_LEFT = function(creature) {
  if (_debug)
    creature.say("wanna move left")
  creature.move(-1, 0);
}

var ACTION_MOVE_RIGHT = function(creature) {
  if (_debug)
    creature.say("wanna move right")
  creature.move(1, 0);
}

var ACTION_MOVE_UP = function(creature) {
  if (_debug)
    creature.say("wanna move up")
  creature.move(0, -1);
}

var ACTION_MOVE_DOWN = function(creature) {
  if (_debug)
    creature.say("wanna move down")
  creature.move(0, 1);
}

var ACTION_NONE = function(creature) {
  if (_debug)
    creature.say("wanna do nothing")
}

var ACTION_MOVE = function(creature) {
  if (_debug)
    creature.say("wanna move")
  creature.move_decide();
}

var ACTION_EAT = function(creature) {
  if (_debug)
    creature.say("wanna eat")
  creature.eat();
}

var ACTION_SPLIT = function(creature) {
  if (_debug)
    creature.say("wanna split")
}

var ACTIONS_DECIDE_MAP = {
  0: ACTION_MOVE,
  1: ACTION_EAT,
  2: ACTION_SPLIT,
  3: ACTION_NONE
}

var ACTIONS_MOVE_MAP = {
  0: ACTION_MOVE_RIGHT,
  1: ACTION_MOVE_DOWN,
  2: ACTION_MOVE_LEFT,
  3: ACTION_MOVE_UP,
  4: ACTION_NONE
}