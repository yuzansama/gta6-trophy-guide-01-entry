// The guide to the selected trophy: official text, missable verdict, the guide in our own words,
// and every step with a tag saying what kind of fact it is and a link to the source it comes from.

import { byId, el, formatCount } from './dom.js';
import { isEarned } from './progress-store.js';
import { gradeBadge } from './checklist-view.js';
import { isHiddenBySpoilerShield, shownDescription, shownName } from './spoiler-shield.js';

const MISSABLE_VERDICT = {
  high: 'MISSABLE: do before the final mission',
  watch: 'WATCH: could be missable, unconfirmed',
  safe: 'Not missable',
};

export function renderGuidePanel(app) {
  const trophy = app.data.trophies.find((candidate) => candidate.id === app.ui.selectedId);
  byId('guide-panel').replaceChildren(...(trophy ? guideFor(app, trophy) : [introCard(app)]));
}

function guideFor(app, trophy) {
  const hidden = isHiddenBySpoilerShield(trophy, app.progress, app.ui.revealed);
  const stage = app.data.roadmap.find((entry) => entry.stage === trophy.stage);
  const head = el('header', { class: 'guide-head' },
    gradeBadge(trophy.grade),
    el('h2', {}, shownName(trophy, hidden)),
    el('p', { class: 'official-description' }, el('b', {}, 'Official: '), shownDescription(trophy, hidden)));
  if (hidden) {
    return [head, el('button', { type: 'button', class: 'reveal-spoiler', onclick: () => app.revealTrophy(trophy.id) }, 'Reveal this trophy and its guide')];
  }
  return [
    head,
    el('p', { class: 'verdict verdict-' + trophy.missable }, el('b', {}, MISSABLE_VERDICT[trophy.missable] + '. '), trophy.missableWhy),
    el('p', { class: 'stage-link' }, 'Roadmap stage ' + stage.stage + ': ',
      el('a', { href: '#view=roadmap', onclick: (event) => { event.preventDefault(); app.showView('roadmap'); } }, stage.title)),
    el('h3', {}, 'Guide'),
    el('p', { class: 'guide-text' }, trophy.guide),
    el('h3', {}, 'What each fact rests on'),
    el('ul', { class: 'cited-steps' }, trophy.steps.map((step) => citedStep(app, step))),
    trophy.count ? counterBox(app, trophy) : null,
    notesBox(app, trophy),
    earnedButton(app, trophy),
  ];
}

function citedStep(app, [tag, text, sourceId]) {
  const source = app.data.sources[sourceId];
  return el('li', { class: 'step step-' + tag.toLowerCase() },
    el('span', { class: 'fact-tag' }, tag),
    ' ' + text + ' ',
    sourceLink(source));
}

export function sourceLink(source) {
  return el('a', { class: 'source-link', href: source.url, target: '_blank', rel: 'noopener noreferrer', title: source.what }, 'Source: ' + source.name);
}

function counterBox(app, trophy) {
  const input = el('input', {
    type: 'number', min: '0', max: String(trophy.count), value: String(app.progress.counters[trophy.id] || 0), id: 'counter-input',
    onchange: (event) => app.setCounter(trophy.id, Number(event.target.value)),
  });
  return el('label', { class: 'counter-box' }, 'Your count ', input, ' of ' + formatCount(trophy.count));
}

function notesBox(app, trophy) {
  return el('label', { class: 'notes-box' }, 'Your notes (saved with your progress)',
    el('textarea', { rows: '2', placeholder: 'What you tried, which locations are done...', onchange: (event) => app.setNote(trophy.id, event.target.value) },
      app.progress.notes[trophy.id] || ''));
}

function earnedButton(app, trophy) {
  const earned = isEarned(app.progress, trophy.id);
  return el('button', { type: 'button', class: 'mark-earned', onclick: () => app.setTrophyEarned(trophy.id, !earned) },
    earned ? 'Earned ✓ (click to undo)' : 'Mark as earned');
}

function introCard(app) {
  return el('div', { class: 'intro-card' },
    el('h2', {}, 'Pick a trophy to open its guide'),
    el('p', {}, app.data.honesty),
    el('p', {}, 'Start with the Roadmap to platinum tab, then keep the Missables tab in view until the final mission is done.'));
}
