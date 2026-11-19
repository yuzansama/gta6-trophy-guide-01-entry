// The sources page: every source the guides cite, how many steps rest on each, and what the fact tags mean.

import { byId, el } from './dom.js';
import { sourceLink } from './guide-panel.js';

const FACT_TAGS = [
  ['OFFICIAL', 'Stated by the published trophy list or by Rockstar. Safe to rely on.'],
  ['PRECEDENT', 'How an earlier Rockstar game handled the same kind of trophy. A reason for a plan, not a GTA VI fact.'],
  ['VERIFY', 'Not confirmed by any source yet. Written as something to test, never as a fact.'],
];

export function renderSources(app) {
  const citations = countCitationsBySource(app.data.trophies);
  byId('sources-view').replaceChildren(
    el('h2', { class: 'view-title' }, 'Sources and how facts are tagged'),
    el('p', { class: 'view-lead' }, app.data.honesty),
    el('ul', { class: 'fact-tag-legend' }, FACT_TAGS.map(([tag, meaning]) =>
      el('li', { class: 'step step-' + tag.toLowerCase() }, el('span', { class: 'fact-tag' }, tag), ' ' + meaning))),
    el('ul', { class: 'source-list' }, Object.entries(app.data.sources).map(([id, source]) =>
      el('li', {}, el('strong', {}, source.name), ' ', source.what + '. Cited by ' + (citations[id] || 0) + ' steps. ', sourceLink(source)))),
    el('p', { class: 'view-lead' }, 'Links open only when you follow them. The app itself loads nothing from the network.'));
}

function countCitationsBySource(trophies) {
  const counts = {};
  for (const trophy of trophies) for (const step of trophy.steps) counts[step[2]] = (counts[step[2]] || 0) + 1;
  return counts;
}
