// scenes.js — the three picture pairs of Twin Lanterns. Each scene knows how
// to draw itself twice: plain (Picture A) and with a set of difference ids
// applied (Picture B). A difference is a small, deliberate change — a colour
// swapped, a bird gone, a tail curled the other way — anchored at a point
// the game hit-tests when a player clicks.

import {
  circle, ellipse, rect, roundRect, triangle, line, glow, wash, sparkle, starField, seededRandom,
} from './render.js';

export const PANEL_WIDTH = 560;
export const PANEL_HEIGHT = 420;

/** A gull: two shallow arcs, the harbour shorthand for a bird. */
function gull(ctx, x, y, size, colour) {
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.7, x, y);
  ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.7, x + size, y);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** A shore cottage: block walls, a pitched roof, one or two windows. */
function cottage(ctx, x, baseY, w, h, wall, roof, litWindows) {
  rect(ctx, x, baseY - h, w, h, wall);
  triangle(ctx, x - 6, baseY - h, x + w + 6, baseY - h, x + w / 2, baseY - h - 22, roof);
  rect(ctx, x + w - 16, baseY - h - 14, 7, 14, roof);
  for (const [wx, wy, lit] of litWindows) {
    if (lit) glow(ctx, x + wx, baseY - h + wy, 13, 'rgba(255, 202, 106, 0.45)');
    rect(ctx, x + wx - 5, baseY - h + wy - 6, 10, 12, lit ? '#ffca6a' : '#241d38');
  }
}

/** The lighthouse, drawn as stacked trapezoid bands so the stripes taper. */
function lighthouse(ctx, applied) {
  // Rock it stands on.
  ellipse(ctx, 88, 266, 62, 17, '#232c52');
  ellipse(ctx, 70, 258, 30, 10, '#2b3663');
  // Tower bands from lamp room down to the rock.
  const bands = ['#e8e2d4', '#c8452c', '#e8e2d4', '#c8452c', '#e8e2d4'];
  const topY = 152;
  const bandH = 20;
  for (let i = 0; i < bands.length; i += 1) {
    const y0 = topY + i * bandH;
    const halfTop = 13 + i * 1.1;
    const halfBot = 13 + (i + 1) * 1.1;
    ctx.beginPath();
    ctx.moveTo(88 - halfTop, y0);
    ctx.lineTo(88 + halfTop, y0);
    ctx.lineTo(88 + halfBot, y0 + bandH);
    ctx.lineTo(88 - halfBot, y0 + bandH);
    ctx.closePath();
    ctx.fillStyle = bands[i];
    ctx.fill();
  }
  // Gallery, lamp room and roof.
  rect(ctx, 70, 146, 36, 6, '#2b3358');
  rect(ctx, 74, 126, 28, 20, '#2b3358');
  glow(ctx, 88, 136, 30, 'rgba(255, 205, 90, 0.55)');
  circle(ctx, 88, 136, 7, '#ffd97a');
  triangle(ctx, 68, 126, 108, 126, 88, 108, '#c8452c');
  // The beam sweeps out over the water — unless this difference is applied.
  if (!applied.has('beam')) {
    ctx.beginPath();
    ctx.moveTo(95, 129);
    ctx.lineTo(268, 88);
    ctx.lineTo(268, 138);
    ctx.lineTo(95, 143);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 220, 130, 0.16)';
    ctx.fill();
  }
}

/** One harbour lantern post: a pole, a cap and a warm lit lamp. */
function lanternPost(ctx, x, baseY) {
  rect(ctx, x - 2, baseY - 40, 4, 40, '#1d2338');
  glow(ctx, x, baseY - 46, 17, 'rgba(255, 190, 90, 0.5)');
  circle(ctx, x, baseY - 46, 5.5, '#ffd97a');
  triangle(ctx, x - 8, baseY - 52, x + 8, baseY - 52, x, baseY - 60, '#1d2338');
}

const harbour = {
  id: 'harbour',
  title: 'Harbour at Dusk',
  blurb: 'The fleet is in, the lamps are lit, and the lightkeeper swears nothing has changed.',
  par: 75,
  differences: [
    { id: 'moon-flip', x: 478, y: 52, r: 24, label: 'the crescent moon faces the other way' },
    { id: 'beam', x: 178, y: 114, r: 34, label: 'the lighthouse beam has gone out' },
    { id: 'gulls', x: 250, y: 66, r: 22, label: 'one of the gulls has flown off' },
    { id: 'window-light', x: 302, y: 220, r: 15, label: 'a cottage window has gone dark' },
    { id: 'sail', x: 368, y: 292, r: 24, label: 'the little boat wears a different sail' },
    { id: 'cat-tail', x: 513, y: 288, r: 18, label: "the pier cat's tail curls the other way" },
  ],
  draw(ctx, applied) {
    wash(ctx, 0, 0, PANEL_WIDTH, 252, [
      [0, '#131c42'], [0.55, '#2c3a6e'], [0.85, '#7a4a63'], [1, '#c97b4a'],
    ]);
    starField(ctx, 11, 70, PANEL_WIDTH, 130, '#e8ecff');

    // Crescent moon; the difference flips which way it opens.
    glow(ctx, 478, 52, 40, 'rgba(246, 234, 208, 0.35)');
    circle(ctx, 478, 52, 17, '#f6ead0');
    circle(ctx, 478 + (applied.has('moon-flip') ? -9 : 9), 46, 14, '#232f5e');

    // Gulls — three in Picture A, two once 'gulls' is applied.
    gull(ctx, 215, 78, 11, '#dfe6ff');
    if (!applied.has('gulls')) gull(ctx, 250, 64, 12, '#dfe6ff');
    gull(ctx, 284, 82, 10, '#dfe6ff');

    // A low headland closing the right of the bay.
    ctx.beginPath();
    ctx.moveTo(330, 252);
    ctx.quadraticCurveTo(430, 216, 560, 238);
    ctx.lineTo(560, 252);
    ctx.closePath();
    ctx.fillStyle = '#1b2447';
    ctx.fill();

    // The sea.
    wash(ctx, 0, 252, PANEL_WIDTH, 168, [
      [0, '#3a4a7d'], [0.25, '#2c3a68'], [1, '#141d3d'],
    ]);
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#aebdf5';
    ctx.lineWidth = 1.4;
    for (const [x, y, len] of [[120, 300, 44], [240, 344, 60], [420, 316, 52], [70, 372, 70], [330, 386, 64], [480, 366, 46]]) {
      line(ctx, x, y, x + len, y, '#aebdf5', 1.4);
    }
    ctx.globalAlpha = 1;
    // Moonlight and lamplight trembling on the water.
    for (let i = 0; i < 6; i += 1) {
      ctx.globalAlpha = 0.35 - i * 0.045;
      line(ctx, 462 + (i % 2) * 9, 262 + i * 15, 496 - (i % 2) * 7, 262 + i * 15, '#f6ead0', 2.4);
    }
    ctx.globalAlpha = 1;

    lighthouse(ctx, applied);

    // Cottages along the shore, windows warm.
    cottage(ctx, 176, 252, 64, 44, '#4a3a5e', '#2c2140', [[16, 20, true], [44, 20, false]]);
    cottage(ctx, 256, 252, 72, 52, '#54455f', '#33264a', [[14, 22, true], [46, 22, !applied.has('window-light')]]);
    cottage(ctx, 344, 252, 58, 40, '#463a58', '#2a2044', [[16, 18, true], [40, 18, true]]);
    // Chimney smoke, the same lazy curls in both pictures.
    ctx.strokeStyle = 'rgba(200, 205, 225, 0.5)';
    ctx.lineWidth = 3;
    for (const sx of [218, 312]) {
      ctx.beginPath();
      ctx.moveTo(sx, 196);
      ctx.quadraticCurveTo(sx + 8, 182, sx + 2, 170);
      ctx.quadraticCurveTo(sx - 3, 160, sx + 6, 150);
      ctx.stroke();
    }

    lanternPost(ctx, 336, 254);
    lanternPost(ctx, 470, 254);

    // The pier, reaching into the harbour from the right.
    rect(ctx, 296, 296, 230, 9, '#4a3423');
    ctx.strokeStyle = '#38261a';
    ctx.lineWidth = 1.2;
    for (let x = 312; x < 524; x += 24) line(ctx, x, 296, x, 305, '#38261a', 1.2);
    for (let x = 306; x < 526; x += 40) rect(ctx, x, 305, 6, 30, '#3a281a');

    // The pier cat, sitting on the last post, tail giving the difference away.
    const cat = '#161c30';
    ellipse(ctx, 505, 290, 11, 8, cat);
    circle(ctx, 497, 281, 6.5, cat);
    triangle(ctx, 492, 279, 495, 271, 498, 278, cat);
    triangle(ctx, 499, 278, 503, 271, 504, 279, cat);
    ctx.beginPath();
    if (applied.has('cat-tail')) {
      ctx.moveTo(514, 294);
      ctx.quadraticCurveTo(522, 300, 520, 310);
    } else {
      ctx.moveTo(514, 292);
      ctx.quadraticCurveTo(524, 288, 522, 274);
    }
    ctx.strokeStyle = cat;
    ctx.lineWidth = 3.4;
    ctx.stroke();

    // The little sailing boat; its sail changes colour with 'sail'.
    line(ctx, 356, 262, 356, 320, '#2c1e12', 3);
    triangle(ctx, 359, 266, 359, 316, 394, 316, applied.has('sail') ? '#c8452c' : '#f2e6c8');
    triangle(ctx, 353, 274, 353, 316, 330, 316, '#e3d5ae');
    ctx.beginPath();
    ctx.moveTo(322, 320);
    ctx.lineTo(402, 320);
    ctx.lineTo(390, 336);
    ctx.lineTo(334, 336);
    ctx.closePath();
    ctx.fillStyle = '#6e3b26';
    ctx.fill();

    // A rowboat resting at the left, oar shipped, identical in both.
    ctx.beginPath();
    ctx.moveTo(120, 352);
    ctx.lineTo(196, 352);
    ctx.lineTo(184, 366);
    ctx.lineTo(132, 366);
    ctx.closePath();
    ctx.fillStyle = '#54382a';
    ctx.fill();
    line(ctx, 150, 350, 178, 334, '#8a6a4a', 3);
  },
};

/** The owl, perched and watching; its eyes open or shut by 'owl-eyes'. */
function owl(ctx, applied) {
  line(ctx, 96, 158, 214, 146, '#3a2a1a', 9);
  ellipse(ctx, 150, 168, 16, 20, '#6b5138');
  ellipse(ctx, 150, 174, 9.5, 12, '#a5855e');
  circle(ctx, 150, 146, 13.5, '#7d5f40');
  triangle(ctx, 139, 140, 142, 130, 147, 139, '#7d5f40');
  triangle(ctx, 153, 139, 158, 130, 161, 140, '#7d5f40');
  if (applied.has('owl-eyes')) {
    // Eyes shut: two calm curves, an owl pretending not to watch.
    ctx.strokeStyle = '#2c1e12';
    ctx.lineWidth = 2;
    for (const ex of [144, 156]) {
      ctx.beginPath();
      ctx.arc(ex, 144, 3.6, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  } else {
    circle(ctx, 144, 145, 3.6, '#ffb340');
    circle(ctx, 156, 145, 3.6, '#ffb340');
    circle(ctx, 144, 145, 1.6, '#14100a');
    circle(ctx, 156, 145, 1.6, '#14100a');
  }
  triangle(ctx, 147, 150, 153, 150, 150, 155, '#e07f1f');
}

/** A paper lantern hanging from the string: a ribbed oval with a cap. */
function paperLantern(ctx, x, y, colour) {
  glow(ctx, x, y, 20, 'rgba(255, 190, 90, 0.30)');
  ellipse(ctx, x, y, 10, 12, colour);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.lineWidth = 1;
  for (const off of [-5, 0, 5]) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(off) + 3.5, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  rect(ctx, x - 4, y - 15, 8, 4, '#2c1e12');
  rect(ctx, x - 4, y + 11, 8, 4, '#2c1e12');
}

const owlwood = {
  id: 'owlwood',
  title: 'The Owlwood',
  blurb: 'A clearing in the old wood, where the owl keeps the night watch and misses nothing.',
  par: 95,
  differences: [
    { id: 'sparkle', x: 64, y: 50, r: 20, label: 'the brightest star has winked out' },
    { id: 'owl-eyes', x: 150, y: 146, r: 19, label: "the owl's eyes have closed" },
    { id: 'lantern', x: 329, y: 140, r: 18, label: 'the middle lantern burns a different colour' },
    { id: 'firefly', x: 430, y: 182, r: 20, label: 'one firefly has gone dark' },
    { id: 'fox-ear', x: 439, y: 267, r: 16, label: "the fox's ear has lost its pale tip" },
    { id: 'mushroom', x: 92, y: 348, r: 18, label: 'the big mushroom has lost its spots' },
    { id: 'moss', x: 215, y: 366, r: 18, label: 'the moss on the fallen log has withered' },
  ],
  draw(ctx, applied) {
    wash(ctx, 0, 0, PANEL_WIDTH, PANEL_HEIGHT, [
      [0, '#0d1f22'], [0.55, '#14332c'], [0.78, '#1d4636'], [1, '#12291d'],
    ]);
    starField(ctx, 23, 55, PANEL_WIDTH, 110, '#dff5e6');

    // The clearing: a pool of softer green in the middle of the wood.
    ellipse(ctx, 282, 356, 216, 60, '#1d4230');
    ellipse(ctx, 282, 356, 150, 40, '#235239');

    // Background trees, a dark colonnade at the edges.
    for (const [x, w] of [[16, 20], [52, 14], [452, 16], [492, 22], [528, 15]]) {
      rect(ctx, x, 60, w, 300, '#0e2018');
      circle(ctx, x + w / 2, 58, w * 1.5, '#0e2018');
    }

    // Moon and the one bright star, painted after the treetops so the
    // colonnade never swallows them.
    if (!applied.has('sparkle')) sparkle(ctx, 64, 50, 9, '#ffe9b0');
    glow(ctx, 492, 46, 26, 'rgba(246, 234, 208, 0.30)');
    circle(ctx, 492, 46, 13, '#f6ead0');
    circle(ctx, 487, 42, 3, '#ddd0ae');
    circle(ctx, 497, 51, 2.2, '#ddd0ae');

    // The great oak.
    ctx.beginPath();
    ctx.moveTo(112, 420);
    ctx.quadraticCurveTo(120, 320, 124, 250);
    ctx.quadraticCurveTo(126, 200, 118, 168);
    ctx.lineTo(148, 168);
    ctx.quadraticCurveTo(142, 240, 146, 320);
    ctx.quadraticCurveTo(150, 380, 158, 420);
    ctx.closePath();
    ctx.fillStyle = '#4a3826';
    ctx.fill();
    line(ctx, 138, 168, 74, 128, '#4a3826', 11);
    line(ctx, 142, 162, 216, 128, '#4a3826', 10);
    // The hollow, with something small and warm asleep inside.
    ellipse(ctx, 133, 300, 12, 17, '#0a140d');
    glow(ctx, 133, 302, 10, 'rgba(255, 179, 64, 0.5)');
    circle(ctx, 133, 302, 3, '#ffb340');
    // Canopy: overlapping crowns of deep green.
    for (const [x, y, r, c] of [
      [86, 108, 42, '#173d2a'], [140, 84, 48, '#1d4a33'], [196, 106, 40, '#173d2a'],
      [110, 130, 36, '#265c40'], [168, 128, 34, '#1d4a33'], [52, 140, 28, '#265c40'],
      [224, 138, 26, '#265c40'],
    ]) circle(ctx, x, y, r, c);

    owl(ctx, applied);

    // A string of paper lanterns sagging between two trees.
    ctx.beginPath();
    ctx.moveTo(228, 118);
    ctx.quadraticCurveTo(330, 152, 432, 94);
    ctx.strokeStyle = '#0c1712';
    ctx.lineWidth = 2;
    ctx.stroke();
    paperLantern(ctx, 267, 140, '#e77a9b');
    paperLantern(ctx, 329, 148, applied.has('lantern') ? '#3ec6b8' : '#ffb340');
    paperLantern(ctx, 392, 130, '#e77a9b');

    // Fireflies over the clearing, from a fixed seed — plus one bright
    // wanderer by the right-hand trees that 'firefly' takes away.
    const random = seededRandom(47);
    for (let i = 0; i < 13; i += 1) {
      const x = 200 + random() * 300;
      const y = 210 + random() * 130;
      glow(ctx, x, y, 8, 'rgba(190, 255, 150, 0.35)');
      circle(ctx, x, y, 1.8, '#d8ffa8');
    }
    if (!applied.has('firefly')) {
      glow(ctx, 430, 182, 15, 'rgba(190, 255, 150, 0.55)');
      circle(ctx, 430, 182, 2.8, '#eaffc4');
    }

    // The fallen log, mossy or bare along its top.
    ctx.save();
    ctx.translate(240, 378);
    ctx.rotate(0.045);
    roundRect(ctx, -62, -11, 124, 22, 10, '#4a3826');
    circle(ctx, 62, 0, 10, '#8a6a4a');
    circle(ctx, 62, 0, 6, '#a5855e');
    circle(ctx, 62, 0, 2.6, '#8a6a4a');
    if (!applied.has('moss')) {
      ellipse(ctx, -25, -11, 22, 6, '#3f7a44');
      ellipse(ctx, 8, -12, 15, 5, '#4c8a50');
    }
    ctx.restore();

    // Mushrooms at the oak's foot; the big one's cap is the difference.
    for (const [x, y, s, cap] of [[70, 366, 0.8, '#8a6a4a'], [118, 374, 0.65, '#c8452c'], [66, 382, 0.55, '#8a6a4a']]) {
      rect(ctx, x - 3 * s, y - 10 * s, 6 * s, 10 * s, '#e8dcc2');
      ctx.beginPath();
      ctx.arc(x, y - 9 * s, 11 * s, Math.PI, 0);
      ctx.fillStyle = cap;
      ctx.fill();
    }
    rect(ctx, 88, 352, 8, 16, '#e8dcc2');
    ctx.beginPath();
    ctx.arc(92, 353, 17, Math.PI, 0);
    ctx.fillStyle = applied.has('mushroom') ? '#8a6a4a' : '#c8452c';
    ctx.fill();
    if (!applied.has('mushroom')) {
      for (const [dx, dy] of [[-8, -8], [2, -12], [9, -5], [-2, -4]]) circle(ctx, 92 + dx, 353 + dy, 2.2, '#f3e9d2');
    }

    // The fox, sitting politely at the clearing's edge.
    const foxOrange = '#b45a28';
    ellipse(ctx, 470, 336, 30, 16, foxOrange);
    ellipse(ctx, 452, 316, 20, 25, foxOrange);
    ellipse(ctx, 452, 322, 10, 14, '#e8c39a');
    circle(ctx, 452, 284, 14.5, foxOrange);
    triangle(ctx, 439, 276, 441, 260, 450, 272, foxOrange);
    triangle(ctx, 454, 272, 463, 260, 465, 276, foxOrange);
    if (!applied.has('fox-ear')) triangle(ctx, 441.5, 268, 443, 261.5, 447.5, 268.5, '#f3e9d2');
    circle(ctx, 447, 284, 2.2, '#14100a');
    circle(ctx, 457, 284, 2.2, '#14100a');
    ellipse(ctx, 452, 292, 3.4, 2.6, '#14100a');
    line(ctx, 436, 306, 430, 322, '#8a6a4a', 3);

    // Grass tufts and stones to finish the clearing floor.
    ctx.strokeStyle = '#2c5c3e';
    ctx.lineWidth = 2;
    const tuftRandom = seededRandom(7);
    for (let i = 0; i < 26; i += 1) {
      const x = 20 + tuftRandom() * 520;
      const y = 372 + tuftRandom() * 42;
      line(ctx, x, y, x - 3, y - 8, '#2c5c3e', 2);
      line(ctx, x + 3, y, x + 4, y - 9, '#2c5c3e', 2);
    }
    ellipse(ctx, 330, 398, 13, 6, '#3d4a42');
    ellipse(ctx, 356, 404, 9, 5, '#46544b');
    ellipse(ctx, 180, 402, 10, 5, '#3d4a42');
  },
};

/** One stall: posts, a striped awning, a counter and its shadow. */
function stall(ctx, x, w, awningColours) {
  rect(ctx, x + 6, 176, 7, 128, '#3a2a1a');
  rect(ctx, x + w - 13, 176, 7, 128, '#3a2a1a');
  // Awning: a shallow pitched canopy of stripes sloping toward the lane.
  const stripeW = w / 8;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    const sx = x - 8 + i * stripeW;
    ctx.moveTo(sx, 168);
    ctx.lineTo(sx + stripeW, 168);
    ctx.lineTo(sx + stripeW - 4, 196);
    ctx.lineTo(sx - 4, 196);
    ctx.closePath();
    ctx.fillStyle = awningColours[i % awningColours.length];
    ctx.fill();
  }
  rect(ctx, x - 8, 162, w + 16, 7, '#2c1e12');
  // Counter and the goods shelf beneath it.
  rect(ctx, x, 252, w, 12, '#5a4028');
  rect(ctx, x + 4, 264, w - 8, 40, '#43301e');
}

/** A glass jar with something colourful preserved inside. */
function jar(ctx, x, y, contents) {
  roundRect(ctx, x - 11, y - 26, 22, 30, 5, 'rgba(190, 220, 215, 0.5)');
  rect(ctx, x - 8, y - 14, 16, 15, contents);
  rect(ctx, x - 12, y - 30, 24, 6, '#8a6a4a');
}

/** A pumpkin, ribbed and round; a carved face only when `carved`. */
function pumpkin(ctx, x, y, r, carved) {
  ellipse(ctx, x, y, r, r * 0.82, '#d97c26');
  ctx.strokeStyle = 'rgba(120, 55, 10, 0.55)';
  ctx.lineWidth = 1.6;
  for (const off of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.ellipse(x, y, r * Math.abs(off) + 3, r * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  rect(ctx, x - 2.5, y - r * 0.82 - 5, 5, 7, '#4c6a2e');
  if (carved) {
    triangle(ctx, x - r * 0.42, y - r * 0.2, x - r * 0.14, y - r * 0.2, x - r * 0.28, y + r * 0.02, '#2c1a08');
    triangle(ctx, x + r * 0.14, y - r * 0.2, x + r * 0.42, y - r * 0.2, x + r * 0.28, y + r * 0.02, '#2c1a08');
    ctx.beginPath();
    ctx.arc(x, y + r * 0.18, r * 0.42, Math.PI * 0.15, Math.PI * 0.85);
    ctx.lineTo(x + r * 0.2, y + r * 0.3);
    ctx.lineTo(x + r * 0.05, y + r * 0.16);
    ctx.lineTo(x - r * 0.08, y + r * 0.32);
    ctx.lineTo(x - r * 0.2, y + r * 0.14);
    ctx.closePath();
    ctx.fillStyle = '#2c1a08';
    ctx.fill();
    glow(ctx, x, y + 2, r * 0.9, 'rgba(255, 170, 60, 0.25)');
  }
}

const market = {
  id: 'market',
  title: 'Night Market Lane',
  blurb: 'Lanterns, pumpkins and preserved everything — the lane rearranges itself when nobody looks.',
  par: 120,
  differences: [
    { id: 'cloud', x: 66, y: 50, r: 24, label: 'a cloud has drifted over the moon' },
    { id: 'sign', x: 300, y: 118, r: 24, label: 'the hanging sign has changed its mind' },
    { id: 'bulb', x: 330, y: 76, r: 15, label: 'one string light has gone out' },
    { id: 'awning', x: 125, y: 160, r: 28, label: "the left stall's awning has new stripes" },
    { id: 'fan', x: 252, y: 202, r: 18, label: 'the paper fan has changed its colour' },
    { id: 'jars', x: 128, y: 246, r: 20, label: 'a jar has vanished from the counter' },
    { id: 'collar', x: 380, y: 316, r: 16, label: "the dog's collar has gone missing" },
    { id: 'pumpkin', x: 478, y: 300, r: 22, label: "the big pumpkin's grin has vanished" },
  ],
  draw(ctx, applied) {
    wash(ctx, 0, 0, PANEL_WIDTH, PANEL_HEIGHT, [
      [0, '#191636'], [0.55, '#33254f'], [0.75, '#5c3560'], [0.76, '#2c2140'], [1, '#241a36'],
    ]);
    starField(ctx, 31, 46, PANEL_WIDTH, 100, '#e6dcff');

    // The moon, and — once 'cloud' is applied — the cloud that swallows it.
    glow(ctx, 66, 50, 30, 'rgba(246, 234, 208, 0.32)');
    circle(ctx, 66, 50, 15, '#f6ead0');
    circle(ctx, 60, 45, 3.4, '#ddd0ae');
    if (applied.has('cloud')) {
      ellipse(ctx, 82, 52, 30, 13, '#241c42');
      ellipse(ctx, 58, 46, 22, 11, '#241c42');
      ellipse(ctx, 96, 44, 16, 9, '#2c2350');
    }
    // A second, innocent cloud that never moves.
    ellipse(ctx, 452, 40, 26, 10, '#241c42');
    ellipse(ctx, 430, 34, 17, 8, '#241c42');

    // Two swags of string lights across the lane; one bulb is the difference.
    const swags = [
      { from: [6, 78], ctrl: [150, 118], to: [296, 66] },
      { from: [296, 66], ctrl: [420, 112], to: [554, 84] },
    ];
    for (const swag of swags) {
      ctx.beginPath();
      ctx.moveTo(...swag.from);
      ctx.quadraticCurveTo(...swag.ctrl, ...swag.to);
      ctx.strokeStyle = '#120e26';
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 1; i <= 7; i += 1) {
        const t = i / 8;
        const x = (1 - t) * (1 - t) * swag.from[0] + 2 * (1 - t) * t * swag.ctrl[0] + t * t * swag.to[0];
        const y = (1 - t) * (1 - t) * swag.from[1] + 2 * (1 - t) * t * swag.ctrl[1] + t * t * swag.to[1];
        const isDiffBulb = Math.abs(x - 330) < 9;
        const lit = !(isDiffBulb && applied.has('bulb'));
        if (lit) glow(ctx, x, y + 7, 11, 'rgba(255, 205, 110, 0.5)');
        circle(ctx, x, y + 7, 4, lit ? '#ffd97a' : '#3a3358');
      }
    }

    // The lane's cobbles.
    ctx.strokeStyle = 'rgba(190, 170, 220, 0.16)';
    ctx.lineWidth = 1.4;
    for (const [x, y, rx] of [[70, 336, 26], [150, 356, 30], [250, 340, 24], [330, 362, 32], [440, 344, 26], [120, 386, 34], [290, 392, 30], [470, 384, 30]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Left stall: preserves and pickles under a striped awning.
    stall(ctx, 46, 168, applied.has('awning') ? ['#3a5a9e', '#f3e9d2'] : ['#c8452c', '#f3e9d2']);
    jar(ctx, 92, 252, '#c8452c');
    if (!applied.has('jars')) jar(ctx, 128, 252, '#e0a51f');
    jar(ctx, 164, 252, '#57b06a');
    pumpkin(ctx, 66, 322, 15, false);
    pumpkin(ctx, 96, 330, 11, false);
    rect(ctx, 150, 286, 44, 26, '#5a4028');
    rect(ctx, 150, 286, 44, 6, '#6e5136');

    // The hanging sign between the stalls: a round board on two chains.
    line(ctx, 282, 78, 292, 96, '#120e26', 2);
    line(ctx, 318, 78, 308, 96, '#120e26', 2);
    circle(ctx, 300, 118, 23, '#3a2a1a');
    ctx.beginPath();
    ctx.arc(300, 118, 23, 0, Math.PI * 2);
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(applied.has('sign') ? 'EAT' : 'TEA', 300, 119);

    // A paper fan pinned to the sign post, pink or green.
    line(ctx, 252, 168, 252, 240, '#3a2a1a', 5);
    ctx.beginPath();
    ctx.moveTo(252, 216);
    ctx.arc(252, 216, 21, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = applied.has('fan') ? '#57b06a' : '#e77a9b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 20, 40, 0.5)';
    ctx.lineWidth = 1.2;
    for (const a of [0.15, 0.38, 0.62, 0.85]) {
      const ang = Math.PI + a * Math.PI;
      line(ctx, 252, 216, 252 + Math.cos(ang) * 21, 216 + Math.sin(ang) * 21, 'rgba(60, 20, 40, 0.5)', 1.2);
    }

    // Right stall: the pumpkin seller, awning teal in both pictures.
    stall(ctx, 356, 168, ['#2e7f76', '#f3e9d2']);
    pumpkin(ctx, 392, 244, 14, false);
    pumpkin(ctx, 424, 248, 11, false);
    pumpkin(ctx, 478, 300, 24, !applied.has('pumpkin'));
    pumpkin(ctx, 516, 312, 15, false);
    pumpkin(ctx, 440, 318, 13, false);
    rect(ctx, 470, 282, 40, 24, '#5a4028');

    // The stallholder's dog, asleep under the counter — collar or none.
    const dog = '#8a6a4a';
    ellipse(ctx, 396, 330, 24, 11, dog);
    circle(ctx, 376, 322, 10, dog);
    triangle(ctx, 370, 316, 374, 306, 379, 315, '#6e5136');
    ellipse(ctx, 372, 324, 4, 2.4, '#2c1e12');
    if (!applied.has('collar')) {
      ctx.beginPath();
      ctx.arc(382, 320, 8.5, Math.PI * 0.4, Math.PI * 1.25);
      ctx.strokeStyle = '#c8452c';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    line(ctx, 418, 328, 430, 320, dog, 4);

    // Bunting strung under the right awning, the same in both pictures.
    ctx.beginPath();
    ctx.moveTo(356, 204);
    ctx.quadraticCurveTo(440, 224, 524, 204);
    ctx.strokeStyle = '#120e26';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    const flagColours = ['#c8452c', '#ffb340', '#3ec6b8', '#e77a9b'];
    for (let i = 0; i < 6; i += 1) {
      const t = (i + 0.5) / 6;
      const x = (1 - t) * (1 - t) * 356 + 2 * (1 - t) * t * 440 + t * t * 524;
      const y = (1 - t) * (1 - t) * 204 + 2 * (1 - t) * t * 224 + t * t * 204;
      triangle(ctx, x - 7, y, x + 7, y, x, y + 13, flagColours[i % flagColours.length]);
    }
  },
};

export const SCENES = [harbour, owlwood, market];
