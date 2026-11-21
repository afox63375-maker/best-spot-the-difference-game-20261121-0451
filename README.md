[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/afox63375-maker/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/afox63375-maker/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Twin Lanterns — Spot the Difference

An original spot-the-difference game that runs from static files in a desktop browser — no build step, no network, nothing to install. Two near-identical night pictures stand side by side; a handful of quiet changes hide in the second one. Click a change in either picture to ring it on both.

## The rounds

Three hand-drawn canvas scenes, each with its own set of changes to hunt:

1. **Harbour at Dusk** — 6 differences around the lighthouse, the cottages and the pier cat.
2. **The Owlwood** — 7 differences in a forest clearing, under the owl's watch.
3. **Night Market Lane** — 8 differences among the stalls, string lights and pumpkins.

The changes mix kinds: a colour swapped, a bird gone, a sign that changed its mind, a grin that vanished. Later rounds hide more, and smaller.

## How it plays

- **Click** a difference in either picture. A find rings it on both panels with a pulse and a soft chime, and the "Still hiding" counter ticks down.
- **A miss costs +4 seconds** and shakes the panel; clicking an already-ringed difference costs nothing.
- **Hints (H):** three per round. A hint breathes a teal ring around one unfound difference for a few seconds and costs +10 seconds.
- **The clock** runs from the round's first moment; beating the round's par time earns three stars, with two and one for slower finishes.
- **Keys:** H hint, R restart the round, N next round, M mute. All sounds are synthesised in code with WebAudio — there are no audio files.
- Round tabs at the top let you revisit a finished scene; your stars and times are kept.

## Files

- `main.ts` — the hand-in program (Node 22, standard library only). It copies `game/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored library.
- `vendor/makefun-game.ts` — the make.fun dossier library, the kit's copy, unchanged.
- `game/index.html` — the page: masthead, status chips, round tabs, the two panels, controls.
- `game/style.css` — the page's harbour-night styling.
- `game/src/scenes.js` — the three scenes; each draws itself plain or with its differences applied, and lists every difference's anchor and name.
- `game/src/render.js` — the shared canvas drawing kit: shapes, glows, star fields, found markers, hint rings.
- `game/src/game.js` — the controller: rounds, clicks, the clock, penalties, hints, sounds, the results card.
- `game/src/shots.js` — the frozen mid-game states behind `?shot=<name>`, used to take the screenshots honestly from the game's own rendering.
- `screenshots/` — four real renders of the game in headless Chromium (1280×800 JPEGs): a round under way, a hint in play, the last round deep in, and the results card. `shots.json` maps each file to its state.
- `LICENSE` — MIT.

## Running it

Serve `game/` with any static file server and open `index.html` in a desktop browser, or run the hand-in and open the copy:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How it was verified

- **Played end to end in headless Chromium** by a scripted driver clicking through the game's own interface: finds register on both panels, a miss banks its +4 seconds, re-clicking a ringed difference is a free no-op, the hint button spends a hint and rings the moon, and finding all six harbour differences raises the results card and unlocks round two. 17 of 17 checks pass.
- **Deterministic hand-in:** two runs of `node main.ts` into separate output directories produce byte-identical trees (`diff -r` clean), dossier included.
- **Screenshots** are the game's own pages rendered by Chromium at the states in `shots.json`, re-encoded to JPEG without any edit to the picture; each is 1280×800 and under the 256 KiB cap.
- One bug the screenshots caught and the driver confirmed: a missing import once stopped the Owlwood mid-draw, and clicking an already-found difference briefly counted as a miss. Both are fixed above.
