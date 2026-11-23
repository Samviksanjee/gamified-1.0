/**
 * Subject-based visual theme resolver.
 * Returns colours, a hero emoji, background class name and the CSS gradient
 * for use across all four games.
 */

export const THEMES = {
  mathematics: {
    key: 'mathematics',
    label: 'Mathematics',
    accent: '#f59e0b',
    accentSoft: '#fef3c7',
    accentText: '#92400e',
    hero: '🔢',
    emoji: '➕',
    bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #ecfdf5 100%)',
    cardBorder: '#fcd34d',
    confetti: ['#f59e0b', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa'],
  },
  science: {
    key: 'science',
    label: 'Science / EVS',
    accent: '#10b981',
    accentSoft: '#d1fae5',
    accentText: '#065f46',
    hero: '🔬',
    emoji: '🌱',
    bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #eff6ff 100%)',
    cardBorder: '#6ee7b7',
    confetti: ['#10b981', '#34d399', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
  },
  evs: {
    key: 'science',
    label: 'Science / EVS',
    accent: '#10b981',
    accentSoft: '#d1fae5',
    accentText: '#065f46',
    hero: '🌍',
    emoji: '🌿',
    bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #eff6ff 100%)',
    cardBorder: '#6ee7b7',
    confetti: ['#10b981', '#34d399', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
  },
  english: {
    key: 'english',
    label: 'English',
    accent: '#8b5cf6',
    accentSoft: '#ede9fe',
    accentText: '#4c1d95',
    hero: '📚',
    emoji: '✏️',
    bgGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #fdf4ff 100%)',
    cardBorder: '#c4b5fd',
    confetti: ['#8b5cf6', '#a78bfa', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'],
  },
  default: {
    key: 'default',
    label: 'Learning',
    accent: '#12a99f',
    accentSoft: '#e7f8f3',
    accentText: '#065f46',
    hero: '🎓',
    emoji: '⭐',
    bgGradient: 'linear-gradient(135deg, #f2f9f8 0%, #e7f8f3 50%, #fffbeb 100%)',
    cardBorder: '#6ee7b7',
    confetti: ['#12a99f', '#36a9db', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981'],
  },
};

export function getTheme(subject) {
  if (!subject) return THEMES.default;
  const key = String(subject).toLowerCase().trim();
  if (key.includes('math')) return THEMES.mathematics;
  if (key.includes('science') || key.includes('evs') || key.includes('environment')) return THEMES.science;
  if (key.includes('english') || key.includes('language')) return THEMES.english;
  return THEMES[key] || THEMES.default;
}

/** Per-difficulty tint for badges/chips */
export const DIFFICULTY_COLORS = {
  easy: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  medium: { bg: '#fef9c3', text: '#713f12', border: '#fde047' },
  hard: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

export function getDifficultyColor(difficulty) {
  return DIFFICULTY_COLORS[String(difficulty).toLowerCase()] || DIFFICULTY_COLORS.medium;
}
