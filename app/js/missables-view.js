// The missable watchlist: every flagged trophy with the reason for its flag, most urgent first.

import { byId, el } from './dom.js';
import { isEarned } from './progress-store.js';
import { isHiddenBySpoilerShield, shownDescription, shownName } from './spoiler-shield.js';
import { gradeBadge } from './checklist-view.js';

const GROUPS = [
  { level: 'high', title: 'MISSABLE: earn before the final mission', lead: 'These need your partner with you. If the ending parts the two leads, they cannot be earned afterwards.' },
  { level: 'watch', title: 'WATCH: riddles, named characters and strands', lead: 'No source confirms these as missable or safe yet. Attempt each before the final mission and keep a save per chapter.' },
];

export function renderMissableWatchlist(app) {
  const flagged = app.data.trophies.filter((trophy) => trophy.missable !== 'safe');
  const open = flagged.filter((trophy) => !isEarned(app.progress, trophy.id)).length;
  byId('missables-view').replaceChildren(
    el('h2', { class: 'view-title' }, 'Missable watchlist: ' + flagged.length + ' flagged, ' + open + ' still open'),
    el('p', { class: 'view-lead' }, 'Flags are derived from the wording of the official descriptions. The other ' + (app.data.trophies.length - flagged.length) + ' trophies are running totals or mandatory story progress and cannot be missed.'),
    ...GROUPS.map((group) => missableGroup(app, group, flagged.filter((trophy) => trophy.missable === group.level))));
}

function missableGroup(app, group, trophies) {
  return el('section', { class: 'missable-group missable-' + group.level },
    el('h3', {}, group.title + ' (' + trophies.length + ')'),
    el('p', {}, group.lead),
    el('ul', {}, trophies.map((trophy) => missableRow(app, trophy))));
}

function missableRow(app, trophy) {
  const hidden = isHiddenBySpoilerShield(trophy, app.progress, app.ui.revealed);
  const earned = isEarned(app.progress, trophy.id);
  return el('li', { class: 'missable-row' + (earned ? ' earned' : ''), onclick: () => app.selectTrophy(trophy.id) },
    gradeBadge(trophy.grade),
    el('strong', {}, (earned ? '✓ ' : '') + shownName(trophy, hidden)),
    el('span', { class: 'trophy-description' }, shownDescription(trophy, hidden)),
    el('em', {}, trophy.missableWhy));
}
