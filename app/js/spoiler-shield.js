// The spoiler setting: while it is on, a story trophy's name and description stay hidden until it is earned.

import { isEarned } from './progress-store.js';

export const HIDDEN_NAME = 'Hidden story trophy';
export const HIDDEN_DESCRIPTION = 'Hidden until earned: tick it when it pops.';

export function isHiddenBySpoilerShield(trophy, progress, revealedIds) {
  return progress.spoilerShield && trophy.kind === 'story' && !isEarned(progress, trophy.id) && !revealedIds.has(trophy.id);
}

export function shownName(trophy, hidden) {
  return hidden ? HIDDEN_NAME : trophy.name;
}

export function shownDescription(trophy, hidden) {
  return hidden ? HIDDEN_DESCRIPTION : trophy.description;
}
