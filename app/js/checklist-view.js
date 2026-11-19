// The checklist: one row per trophy with its tick box, grade, official name and description, and its flags.

import { byId, el, formatCount } from './dom.js';
import { isEarned } from './progress-store.js';
import { isMissable, matchesKindFilter, matchesSearch } from './filters.js';
import { isHiddenBySpoilerShield, shownDescription, shownName } from './spoiler-shield.js';

const MISSABLE_FLAG = { high: 'MISSABLE', watch: 'WATCH' };

export function renderChecklist(app) {
  const { trophies } = app.data;
  const rows = trophies
    .filter((trophy) => matchesKindFilter(trophy, app.ui.filter, app.progress))
    .filter((trophy) => matchesSearch(trophy, app.ui.query, isHiddenBySpoilerShield(trophy, app.progress, app.ui.revealed)))
    .map((trophy) => trophyRow(app, trophy));
  if (rows.length === 0) rows.push(emptyRow(app.ui.filter));
  byId('trophy-checklist').replaceChildren(...rows);
}

function trophyRow(app, trophy) {
  const earned = isEarned(app.progress, trophy.id);
  const hidden = isHiddenBySpoilerShield(trophy, app.progress, app.ui.revealed);
  const classes = ['trophy-row', earned && 'earned', hidden && 'spoiler-hidden', app.ui.selectedId === trophy.id && 'selected'];
  return el('li', { class: classes.filter(Boolean).join(' '), dataset: { trophyId: trophy.id }, onclick: () => app.selectTrophy(trophy.id) },
    el('input', {
      type: 'checkbox', class: 'earned-tick', checked: earned, 'aria-label': 'Earned: ' + shownName(trophy, hidden),
      onclick: (event) => event.stopPropagation(),
      onchange: (event) => app.setTrophyEarned(trophy.id, event.target.checked),
    }),
    gradeBadge(trophy.grade),
    el('div', { class: 'trophy-text' },
      el('strong', { class: 'trophy-name' }, shownName(trophy, hidden)),
      el('span', { class: 'trophy-description' }, shownDescription(trophy, hidden))),
    el('div', { class: 'trophy-flags' },
      isMissable(trophy) && el('span', { class: 'flag flag-' + trophy.missable, title: trophy.missableWhy }, MISSABLE_FLAG[trophy.missable]),
      trophy.count && !hidden && el('span', { class: 'flag flag-count', title: 'Count PlayStation tracks' }, counterText(app, trophy))));
}

function counterText(app, trophy) {
  const done = app.progress.counters[trophy.id];
  return done ? formatCount(done) + ' / ' + formatCount(trophy.count) : '×' + formatCount(trophy.count);
}

export function gradeBadge(grade) {
  return el('span', { class: 'grade grade-' + grade, title: grade + ' trophy' }, grade);
}

function emptyRow(filterId) {
  const text = filterId === 'online'
    ? 'No online trophies: none of the 55 published trophies needs online play.'
    : 'No trophy matches this filter and search.';
  return el('li', { class: 'trophy-row empty' }, text);
}
