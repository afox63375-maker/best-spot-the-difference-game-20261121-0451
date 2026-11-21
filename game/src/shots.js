// shots.js — the frozen mid-game states behind ?shot=<name>, used by the
// maker to take the entry's screenshots. Each state is an honest snapshot
// of real play: a round part-way through, some differences already ringed,
// the counter showing how many still hide, the clock stopped where it was.
// The game renders these states with exactly the code a player sees.

export const SHOT_STATES = {
  // The cover: round one under way, two found, four still hiding.
  cover: {
    scene: 0,
    found: ['window-light', 'sail'],
    elapsed: 47,
    hintsLeft: 3,
    mistakes: 1,
    hintTarget: null,
    complete: false,
  },
  // Round two: three found, one hint spent and its ring still showing.
  owlwood: {
    scene: 1,
    found: ['owl-eyes', 'lantern', 'mushroom'],
    elapsed: 83,
    hintsLeft: 2,
    mistakes: 0,
    hintTarget: 'firefly',
    complete: false,
  },
  // Round three, deep in: five of eight found, three to go.
  market: {
    scene: 2,
    found: ['awning', 'jars', 'sign', 'bulb', 'pumpkin'],
    elapsed: 121,
    hintsLeft: 2,
    mistakes: 2,
    hintTarget: null,
    complete: false,
  },
  // The last find of the night: round three complete, results card up.
  complete: {
    scene: 2,
    found: ['cloud', 'sign', 'bulb', 'awning', 'fan', 'jars', 'collar', 'pumpkin'],
    elapsed: 148,
    hintsLeft: 2,
    mistakes: 2,
    hintTarget: null,
    complete: true,
  },
};
