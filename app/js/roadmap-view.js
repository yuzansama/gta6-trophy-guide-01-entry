// The roadmap to the platinum: seven stages in the order to play them, each with its trophies and progress.

import { byId, el } from './dom.js';
import { isEarned } from './progress-store.js';
import { isMissable } from './filters.js';
import { isHiddenBySpoilerShield, shownName } from './spoiler-shield.js';

export function renderRoadmapToPlatinum(app) {
  const stages = app.data.roadmap.map((stage) => stageCard(app, stage));
  byId('roadmap-view').replaceChildren(
    el('h2', { class: 'view-title' }, 'Roadmap to the platinum: 7 stages, in order'),
    el('p', { class: 'view-lead' }, 'Built from the official descriptions: story chapters and named missions first, a safety stop before the final mission, then counts and collectibles.'),
    el('ol', { class: 'roadmap-stages' }, stages));
}

function stageCard(app, stage) {
  const trophies = app.data.trophies.filter((trophy) => trophy.stage === stage.stage);
  const earned = trophies.filter((trophy) => isEarned(app.progress, trophy.id)).length;
  return el('li', { class: 'stage-card' + (earned === trophies.length ? ' stage-done' : '') },
    el('h3', {}, el('span', { class: 'stage-number' }, String(stage.stage)), stage.title,
      el('span', { class: 'stage-progress' }, earned + ' / ' + trophies.length)),
    el('p', {}, stage.plan),
    el('div', { class: 'stage-trophies' }, trophies.map((trophy) => trophyChip(app, trophy))));
}

export function trophyChip(app, trophy) {
  const hidden = isHiddenBySpoilerShield(trophy, app.progress, app.ui.revealed);
  const classes = ['chip', 'chip-' + trophy.grade, isEarned(app.progress, trophy.id) && 'chip-earned', isMissable(trophy) && 'chip-' + trophy.missable];
  return el('button', { type: 'button', class: classes.filter(Boolean).join(' '), title: hidden ? 'Hidden by the spoiler shield' : trophy.description,
    onclick: () => app.selectTrophy(trophy.id) },
    (isEarned(app.progress, trophy.id) ? '✓ ' : '') + shownName(trophy, hidden) + (trophy.count && !hidden ? ' ×' + trophy.count.toLocaleString('en-US') : ''));
}
