const _debug = false;

const ACTION_MOVE_LEFT = function (time, creature) {
  if (_debug)
    creature.say("wanna move left");
  creature.move(-1, 0);
};

const ACTION_MOVE_RIGHT = function (time, creature) {
  if (_debug)
    creature.say("wanna move right");
  creature.move(1, 0);
};

const ACTION_MOVE_UP = function (time, creature) {
  if (_debug)
    creature.say("wanna move up");
  creature.move(0, -1);
};

const ACTION_MOVE_DOWN = function (time, creature) {
  if (_debug)
    creature.say("wanna move down");
  creature.move(0, 1);
};

const ACTION_NONE = function (time, creature) {
  if (_debug)
    creature.say("wanna do nothing");
};

const ACTION_EAT = function (time, creature) {
  if (_debug)
    creature.say("wanna eat");
  creature.eat();
};

const ACTION_SPLIT = function (time, creature) {
  if (_debug)
    creature.say("wanna split");
};

const ACTION_EAT_CREATURE = function (time, who, whom) {
  if (_debug)
    who.say("wanna split");
  who.eatCreature(whom);
};

const ACTION_REST = function (time, creature) {
  creature.rest(time);
};

const ACTIONS_DECIDE_MAP_REVERT = {
  ACTION_MOVE_RIGHT: 0,
  ACTION_MOVE_DOWN: 1,
  ACTION_MOVE_LEFT: 2,
  ACTION_MOVE_UP: 3,
  ACTION_EAT: 4,
  ACTION_REST: 5,
};

const ACTIONS_DECIDE_MAP = {
  0: ACTION_MOVE_RIGHT,
  1: ACTION_MOVE_DOWN,
  2: ACTION_MOVE_LEFT,
  3: ACTION_MOVE_UP,
  4: ACTION_EAT,
  5: ACTION_REST,
};

const ACTION_DECIDE_MAP_COST = {
  0: ACTION_MOVE_RIGHT,
  1: ACTION_MOVE_DOWN,
  2: ACTION_MOVE_LEFT,
  3: ACTION_MOVE_UP,
  4: ACTION_EAT,
  5: ACTION_REST,
};

const ACTIONS_INTERACT_MAP = {
  0: ACTION_EAT_CREATURE,
  1: ACTION_NONE,
};