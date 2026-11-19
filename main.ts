// Leonida Legend: hands in the offline GTA VI trophy guide (Node 22, standard library only).
// Copies app/ and screenshots/ into the output directory and writes dossier.json with the kit's library.
// Locally: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDirectory = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps: 3 or 4 screenshots of at most 256 KiB, the dossier text capped at 160 KiB.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function handInFolder(name: string): number {
  const target = join(outputDirectory, name);
  mkdirSync(target, { recursive: true });
  cpSync(join(repositoryRoot, name), target, { recursive: true });
  return readdirSync(target, { recursive: true }).length;
}

// The trophy file is the heart of the entry: refuse to hand in a guide that lost a trophy or a guide text.
function countGuidedTrophies(): number {
  const file = JSON.parse(readFileSync(join(repositoryRoot, 'app', 'data', 'trophies.json'), 'utf8'));
  const guided = file.trophies.filter((trophy: { name?: string; guide?: string }) => trophy.name && trophy.guide?.trim());
  if (guided.length !== 55) throw new Error(`app/data/trophies.json has ${guided.length} guided trophies, expected 55`);
  return guided.length;
}

const guidedTrophies = countGuidedTrophies();
mkdirSync(outputDirectory, { recursive: true });
const appEntries = handInFolder('app');
const screenshotCount = handInFolder('screenshots');
if (screenshotCount < 3 || screenshotCount > 4) throw new Error(`screenshots/ holds ${screenshotCount} files, expected 3 or 4`);
console.log(`${guidedTrophies} trophies with a guide`);
writeFileSync(join(outputDirectory, 'dossier.json'), buildDossier(outputDirectory, DOSSIER_LIMITS));
console.log(`handed in app/ (${appEntries} entries), ${screenshotCount} screenshots and dossier.json`);
