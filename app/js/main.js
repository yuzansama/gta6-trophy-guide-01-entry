// Leonida Legend: boots the offline GTA VI trophy guide and tracker.
// Loads data/trophies.json (the app's own file), restores saved progress and wires the top bar.

import { byId, el } from './dom.js';
import { countEarned, exportProgressToFile, importProgressFromFile, isEarned, loadProgressFromLocalStorage, saveProgressToLocalStorage, setEarned } from './progress-store.js';
import { KIND_FILTERS, countByKindFilter } from './filters.js';
import { readDeepLink, writeDeepLink } from './deep-link.js';
import { renderChecklist } from './checklist-view.js';
import { renderGuidePanel } from './guide-panel.js';
import { renderRoadmapToPlatinum } from './roadmap-view.js';
import { renderMissableWatchlist } from './missables-view.js';
import { renderSources } from './sources-view.js';

const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const VIEW_RENDERERS = { checklist: renderChecklist, roadmap: renderRoadmapToPlatinum, missables: renderMissableWatchlist, sources: renderSources };

const app = {
  data: null,
  progress: loadProgressFromLocalStorage(),
  ui: { view: 'checklist', filter: 'all', query: '', selectedId: null, revealed: new Set() },

  setTrophyEarned(trophyId, earned) {
    setEarned(app.progress, trophyId, earned);
    mirrorPlatinum(trophyId);
    commit('Saved: ' + countEarned(app.progress, app.data.trophies) + ' of 55 earned.');
  },
  setCounter(trophyId, value) {
    if (value > 0) app.progress.counters[trophyId] = Math.floor(value);
    else delete app.progress.counters[trophyId];
    commit('Counter saved.');
  },
  setNote(trophyId, text) {
    if (text) app.progress.notes[trophyId] = text;
    else delete app.progress.notes[trophyId];
    commit('Note saved.');
  },
  selectTrophy(trophyId) {
    app.ui.selectedId = trophyId;
    render();
  },
  revealTrophy(trophyId) {
    app.ui.revealed.add(trophyId);
    render();
  },
  showView(view) {
    app.ui.view = view;
    render();
  },
};

// The platinum unlocks itself on the console once the other 54 are earned; mirror that here in both
// directions, so unmarking a trophy by mistake also takes the platinum back. The platinum's own button
// is left alone, otherwise it would flip itself off whenever the other 54 are not done yet.
function mirrorPlatinum(changedTrophyId) {
  const platinum = app.data.trophies.find((trophy) => trophy.grade === 'platinum');
  if (changedTrophyId === platinum.id) return;
  const others = app.data.trophies.filter((trophy) => trophy !== platinum);
  setEarned(app.progress, platinum.id, others.every((trophy) => isEarned(app.progress, trophy.id)));
}

function commit(message) {
  const saved = saveProgressToLocalStorage(app.progress);
  byId('save-status').textContent = saved ? message + ' Stored in this browser (localStorage).' : 'Could not save: browser storage is unavailable. Use Export to keep your progress.';
  render();
}

function render() {
  renderTopBar();
  renderKindFilters();
  for (const view of Object.keys(VIEW_RENDERERS)) {
    byId(view + '-view').hidden = view !== app.ui.view;
    byId('tab-' + view).setAttribute('aria-selected', String(view === app.ui.view));
  }
  byId('kind-filters').hidden = byId('trophy-search').hidden = app.ui.view !== 'checklist';
  VIEW_RENDERERS[app.ui.view](app);
  renderGuidePanel(app);
  writeDeepLink(app.ui);
}

function renderTopBar() {
  const { trophies } = app.data;
  const earned = countEarned(app.progress, trophies);
  const percent = Math.round((earned / trophies.length) * 100);
  byId('platinum-progress').setAttribute('aria-valuenow', String(earned));
  byId('platinum-progress-bar').style.width = percent + '%';
  byId('platinum-progress-text').textContent = earned + ' / ' + trophies.length + ' earned · ' + percent + '%';
  byId('grade-tally').replaceChildren(...GRADES.map((grade) => {
    const ofGrade = trophies.filter((trophy) => trophy.grade === grade);
    return el('span', { class: 'tally grade-' + grade }, grade + ' ' + countEarned(app.progress, ofGrade) + '/' + ofGrade.length);
  }));
  byId('spoiler-shield-toggle').checked = app.progress.spoilerShield;
  byId('spoiler-shield-state').textContent = app.progress.spoilerShield ? 'ON' : 'off';
  document.body.classList.toggle('spoiler-shield-on', app.progress.spoilerShield);
}

function renderKindFilters() {
  const counts = countByKindFilter(app.data.trophies, app.progress);
  byId('kind-filters').replaceChildren(...KIND_FILTERS.map((filter) =>
    el('button', { type: 'button', class: 'filter-chip', 'aria-pressed': String(filter.id === app.ui.filter), dataset: { kind: filter.id },
      onclick: () => { app.ui.filter = filter.id; render(); } }, filter.label + ' ' + counts[filter.id])));
}

function wireTopBar() {
  byId('spoiler-shield-toggle').addEventListener('change', (event) => {
    app.progress.spoilerShield = event.target.checked;
    app.ui.revealed.clear();
    commit(event.target.checked ? 'Spoiler shield on: story trophies are hidden until earned.' : 'Spoiler shield off.');
  });
  byId('export-progress').addEventListener('click', () => {
    exportProgressToFile(app.progress);
    byId('save-status').textContent = 'Exported gta6-trophy-progress.json.';
  });
  byId('import-progress').addEventListener('click', () => byId('import-progress-file').click());
  byId('import-progress-file').addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      app.progress = await importProgressFromFile(file);
      commit('Imported ' + file.name + '.');
    } catch (error) {
      byId('save-status').textContent = 'Import failed: ' + error.message + '.';
    }
    event.target.value = '';
  });
  byId('view-tabs').addEventListener('click', (event) => {
    const tab = event.target.closest('[data-view]');
    if (tab) app.showView(tab.dataset.view);
  });
  byId('trophy-search').addEventListener('input', (event) => {
    app.ui.query = event.target.value;
    render();
  });
  window.addEventListener('hashchange', () => {
    Object.assign(app.ui, readDeepLink(location.hash, KIND_FILTERS.map((filter) => filter.id)));
    render();
  });
}

async function boot() {
  try {
    const response = await fetch('data/trophies.json');
    app.data = await response.json();
  } catch {
    byId('guide-panel').textContent = 'Could not read data/trophies.json. Serve the app folder with any static server and reload.';
    return;
  }
  Object.assign(app.ui, readDeepLink(location.hash, KIND_FILTERS.map((filter) => filter.id)));
  byId('trophy-search').value = app.ui.query;
  wireTopBar();
  render();
}

boot();
