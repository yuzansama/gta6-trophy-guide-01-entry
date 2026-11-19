// The address bar remembers the view, filter, search and open trophy, so a link reopens the same screen.
// Example: index.html#view=checklist&kind=missable&trophy=33

const VIEWS = ['checklist', 'roadmap', 'missables', 'sources'];

export function readDeepLink(hash, filterIds) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const trophyId = Number(params.get('trophy'));
  return {
    view: VIEWS.includes(params.get('view')) ? params.get('view') : 'checklist',
    filter: filterIds.includes(params.get('kind')) ? params.get('kind') : 'all',
    query: params.get('q') || '',
    selectedId: Number.isInteger(trophyId) && trophyId > 0 ? trophyId : null,
  };
}

export function writeDeepLink(ui) {
  const params = new URLSearchParams();
  if (ui.view !== 'checklist') params.set('view', ui.view);
  if (ui.filter !== 'all') params.set('kind', ui.filter);
  if (ui.query) params.set('q', ui.query);
  if (ui.selectedId) params.set('trophy', String(ui.selectedId));
  const hash = params.toString();
  history.replaceState(null, '', hash ? '#' + hash : location.pathname + location.search);
}
