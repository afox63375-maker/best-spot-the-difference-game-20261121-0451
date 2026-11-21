// Twin Lanterns — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a
// desktop browser and play). This program is only the courier: it copies
// game/ and screenshots/ from beside this file into the output directory
// and writes dossier.json there with buildDossier from the vendored
// make.fun library, so the grader receives the game exactly as it sits
// in the repository. Outside the grader, MAKEFUN_OUTPUT_DIR names the
// output directory:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own limits, passed to the dossier builder so an entry that
// would break them fails here, at hand-in, instead of at the scorer.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

// Fail loudly at hand-in rather than quietly at the scorer: the entry is
// worth nothing without its game, and a bare output directory would
// otherwise look like a program that ran fine.
for (const part of ['game', 'screenshots']) {
  if (!existsSync(join(root, part))) {
    throw new Error(`Twin Lanterns hand-in: ${part}/ is missing beside main.ts`);
  }
}

copyTree(join(root, 'game'), join(outputDir, 'game'));
if (existsSync(join(root, 'screenshots'))) {
  copyTree(join(root, 'screenshots'), join(outputDir, 'screenshots'));
}

const dossier = buildDossier(outputDir, DOSSIER_LIMITS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
