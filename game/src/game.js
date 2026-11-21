// game.js — Twin Lanterns' controller: rounds, clicks, the clock, hints,
// sounds and the results card. The pictures themselves live in scenes.js;
// this file owns everything that changes while you play.

import { SCENES, PANEL_WIDTH, PANEL_HEIGHT } from './scenes.js';
import {
  drawFoundMarker, drawPulseRing, drawHintRing, drawMissMark, vignette,
} from './render.js';
import { SHOT_STATES } from './shots.js';

const MISS_PENALTY_SECONDS = 4;
const HINT_PENALTY_SECONDS = 10;
const HINTS_PER_ROUND = 3;

const leftCanvas = document.getElementById('panel-left');
const rightCanvas = document.getElementById('panel-right');
const leftCtx = leftCanvas.getContext('2d');
const rightCtx = rightCanvas.getContext('2d');

const hudRemaining = document.getElementById('hud-remaining');
const hudFound = document.getElementById('hud-found');
const hudTimer = document.getElementById('hud-timer');
const hudTimerChip = document.getElementById('hud-timer-chip');
const hudHints = document.getElementById('hud-hints');
const roundTitle = document.getElementById('round-title');
const roundTabs = document.getElementById('round-tabs');
const message = document.getElementById('message');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayStars = document.getElementById('overlay-stars');
const overlayNext = document.getElementById('overlay-next');
const overlayReplay = document.getElementById('overlay-replay');
const btnHint = document.getElementById('btn-hint');
const btnRestart = document.getElementById('btn-restart');
const btnSound = document.getElementById('btn-sound');

const query = new URLSearchParams(window.location.search);
const shotName = query.get('shot');
const shotMode = shotName !== null && Object.hasOwn(SHOT_STATES, shotName);

const state = {
  sceneIndex: 0,
  found: new Set(),
  mistakes: 0,
  hintsLeft: HINTS_PER_ROUND,
  elapsedBase: 0,
  startedAt: null,
  complete: false,
  hintTarget: null,
  hintUntil: 0,
  pulses: [],
  misses: [],
  soundOn: true,
  finishedRounds: new Map(),
};

function scene() {
  return SCENES[state.sceneIndex];
}

function allDifferenceIds() {
  return new Set(scene().differences.map((d) => d.id));
}

function elapsedSeconds(now) {
  if (shotMode) return state.elapsedBase;
  if (state.startedAt === null) return state.elapsedBase;
  return state.elapsedBase + (now - state.startedAt) / 1000;
}

function formatTime(totalSeconds) {
  const whole = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function starsFor(finishedScene, seconds) {
  if (seconds <= finishedScene.par) return 3;
  if (seconds <= finishedScene.par * 1.6) return 2;
  return 1;
}

// --- Sound: small WebAudio voices, made in code, no audio files. ---

let audioCtx = null;

function tone(freqFrom, freqTo, seconds, type, gainPeak, delay = 0) {
  if (!state.soundOn) return;
  try {
    audioCtx = audioCtx ?? new (window.AudioContext || window.webkitAudioContext)();
    const start = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  } catch {
    // A browser that refuses audio simply stays silent.
  }
}

const soundFind = () => { tone(620, 980, 0.14, 'sine', 0.16); tone(930, 1320, 0.16, 'sine', 0.1, 0.05); };
const soundMiss = () => tone(190, 120, 0.16, 'square', 0.05);
const soundHint = () => { tone(1180, 1180, 0.1, 'triangle', 0.07); tone(1560, 1560, 0.12, 'triangle', 0.06, 0.09); };
const soundWin = () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.22, 'sine', 0.11, i * 0.09)); };

// --- Rendering ---

function drawPanel(ctx, applied) {
  const current = scene();
  ctx.clearRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT);
  current.draw(ctx, applied);
  const now = performance.now();
  for (const diff of current.differences) {
    if (state.found.has(diff.id)) drawFoundMarker(ctx, diff.x, diff.y, diff.r);
  }
  if (state.hintTarget !== null) {
    const target = current.differences.find((d) => d.id === state.hintTarget);
    if (target) {
      const phase = shotMode ? 0.3 : (now % 1600) / 1600;
      drawHintRing(ctx, target.x, target.y, target.r, phase);
    }
  }
  for (const pulse of state.pulses) {
    drawPulseRing(ctx, pulse.x, pulse.y, pulse.r, pulse.phase, 'rgba(255, 179, 64, 0.9)');
  }
  for (const miss of state.misses) {
    drawMissMark(ctx, miss.x, miss.y, miss.phase);
  }
  vignette(ctx, PANEL_WIDTH, PANEL_HEIGHT);
}

function render(now) {
  drawPanel(leftCtx, new Set());
  drawPanel(rightCtx, allDifferenceIds());
  const current = scene();
  const remaining = current.differences.length - state.found.size;
  hudRemaining.textContent = String(remaining);
  hudFound.textContent = `${state.found.size} of ${current.differences.length}`;
  hudTimer.textContent = formatTime(elapsedSeconds(now));
  hudTimerChip.classList.toggle('over-par', elapsedSeconds(now) > current.par && !state.complete);
  hudHints.textContent = String(state.hintsLeft);
  btnHint.disabled = state.hintsLeft <= 0 || remaining === 0 || state.complete;
}

function frame(now) {
  // Advance the short-lived click effects, then paint.
  for (const pulse of state.pulses) pulse.phase = (now - pulse.at) / 550;
  state.pulses = state.pulses.filter((p) => p.phase < 1);
  for (const miss of state.misses) miss.phase = (now - miss.at) / 700;
  state.misses = state.misses.filter((m) => m.phase < 1);
  if (state.hintTarget !== null && !shotMode && now > state.hintUntil) state.hintTarget = null;
  render(now);
  requestAnimationFrame(frame);
}

// --- Round flow ---

function buildTabs() {
  roundTabs.innerHTML = '';
  SCENES.forEach((entry, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'round-tab';
    tab.textContent = `Round ${index + 1}`;
    if (index === state.sceneIndex) tab.classList.add('active');
    if (state.finishedRounds.has(index)) tab.classList.add('done');
    tab.addEventListener('click', () => startRound(index));
    roundTabs.appendChild(tab);
  });
}

function startRound(index) {
  state.sceneIndex = index;
  state.found = new Set();
  state.mistakes = 0;
  state.hintsLeft = HINTS_PER_ROUND;
  state.elapsedBase = 0;
  state.startedAt = shotMode ? null : performance.now();
  state.complete = false;
  state.hintTarget = null;
  state.pulses = [];
  state.misses = [];
  overlay.hidden = true;
  roundTitle.textContent = `Round ${index + 1} — ${scene().title}`;
  say(scene().blurb, '');
  buildTabs();
}

function say(text, kind) {
  message.textContent = text;
  message.className = `message ${kind}`;
}

function completeRound(now) {
  state.complete = true;
  const seconds = elapsedSeconds(now);
  state.elapsedBase = seconds;
  state.startedAt = null;
  const finishedScene = scene();
  const stars = starsFor(finishedScene, seconds);
  state.finishedRounds.set(state.sceneIndex, { seconds, stars });
  soundWin();
  const isLast = state.sceneIndex === SCENES.length - 1;
  overlayTitle.textContent = isLast ? 'The whole night, spotted' : `${finishedScene.title} — complete`;
  overlayStars.innerHTML = [1, 2, 3]
    .map((n) => `<span class="${n <= stars ? '' : 'dim'}">★</span>`)
    .join('');
  let text = `All ${finishedScene.differences.length} differences found in ${formatTime(seconds)}`
    + ` with ${state.mistakes} miss${state.mistakes === 1 ? '' : 'es'}`
    + ` and ${HINTS_PER_ROUND - state.hintsLeft} hint${state.hintsLeft === HINTS_PER_ROUND - 1 ? '' : 's'} used.`;
  if (isLast) {
    const totalSeconds = [...state.finishedRounds.values()].reduce((sum, r) => sum + r.seconds, 0);
    const totalStars = [...state.finishedRounds.values()].reduce((sum, r) => sum + r.stars, 0);
    text += ` Across all three rounds: ${formatTime(totalSeconds)} and ${totalStars} of 9 stars.`;
  }
  overlayText.textContent = text;
  overlayNext.textContent = isLast ? 'Play the night again' : 'Next round';
  overlay.hidden = false;
  buildTabs();
}

// --- Input ---

function panelPoint(event, canvas) {
  const rectBox = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rectBox.left) * (PANEL_WIDTH / rectBox.width),
    y: (event.clientY - rectBox.top) * (PANEL_HEIGHT / rectBox.height),
  };
}

function nearestDifference(x, y) {
  let best = null;
  let bestDistance = Infinity;
  for (const diff of scene().differences) {
    if (state.found.has(diff.id)) continue;
    const distance = Math.hypot(diff.x - x, diff.y - y);
    if (distance < bestDistance) {
      best = diff;
      bestDistance = distance;
    }
  }
  return best !== null && bestDistance <= best.r + 8 ? best : null;
}

/** The already-found difference under a click, if any: ringing it again is
 *  a no-op, never a miss — the player is right, just late. */
function foundDifferenceAt(x, y) {
  for (const diff of scene().differences) {
    if (!state.found.has(diff.id)) continue;
    if (Math.hypot(diff.x - x, diff.y - y) <= diff.r + 8) return diff;
  }
  return null;
}

function handleClick(event) {
  if (shotMode || state.complete) return;
  const now = performance.now();
  if (state.startedAt === null) state.startedAt = now;
  const { x, y } = panelPoint(event, event.currentTarget);
  const already = foundDifferenceAt(x, y);
  if (already) {
    say(`Already spotted: ${already.label}.`, '');
    return;
  }
  const hit = nearestDifference(x, y);
  if (hit) {
    state.found.add(hit.id);
    state.pulses.push({ x: hit.x, y: hit.y, r: hit.r, at: now, phase: 0 });
    if (state.hintTarget === hit.id) state.hintTarget = null;
    soundFind();
    const remaining = scene().differences.length - state.found.size;
    if (remaining === 0) {
      completeRound(now);
    } else {
      say(`Found: ${hit.label} — ${remaining} still hiding.`, 'good');
    }
  } else {
    state.mistakes += 1;
    state.elapsedBase += MISS_PENALTY_SECONDS;
    state.misses.push({ x, y, at: now, phase: 0 });
    event.currentTarget.classList.remove('shake');
    void event.currentTarget.offsetWidth;
    event.currentTarget.classList.add('shake');
    soundMiss();
    say(`Nothing there — ${MISS_PENALTY_SECONDS} seconds added.`, 'bad');
  }
}

function useHint() {
  if (shotMode || state.complete || state.hintsLeft <= 0) return;
  const next = scene().differences.find((d) => !state.found.has(d.id));
  if (!next) return;
  state.hintsLeft -= 1;
  state.elapsedBase += HINT_PENALTY_SECONDS;
  state.hintTarget = next.id;
  state.hintUntil = performance.now() + 2600;
  soundHint();
  say(`Somewhere inside the teal ring… (${HINT_PENALTY_SECONDS} seconds added)`, '');
}

leftCanvas.addEventListener('click', handleClick);
rightCanvas.addEventListener('click', handleClick);
btnHint.addEventListener('click', useHint);
btnRestart.addEventListener('click', () => startRound(state.sceneIndex));
btnSound.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  btnSound.textContent = state.soundOn ? 'Sound: on (M)' : 'Sound: off (M)';
});
overlayNext.addEventListener('click', () => {
  startRound(state.sceneIndex === SCENES.length - 1 ? 0 : state.sceneIndex + 1);
});
overlayReplay.addEventListener('click', () => startRound(state.sceneIndex));

window.addEventListener('keydown', (event) => {
  if (event.key === 'h' || event.key === 'H') useHint();
  if (event.key === 'r' || event.key === 'R') startRound(state.sceneIndex);
  if (event.key === 'm' || event.key === 'M') btnSound.click();
  if ((event.key === 'n' || event.key === 'N') && !overlay.hidden) overlayNext.click();
});

// --- Boot: a screenshot state if asked, otherwise a fresh first round. ---

if (shotMode) {
  const shot = SHOT_STATES[shotName];
  state.sceneIndex = shot.scene;
  state.found = new Set(shot.found);
  state.mistakes = shot.mistakes;
  state.hintsLeft = shot.hintsLeft;
  state.elapsedBase = shot.elapsed;
  state.hintTarget = shot.hintTarget;
  roundTitle.textContent = `Round ${shot.scene + 1} — ${scene().title}`;
  say(scene().blurb, '');
  buildTabs();
  if (shot.complete) {
    const finishedScene = scene();
    state.finishedRounds.set(0, { seconds: 63, stars: 3 });
    state.finishedRounds.set(1, { seconds: 88, stars: 3 });
    completeRound(performance.now());
    state.elapsedBase = shot.elapsed;
  }
} else {
  startRound(0);
}

// A small handle for the maker's screenshot script: it reads the state and
// can click a panel exactly where a player would.
window.__twinLanterns = {
  state,
  scenes: SCENES,
  clickAt(canvasId, x, y) {
    const canvas = document.getElementById(canvasId);
    const rectBox = canvas.getBoundingClientRect();
    const event = new MouseEvent('click', {
      clientX: rectBox.left + (x / PANEL_WIDTH) * rectBox.width,
      clientY: rectBox.top + (y / PANEL_HEIGHT) * rectBox.height,
      bubbles: true,
    });
    canvas.dispatchEvent(event);
  },
};

requestAnimationFrame(frame);
