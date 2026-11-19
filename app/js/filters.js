// Filters by kind. "Missable" is a flag that cuts across kinds; "Online" is listed because players ask,
// and stays at zero: the published list has no online trophy.

import { isEarned } from './progress-store.js';

export const KIND_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'strangers', label: 'Strangers' },
  { id: 'world', label: 'Open world' },
  { id: 'online', label: 'Online' },
  { id: 'todo', label: 'Not earned' },
];

export function isMissable(trophy) {
  return trophy.missable === 'high' || trophy.missable === 'watch';
}

export function matchesKindFilter(trophy, filterId, progress) {
  if (filterId === 'all') return true;
  if (filterId === 'missable') return isMissable(trophy);
  if (filterId === 'todo') return !isEarned(progress, trophy.id);
  return trophy.kind === filterId;
}

export function matchesSearch(trophy, query, hidden) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (hidden) return false;
  return [trophy.name, trophy.description, trophy.guide, trophy.grade].join(' ').toLowerCase().includes(needle);
}

export function countByKindFilter(trophies, progress) {
  const counts = {};
  for (const filter of KIND_FILTERS) counts[filter.id] = trophies.filter((trophy) => matchesKindFilter(trophy, filter.id, progress)).length;
  return counts;
}
