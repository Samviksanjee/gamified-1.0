/**
 * Educational illustration library: small original SVG pictures that TEACH (apples to count, a butterfly's
 * life stages, photosynthesis ingredients...). The same registry feeds quiz questions, sequencing cards,
 * matching tiles and answer cards, so a concept looks the same everywhere and nothing is generated at play time.
 *
 *   <Icon name="apple" size={64} />          one picture
 *   iconKeyFor("Plants absorb sunlight")     -> "sun"   (keyword match for step/clue text; null if unsure)
 *   nounKeyFor("Dog")                        -> "dog"   (EXACT single word only; null if unsure)
 *   deriveVisual(item, subject)              -> a `visual` for questions that have none (null if unsure)
 *
 * Rule: when unsure, return null. A missing picture is better than a wrong or misleading one.
 */
const O = '#3d3550';
const S = { stroke: O, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' };
const eyes = (x, y, d = 5, r = 1.8) => <g fill={O}><circle cx={x - d} cy={y} r={r} /><circle cx={x + d} cy={y} r={r} /></g>;
const smile = (x, y, w = 3) => <path d={`M${x - w} ${y} Q${x} ${y + 3} ${x + w} ${y}`} stroke={O} strokeWidth="1.6" fill="none" strokeLinecap="round" />;

const ICONS = {
  apple: ({ fill = '#ef4444' } = {}) => <g><path d="M32 18 Q18 14 12 28 Q8 48 22 56 Q32 60 42 56 Q56 48 52 28 Q46 14 32 18Z" fill={fill} {...S} /><path d="M32 18 Q32 10 38 6" stroke="#7a4a2e" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M36 12 Q46 8 48 16 Q40 18 36 12Z" fill="#6bd08a" {...S} strokeWidth="1.6" /><ellipse cx="22" cy="30" rx="4" ry="7" fill="#fff" opacity=".4" /></g>,
  butterfly: () => <g><ellipse cx="18" cy="22" rx="14" ry="12" fill="#ff9ecf" {...S} transform="rotate(-20 18 22)" /><ellipse cx="46" cy="22" rx="14" ry="12" fill="#ff9ecf" {...S} transform="rotate(20 46 22)" /><ellipse cx="20" cy="42" rx="10" ry="9" fill="#c9a7ff" {...S} /><ellipse cx="44" cy="42" rx="10" ry="9" fill="#c9a7ff" {...S} /><ellipse cx="32" cy="34" rx="4.5" ry="16" fill="#5b4a7a" {...S} /><path d="M30 18 Q26 8 22 6 M34 18 Q38 8 42 6" stroke={O} strokeWidth="2" fill="none" /></g>,
  dog: () => <g><ellipse cx="14" cy="26" rx="8" ry="14" fill="#a8693c" {...S} transform="rotate(14 14 26)" /><ellipse cx="50" cy="26" rx="8" ry="14" fill="#a8693c" {...S} transform="rotate(-14 50 26)" /><circle cx="32" cy="32" r="20" fill="#e0b27a" {...S} /><ellipse cx="32" cy="40" rx="9" ry="7" fill="#fff3dc" {...S} strokeWidth="1.6" /><ellipse cx="32" cy="37" rx="3.6" ry="2.6" fill={O} />{eyes(32, 28, 8, 2.2)}<path d="M32 40 V44 M28 45 Q32 48 36 45" stroke={O} strokeWidth="1.6" fill="none" /></g>,
  cat: () => <g><path d="M10 10 L24 20 L10 30Z M54 10 L40 20 L54 30Z" fill="#f4a259" {...S} /><circle cx="32" cy="34" r="21" fill="#f4a259" {...S} />{eyes(32, 30, 8, 2.2)}<path d="M30 38 L34 38 L32 41Z" fill="#c2385a" /><path d="M32 41 Q28 46 24 43 M32 41 Q36 46 40 43" stroke={O} strokeWidth="1.6" fill="none" /><path d="M8 38 H20 M44 38 H56 M9 44 L20 41 M55 44 L44 41" stroke={O} strokeWidth="1.2" /></g>,
  fish: () => <g><path d="M8 32 Q22 12 44 24 Q52 28 56 22 V42 Q52 36 44 40 Q22 52 8 32Z" fill="#4ea8de" {...S} /><circle cx="20" cy="30" r="2.6" fill={O} /><path d="M30 24 Q34 32 30 40" stroke="#bfe3ff" strokeWidth="2" fill="none" /></g>,
  bird: () => <g><ellipse cx="30" cy="36" rx="18" ry="16" fill="#6bb8ff" {...S} /><circle cx="42" cy="22" r="11" fill="#6bb8ff" {...S} /><path d="M51 22 L60 25 L51 28Z" fill="#ffb347" {...S} strokeWidth="1.6" /><circle cx="44" cy="20" r="2.2" fill={O} /><path d="M12 34 Q4 28 4 20 Q16 24 20 32Z" fill="#4a90d9" {...S} /><path d="M26 50 V58 M34 50 V58" stroke="#ffb347" strokeWidth="3" strokeLinecap="round" /></g>,
  bee: () => <g><ellipse cx="22" cy="20" rx="10" ry="7" fill="#dff3ff" fillOpacity=".8" {...S} transform="rotate(-20 22 20)" /><ellipse cx="38" cy="18" rx="10" ry="7" fill="#dff3ff" fillOpacity=".8" {...S} transform="rotate(20 38 18)" /><ellipse cx="32" cy="38" rx="20" ry="16" fill="#ffd93d" {...S} /><path d="M24 24 V52 M34 22 V54 M44 28 V48" stroke={O} strokeWidth="5" opacity=".85" /><circle cx="18" cy="34" r="2.2" fill={O} /><path d="M8 38 L2 40" stroke={O} strokeWidth="2.4" strokeLinecap="round" /></g>,
  rabbit: () => <g><ellipse cx="22" cy="14" rx="6" ry="14" fill="#f5e6f0" {...S} /><ellipse cx="42" cy="14" rx="6" ry="14" fill="#f5e6f0" {...S} /><ellipse cx="22" cy="14" rx="2.6" ry="9" fill="#ffb3d4" /><ellipse cx="42" cy="14" rx="2.6" ry="9" fill="#ffb3d4" /><circle cx="32" cy="38" r="20" fill="#f5e6f0" {...S} />{eyes(32, 34, 8, 2.2)}<ellipse cx="32" cy="42" rx="3" ry="2.2" fill="#ff8fab" />{smile(32, 45, 4)}</g>,
  sun: () => <g>{Array.from({ length: 8 }, (_, i) => <path key={i} d="M32 4 V12" stroke="#ffb02e" strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 45} 32 32)`} />)}<circle cx="32" cy="32" r="14" fill="#ffd93d" {...S} />{eyes(32, 30, 5, 1.8)}{smile(32, 36, 4)}</g>,
  moon: () => <g><path d="M40 6 A26 26 0 1 0 58 40 A20 20 0 1 1 40 6Z" fill="#ffe066" {...S} /><circle cx="22" cy="34" r="2" fill={O} />{smile(24, 42, 3)}</g>,
  star: () => <g><polygon points="32,6 39,24 58,25 43,37 48,56 32,45 16,56 21,37 6,25 25,24" fill="#ffd93d" {...S} />{eyes(32, 34, 5, 1.8)}{smile(32, 40, 4)}</g>,
  tree: () => <g><rect x="27" y="38" width="10" height="20" rx="3" fill="#a8693c" {...S} /><circle cx="32" cy="26" r="20" fill="#4cbf74" {...S} /><circle cx="22" cy="32" r="10" fill="#6bd08a" {...S} strokeWidth="1.6" /><circle cx="42" cy="20" r="8" fill="#6bd08a" {...S} strokeWidth="1.6" /></g>,
  flower: () => <g><path d="M32 34 V58" stroke="#3b8a4a" strokeWidth="3.4" strokeLinecap="round" /><path d="M32 50 Q44 44 46 52 Q38 56 32 50Z" fill="#6bd08a" {...S} strokeWidth="1.6" />{Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx="32" cy="14" rx="6" ry="9" fill="#ff9ecf" {...S} strokeWidth="1.6" transform={`rotate(${i * 60} 32 24)`} />)}<circle cx="32" cy="24" r="6.5" fill="#ffd93d" {...S} /></g>,
  book: () => <g><path d="M6 14 Q20 10 32 16 Q44 10 58 14 V52 Q44 48 32 54 Q20 48 6 52Z" fill="#6bb8ff" {...S} /><path d="M12 18 Q22 16 30 20 V48 Q22 44 12 46Z M52 18 Q42 16 34 20 V48 Q42 44 52 46Z" fill="#fff" /><path d="M32 16 V54" stroke={O} strokeWidth="1.6" /></g>,
  ball: () => <g><circle cx="32" cy="32" r="24" fill="#ff6b6b" {...S} /><path d="M12 24 Q32 34 52 24 M12 42 Q32 32 52 42" stroke="#fff" strokeWidth="3" fill="none" /><ellipse cx="24" cy="20" rx="5" ry="3" fill="#fff" opacity=".5" /></g>,
  drop: () => <g><path d="M32 6 Q50 28 50 38 A18 18 0 0 1 14 38 Q14 28 32 6Z" fill="#6bb8ff" {...S} /><ellipse cx="25" cy="38" rx="3.5" ry="6" fill="#fff" opacity=".55" /></g>,
  cloud: () => <g><path d="M16 46 Q4 46 6 36 Q8 28 18 30 Q20 16 34 18 Q46 14 50 28 Q60 28 58 38 Q58 46 48 46Z" fill="#eaf3ff" {...S} />{eyes(32, 34, 6, 1.8)}{smile(32, 38, 4)}</g>,
  rain: () => <g><path d="M16 36 Q4 36 6 26 Q8 18 18 20 Q20 8 34 10 Q46 6 50 20 Q60 20 58 30 Q58 36 48 36Z" fill="#b8c8de" {...S} />{[18, 30, 42].map((x, i) => <path key={x} d={`M${x} ${42 + (i % 2) * 4} l-3 9`} stroke="#4ea8de" strokeWidth="3.4" strokeLinecap="round" />)}</g>,
  evaporate: () => <g><path d="M4 50 Q14 44 24 50 T44 50 T60 50 V60 H4Z" fill="#6bb8ff" {...S} />{[16, 32, 48].map((x) => <path key={x} d={`M${x} 40 V18 M${x - 5} 25 L${x} 17 L${x + 5} 25`} stroke="#ff8a3d" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}</g>,
  egg: () => <g><path d="M32 6 Q50 6 50 34 Q50 56 32 56 Q14 56 14 34 Q14 6 32 6Z" fill="#fff6dc" {...S} /><circle cx="26" cy="28" r="3" fill="#ffd0a0" /><circle cx="38" cy="38" r="3.4" fill="#ffd0a0" /><circle cx="28" cy="44" r="2.4" fill="#ffd0a0" /></g>,
  caterpillar: () => <g>{[10, 22, 34, 46].map((x, i) => <circle key={x} cx={x} cy={44 - (i % 2) * 4} r="9" fill={i % 2 ? '#a3e08a' : '#7bd05f'} {...S} />)}<circle cx="54" cy="32" r="10" fill="#8fe06b" {...S} />{eyes(54, 30, 4, 1.8)}{smile(54, 36, 3)}<path d="M50 23 Q46 14 42 14 M58 23 Q62 14 66 14" stroke={O} strokeWidth="2" fill="none" /></g>,
  chrysalis: () => <g><path d="M32 2 V12" stroke="#7a4a2e" strokeWidth="3" strokeLinecap="round" /><path d="M32 12 Q50 22 46 42 Q42 58 32 60 Q22 58 18 42 Q14 22 32 12Z" fill="#8bd3a4" {...S} /><path d="M22 28 Q32 34 42 28 M20 40 Q32 46 44 40" stroke="#3b8a4a" strokeWidth="2" fill="none" /><ellipse cx="25" cy="26" rx="3" ry="6" fill="#fff" opacity=".4" /></g>,
  seed: () => <g><ellipse cx="32" cy="30" rx="12" ry="17" fill="#c08a52" {...S} transform="rotate(20 32 30)" /><path d="M26 24 Q32 30 28 40" stroke="#8a5a30" strokeWidth="2" fill="none" /><path d="M4 54 H60" stroke="#8b5a3c" strokeWidth="6" strokeLinecap="round" /></g>,
  sprout: () => <g><path d="M32 56 V32" stroke="#3b8a4a" strokeWidth="3.6" strokeLinecap="round" /><path d="M32 36 Q14 34 12 18 Q30 18 32 36Z" fill="#6bd08a" {...S} /><path d="M32 30 Q50 28 52 12 Q34 12 32 30Z" fill="#4cbf74" {...S} /><path d="M4 56 H60" stroke="#8b5a3c" strokeWidth="6" strokeLinecap="round" /></g>,
  plant: () => <g><path d="M22 44 L26 60 H38 L42 44Z" fill="#c8794a" {...S} /><path d="M32 44 V22" stroke="#3b8a4a" strokeWidth="3.4" strokeLinecap="round" /><path d="M32 38 Q12 38 10 20 Q30 20 32 38Z" fill="#6bd08a" {...S} /><path d="M32 30 Q54 30 54 10 Q34 10 32 30Z" fill="#4cbf74" {...S} /></g>,
  soil: () => <g><path d="M4 30 Q16 22 32 28 T60 26 V58 H4Z" fill="#8b5a3c" {...S} /><circle cx="18" cy="42" r="3" fill="#6b3f26" /><circle cx="38" cy="48" r="3.4" fill="#6b3f26" /><circle cx="50" cy="38" r="2.6" fill="#6b3f26" /></g>,
  co2: () => <g><circle cx="32" cy="32" r="10" fill="#9aa5b8" {...S} /><circle cx="12" cy="32" r="8" fill="#ff6b6b" {...S} /><circle cx="52" cy="32" r="8" fill="#ff6b6b" {...S} /></g>,
  oxygen: () => <g><circle cx="22" cy="32" r="12" fill="#6bb8ff" {...S} /><circle cx="44" cy="32" r="12" fill="#6bb8ff" {...S} /><path d="M12 14 Q16 8 20 14 M46 12 Q50 6 54 12" stroke="#8be07b" strokeWidth="2.4" fill="none" strokeLinecap="round" /></g>,
  glucose: () => <g><path d="M32 6 L54 18 V44 L32 58 L10 44 V18Z" fill="#ffe0a3" {...S} /><path d="M32 6 V30 M10 18 L32 30 L54 18" stroke={O} strokeWidth="1.8" fill="none" /><circle cx="32" cy="32" r="5" fill="#fff" opacity=".6" /></g>,
  earth: () => <g><circle cx="32" cy="32" r="26" fill="#4ea8de" {...S} /><path d="M16 22 Q26 14 30 24 Q24 32 18 30 Q12 28 16 22Z M36 38 Q50 30 52 42 Q46 54 38 50Z" fill="#6bd08a" {...S} strokeWidth="1.6" /><ellipse cx="22" cy="18" rx="5" ry="3" fill="#fff" opacity=".4" /></g>,
  planet: ({ fill = '#ffa94d' } = {}) => <g><circle cx="32" cy="32" r="18" fill={fill} {...S} /><ellipse cx="32" cy="34" rx="29" ry="7" fill="none" stroke={O} strokeWidth="5" transform="rotate(-18 32 34)" opacity=".0" /><path d="M22 26 Q32 22 42 28" stroke="#fff" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round" /></g>,
  ringplanet: () => <g><circle cx="32" cy="32" r="17" fill="#f6c744" {...S} /><ellipse cx="32" cy="34" rx="29" ry="8" fill="none" stroke={O} strokeWidth="6" transform="rotate(-18 32 34)" /><ellipse cx="32" cy="34" rx="29" ry="8" fill="none" stroke="#ff9ecf" strokeWidth="3" transform="rotate(-18 32 34)" /></g>,
  nest: () => <g><path d="M6 36 Q32 66 58 36 Q50 30 32 32 Q14 30 6 36Z" fill="#c8913f" {...S} /><path d="M12 40 Q32 54 52 40 M10 36 L24 44 M54 36 L40 44" stroke="#8a5a1a" strokeWidth="2" fill="none" /><ellipse cx="26" cy="30" rx="6" ry="8" fill="#fff6dc" {...S} strokeWidth="1.8" /><ellipse cx="38" cy="30" rx="6" ry="8" fill="#bfe3ff" {...S} strokeWidth="1.8" /></g>,
  hive: () => <g><path d="M32 4 Q56 8 56 30 V56 H8 V30 Q8 8 32 4Z" fill="#ffd93d" {...S} /><path d="M8 24 H56 M8 38 H56 M8 50 H56" stroke="#e5a916" strokeWidth="3" /><ellipse cx="32" cy="46" rx="8" ry="10" fill="#7a4a2e" {...S} /></g>,
  burrow: () => <g><path d="M2 58 V36 Q2 26 14 26 H50 Q62 26 62 36 V58Z" fill="#6bd08a" {...S} /><path d="M16 58 Q16 32 32 32 Q48 32 48 58Z" fill="#5b3a22" {...S} /><circle cx="32" cy="46" r="1.8" fill="#ffd93d" /><circle cx="36" cy="46" r="1.8" fill="#ffd93d" /></g>,
  kennel: () => <g><path d="M6 30 L32 8 L58 30 V58 H6Z" fill="#e0872d" {...S} /><path d="M2 32 L32 4 L62 32" fill="none" stroke="#a8561c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 58 V42 Q22 34 32 34 Q42 34 42 42 V58Z" fill="#4a2a12" {...S} /><path d="M6 58 H58" stroke={O} strokeWidth="2.2" /></g>,
  toothpaste: () => <g><rect x="10" y="22" width="36" height="20" rx="6" fill="#ff6b8b" {...S} /><rect x="44" y="26" width="8" height="12" rx="2" fill="#dbeafe" {...S} /><rect x="50" y="29" width="6" height="6" rx="1.5" fill="#fff" {...S} strokeWidth="1.6" /><path d="M18 28 H36 M18 36 H30" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><path d="M58 32 Q62 32 62 38" stroke="#7cc4ff" strokeWidth="3" fill="none" strokeLinecap="round" /></g>,
  toothbrush: () => <g><rect x="4" y="26" width="38" height="10" rx="5" fill="#6bb8ff" {...S} /><rect x="38" y="20" width="22" height="22" rx="4" fill="#fff" {...S} />{[42, 47, 52, 57].map((x) => <path key={x} d={`M${x} 20 V12`} stroke="#ff6b8b" strokeWidth="3.4" strokeLinecap="round" />)}</g>,
  tooth: () => <g><path d="M14 16 Q14 6 24 8 Q32 10 40 8 Q50 6 50 16 Q50 28 44 38 Q42 58 36 56 Q32 50 28 56 Q22 58 20 38 Q14 28 14 16Z" fill="#fff" {...S} />{eyes(32, 24, 7, 2)}{smile(32, 31, 4)}</g>,
  circle: () => <circle cx="32" cy="32" r="24" fill="#ff8a8a" {...S} />,
  square: () => <rect x="9" y="9" width="46" height="46" rx="5" fill="#6bc6ff" {...S} />,
  rectangle: () => <rect x="4" y="16" width="56" height="32" rx="5" fill="#8be07b" {...S} />,
  triangle: () => <polygon points="32,6 58,56 6,56" fill="#ffd93d" {...S} />,
  oval: () => <ellipse cx="32" cy="32" rx="27" ry="17" fill="#c4b5fd" {...S} />,
  pentagon: () => <polygon points="32,6 58,26 48,56 16,56 6,26" fill="#ff9ecf" {...S} />,
  hexagon: () => <polygon points="18,8 46,8 60,32 46,56 18,56 4,32" fill="#7cdcc4" {...S} />,
  diamond: () => <polygon points="32,4 58,32 32,60 6,32" fill="#9ec5ff" {...S} />,
  heart: () => <path d="M32 56 Q4 36 8 20 Q12 8 24 10 Q30 12 32 18 Q34 12 40 10 Q52 8 56 20 Q60 36 32 56Z" fill="#ff6b8b" {...S} />,
  cube: () => <g><polygon points="32,6 56,18 56,44 32,58 8,44 8,18" fill="#7cc4ff" {...S} /><path d="M8 18 L32 32 L56 18 M32 32 V58" stroke={O} strokeWidth="2.2" fill="none" /><polygon points="8,18 32,32 32,58 8,44" fill="#5aa9e6" opacity=".6" /></g>,
  sphere: () => <g><circle cx="32" cy="32" r="25" fill="#ff9e5e" {...S} /><ellipse cx="23" cy="22" rx="8" ry="5" fill="#fff" opacity=".5" transform="rotate(-30 23 22)" /></g>,
  cone: () => <g><path d="M32 4 L56 50 Q32 62 8 50Z" fill="#c4b5fd" {...S} /><ellipse cx="32" cy="50" rx="24" ry="8" fill="#a78bfa" {...S} /></g>,
  cylinder: () => <g><path d="M10 14 V48 Q32 62 54 48 V14" fill="#8be07b" {...S} /><ellipse cx="32" cy="14" rx="22" ry="8" fill="#b8f0ac" {...S} /></g>,
};
// the 'pencil' etc. share a handful of simple fallbacks through the emoji table in visualAssetResolver

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, size = 56, label, fill, className }) {
  const draw = ICONS[name];
  if (!draw) return null;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" className={className}>
      {draw(fill ? { fill } : undefined)}
    </svg>
  );
}

/* ── keyword → icon (text of a sequencing step / clue). Order matters: more specific first. ─────────────── */
const KEYWORDS = [
  [/carbon dioxide|\bco2\b/i, 'co2'], [/oxygen/i, 'oxygen'], [/glucose|sugar|makes? (its )?food|produces? food/i, 'glucose'],
  [/sunlight|sunshine|\bsun\b/i, 'sun'], [/evaporat/i, 'evaporate'], [/condens/i, 'cloud'], [/precipitat|\brain(s|ing|fall)?\b/i, 'rain'],
  [/water|drink|absorb/i, 'drop'], [/chrysalis|pupa|cocoon/i, 'chrysalis'], [/caterpillar|larva/i, 'caterpillar'], [/butterfly/i, 'butterfly'],
  [/\begg/i, 'egg'], [/sprout|seedling|germinat/i, 'sprout'], [/\bseed/i, 'seed'], [/\btree\b/i, 'tree'], [/flower|bloom/i, 'flower'],
  [/toothpaste/i, 'toothpaste'], [/brush/i, 'toothbrush'], [/rinse|spit/i, 'drop'], [/teeth|tooth/i, 'tooth'], [/\bplant|\bgrow/i, 'plant'],
];
export function iconKeyFor(text) {
  const value = String(text || '');
  const hit = KEYWORDS.find(([pattern]) => pattern.test(value));
  return hit ? hit[1] : null;
}

const NOUNS = {
  apple: 'apple', apples: 'apple', butterfly: 'butterfly', butterflies: 'butterfly', dog: 'dog', dogs: 'dog', puppy: 'dog', cat: 'cat', cats: 'cat', kitten: 'cat',
  fish: 'fish', bird: 'bird', birds: 'bird', bee: 'bee', bees: 'bee', rabbit: 'rabbit', rabbits: 'rabbit', sun: 'sun', moon: 'moon', star: 'star', stars: 'star',
  tree: 'tree', trees: 'tree', flower: 'flower', flowers: 'flower', book: 'book', books: 'book', ball: 'ball', balls: 'ball', water: 'drop', rain: 'rain', cloud: 'cloud',
  egg: 'egg', caterpillar: 'caterpillar', chrysalis: 'chrysalis', seed: 'seed', sprout: 'sprout', plant: 'plant', soil: 'soil', earth: 'earth', nest: 'nest', hive: 'hive',
  burrow: 'burrow', kennel: 'kennel', toothpaste: 'toothpaste', toothbrush: 'toothbrush', tooth: 'tooth', oxygen: 'oxygen', glucose: 'glucose', 'carbon dioxide': 'co2',
  circle: 'circle', square: 'square', rectangle: 'rectangle', triangle: 'triangle', oval: 'oval', pentagon: 'pentagon', hexagon: 'hexagon', diamond: 'diamond', heart: 'heart',
  cube: 'cube', sphere: 'sphere', cone: 'cone', cylinder: 'cylinder', sunlight: 'sun',
};
/** EXACT match only ("Dog" → dog). Multi-word answers and abstract words get nothing. */
export function nounKeyFor(text) {
  const word = String(text || '').trim().toLowerCase();
  return NOUNS[word] || null;
}

/* ── scenes ──────────────────────────────────────────────────────────────── */
export function NumberPath({ start, size = 56 }) {
  const cells = [-2, -1, 0, 1].map((d) => start + d);   // the number after the missing one is NOT shown (it would give the answer away)
  return (
    <div role="img" aria-label={`A number path: ${cells.slice(0, 3).join(', ')}, then a missing number`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
      {cells.map((n, i) => {
        const missing = i === 3;
        return (
          <span key={n} aria-hidden="true" style={{ width: size, height: size, borderRadius: 14, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: size * 0.42,
            background: missing ? '#fff7dc' : '#e0f2fe', color: '#153e67', border: missing ? '3px dashed #f59e0b' : '2px solid #bae6fd' }}>
            {missing ? '?' : n}
          </span>
        );
      })}
    </div>
  );
}

function Row({ children, label }) {
  return <div role="img" aria-label={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>{children}</div>;
}
const Op = ({ children }) => <span aria-hidden="true" style={{ fontSize: 30, fontWeight: 900, color: '#153e67' }}>{children}</span>;
const Apples = ({ n, fill }) => <span aria-hidden="true" style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 2, maxWidth: 200, justifyContent: 'center' }}>{Array.from({ length: n }, (_, i) => <Icon key={i} name="apple" size={40} fill={fill} />)}</span>;

export function Scene({ scene, params = {} }) {
  switch (scene) {
    case 'addition': return <Row label={`${params.a} apples plus ${params.b} apples`}><Apples n={params.a} /><Op>+</Op><Apples n={params.b} fill="#6bd08a" /></Row>;
    case 'subtraction': return <Row label={`Start with ${params.a} apples and take away ${params.b}`}><Apples n={params.a} /><Op>−</Op><Apples n={params.b} fill="#9aa5b8" /></Row>;
    case 'number_path': return <NumberPath start={params.after} />;
    case 'plant_needs': return <Row label="A plant with sunlight, water and soil"><Icon name="sun" size={64} /><Icon name="plant" size={72} /><Icon name="drop" size={56} /><Icon name="soil" size={64} /></Row>;
    case 'planets': return <Row label="Some planets in space">{[['ringplanet'], ['earth'], ['planet', '#ff8a6b'], ['planet', '#b48cff']].map(([n, fill], i) => <Icon key={i} name={n} size={62} fill={fill} />)}</Row>;
    case 'photosynthesis': return <Row label="A plant with sunlight, water, carbon dioxide and oxygen"><Icon name="sun" size={56} /><Icon name="drop" size={44} /><Icon name="co2" size={48} /><Icon name="plant" size={72} /><Icon name="oxygen" size={48} /><Icon name="glucose" size={44} /></Row>;
    case 'lifecycle': return <Row label="Egg, caterpillar, chrysalis and butterfly">{['egg', 'caterpillar', 'chrysalis', 'butterfly'].map((n) => <Icon key={n} name={n} size={52} />)}</Row>;
    case 'word': return params.icon ? <Row label={params.alt || 'A picture of the word'}><Icon name={params.icon} size={96} /></Row> : null;
    default: return null;
  }
}

/**
 * Pick a visual for a question that has none. Returns null whenever the prompt is not clearly one of the
 * patterns below (so no decoration is ever invented), and never labels or highlights the correct answer.
 */
export function deriveVisual(item, subject) {
  const prompt = String(item?.prompt || '');
  const text = prompt.toLowerCase();
  const sub = String(subject || '').toLowerCase();
  const isMath = sub.includes('math') || /\d/.test(text);
  if (isMath || !sub) {
    const add = text.match(/(?:what is|how much is|find)?\s*(\d{1,2})\s*\+\s*(\d{1,2})/);
    if (add && Number(add[1]) <= 10 && Number(add[2]) <= 10) return { type: 'scene', scene: 'addition', params: { a: Number(add[1]), b: Number(add[2]) } };
    const sub2 = text.match(/(\d{1,2})\s*[-−–]\s*(\d{1,2})/);
    if (sub2 && Number(sub2[1]) <= 12 && Number(sub2[2]) <= Number(sub2[1])) return { type: 'scene', scene: 'subtraction', params: { a: Number(sub2[1]), b: Number(sub2[2]) } };
    const after = text.match(/(?:comes?|is)\s+(?:right\s+)?after\s+(\d{1,3})/);
    if (after) return { type: 'scene', scene: 'number_path', params: { after: Number(after[1]) } };
  }
  if (/photosynthesis/.test(text)) return { type: 'scene', scene: 'photosynthesis' };
  if (/what do(es)? plants? need|plants? need to grow/.test(text)) return { type: 'scene', scene: 'plant_needs' };
  if (/which planet|planet do we live|planet we live/.test(text)) return { type: 'scene', scene: 'planets' };
  if (/life ?cycle of a butterfly|butterfly.*stages/.test(text)) return { type: 'scene', scene: 'lifecycle' };
  const spelling = prompt.match(/spelling of\s+["“']?([A-Za-z]+)["”']?/i);
  if (spelling && nounKeyFor(spelling[1])) return { type: 'scene', scene: 'word', params: { icon: nounKeyFor(spelling[1]), alt: `A picture of a ${spelling[1].toLowerCase()}` } };
  return null;
}
