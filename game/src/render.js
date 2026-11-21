// render.js — small canvas drawing kit shared by every scene, plus the
// found-marker and hint-ring drawing the game overlays on a finished panel.
// Everything is plain Canvas2D: no images, no fonts to load, no network.

/** Deterministic little PRNG so star fields and fireflies never change between runs. */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

export function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

export function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

export function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

export function triangle(ctx, x1, y1, x2, y2, x3, y3, fill) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function line(ctx, x1, y1, x2, y2, stroke, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Soft radial glow, the lantern-light workhorse. */
export function glow(ctx, x, y, r, colour) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, colour);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Vertical sky/water gradient wash over a band of the panel. */
export function wash(ctx, x, y, w, h, stops) {
  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  for (const [at, colour] of stops) gradient.addColorStop(at, colour);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
}

/** Four-point sparkle star, for the one bright star in a night sky. */
export function sparkle(ctx, x, y, r, colour) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
}

/** A field of small stars from a fixed seed: same sky every time. */
export function starField(ctx, seed, count, width, maxY, colour) {
  const random = seededRandom(seed);
  ctx.fillStyle = colour;
  for (let i = 0; i < count; i += 1) {
    const x = random() * width;
    const y = random() * maxY;
    const r = 0.6 + random() * 1.3;
    ctx.globalAlpha = 0.35 + random() * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * The ring drawn over a difference once it is found: a warm double circle
 * with a soft halo, identical on both panels so the eye can pair them.
 */
export function drawFoundMarker(ctx, x, y, r) {
  glow(ctx, x, y, r + 16, 'rgba(255, 179, 64, 0.35)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffb340';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

/** An expanding ring used the moment a find lands; `phase` runs 0 → 1. */
export function drawPulseRing(ctx, x, y, baseR, phase, colour) {
  const r = baseR + phase * 26;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = colour;
  ctx.globalAlpha = 1 - phase;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** The hint ring: a dashed teal circle breathing around an unfound difference. */
export function drawHintRing(ctx, x, y, r, phase) {
  const wobble = Math.sin(phase * Math.PI * 2) * 3;
  ctx.beginPath();
  ctx.arc(x, y, r + 8 + wobble, 0, Math.PI * 2);
  ctx.strokeStyle = '#3ec6b8';
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** A small red cross where a click missed, fading with `phase` 0 → 1. */
export function drawMissMark(ctx, x, y, phase) {
  const s = 9;
  ctx.globalAlpha = 1 - phase;
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x + s, y - s);
  ctx.lineTo(x - s, y + s);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Gentle dark vignette so the panel edges feel like a framed print. The
 *  gradient is built once per panel size and reused every frame — it is
 *  painted twice per frame and never changes. */
const vignetteCache = new Map();

export function vignette(ctx, width, height) {
  const key = `${width}x${height}`;
  let gradient = vignetteCache.get(key);
  if (!gradient) {
    gradient = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.42,
      width / 2, height / 2, height * 0.95,
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(4, 6, 18, 0.38)');
    vignetteCache.set(key, gradient);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
