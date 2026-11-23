/**
 * Resolves a small, *exact-match* picture for a word. Used only when the author did not supply an image:
 * "Dog" gets a dog, "Photosynthesis" gets nothing (never a guess). Illustrations that need real context
 * come from the question's own `visual` metadata (stored at authoring time), not from this table.
 */
const PICTURES = {
  apple: '🍎', banana: '🍌', mango: '🥭', orange: '🍊', grapes: '🍇', strawberry: '🍓', watermelon: '🍉', carrot: '🥕',
  dog: '🐶', cat: '🐱', cow: '🐮', lion: '🦁', tiger: '🐯', elephant: '🐘', monkey: '🐒', rabbit: '🐰', horse: '🐴',
  fish: '🐟', whale: '🐋', dolphin: '🐬', frog: '🐸', bird: '🐦', duck: '🦆', butterfly: '🦋', bee: '🐝', snake: '🐍',
  turtle: '🐢', crab: '🦀', owl: '🦉', penguin: '🐧', camel: '🐪', giraffe: '🦒',
  sun: '☀️', moon: '🌙', star: '⭐', cloud: '☁️', rain: '🌧️', rainbow: '🌈', tree: '🌳', flower: '🌸', leaf: '🍃', plant: '🌱',
  earth: '🌍', fire: '🔥', water: '💧', snow: '❄️', mountain: '⛰️',
  book: '📚', pencil: '✏️', ball: '⚽', car: '🚗', bus: '🚌', train: '🚆', boat: '⛵', aeroplane: '✈️', airplane: '✈️', house: '🏠',
  clock: '🕐', bell: '🔔', key: '🔑', kite: '🪁',
  circle: '⚪', square: '🟦', triangle: '🔺', heart: '❤️',
};

/** Returns an emoji for an exact single-word match (singular or simple plural), otherwise null. */
export function pictureFor(text) {
  const word = String(text || '').trim().toLowerCase();
  if (!word || /\s/.test(word)) return null;
  return PICTURES[word] || PICTURES[word.replace(/s$/, '')] || null;
}

export const COUNTING_COLORS = {
  red: '#ef4444', green: '#22c55e', yellow: '#facc15', blue: '#3b82f6', orange: '#f97316', purple: '#8b5cf6', pink: '#ec4899', brown: '#a16207',
};

/** Normalises counting groups from untrusted metadata: bounded counts, known kinds only. */
export function normaliseGroups(groups) {
  return (Array.isArray(groups) ? groups : []).slice(0, 6).map((group) => ({
    kind: String(group?.kind || '').toLowerCase(),
    count: Math.max(0, Math.min(20, Math.floor(Number(group?.count) || 0))),
    color: COUNTING_COLORS[String(group?.color || '').toLowerCase()] || null,
  })).filter((group) => group.count > 0);
}
