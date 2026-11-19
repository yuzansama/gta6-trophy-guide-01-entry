// Saved progress: which trophies are earned, per-trophy counters and notes, and the spoiler setting.
// It lives in localStorage and can be exported to a file and imported back.

const STORAGE_KEY = 'leonida-legend.progress.v1';
const EXPORT_FORMAT = 'leonida-legend-progress/1';

export function emptyProgress() {
  return { earned: {}, counters: {}, notes: {}, spoilerShield: false };
}

export function loadProgressFromLocalStorage() {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return emptyProgress();
  }
}

export function saveProgressToLocalStorage(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function setEarned(progress, trophyId, earned) {
  if (earned) progress.earned[trophyId] = true;
  else delete progress.earned[trophyId];
}

export function isEarned(progress, trophyId) {
  return progress.earned[trophyId] === true;
}

export function countEarned(progress, trophies) {
  return trophies.filter((trophy) => isEarned(progress, trophy.id)).length;
}

export function exportProgressToFile(progress) {
  const payload = { format: EXPORT_FORMAT, game: 'Grand Theft Auto VI (PS5)', ...progress };
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' }));
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function importProgressFromFile(file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || parsed.format !== EXPORT_FORMAT) throw new Error('Not a Leonida Legend progress file');
  return normalizeProgress(parsed);
}

function normalizeProgress(raw) {
  const progress = emptyProgress();
  if (!raw || typeof raw !== 'object') return progress;
  for (const [id, value] of Object.entries(raw.earned || {})) if (value === true) progress.earned[id] = true;
  for (const [id, value] of Object.entries(raw.counters || {})) if (Number.isFinite(value) && value > 0) progress.counters[id] = Math.floor(value);
  for (const [id, value] of Object.entries(raw.notes || {})) if (typeof value === 'string' && value) progress.notes[id] = value.slice(0, 2000);
  progress.spoilerShield = raw.spoilerShield === true;
  return progress;
}
