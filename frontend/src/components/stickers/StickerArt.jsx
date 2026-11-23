/**
 * Original sticker characters, hand-built as SVG (no emoji, no third-party artwork, no franchise characters).
 * One consistent visual language: rounded shapes, a dark-plum outline, soft highlight, blush cheeks and a
 * little sparkle in every eye. Each character has its own silhouette and personality; evolutions share a
 * silhouette but gain accessories and new colours.
 *
 * <StickerArt art="baby_penguin" size={96} />  (art = sticker key; unknown keys fall back to a friendly star)
 */
const O = '#3d3550';            // outline
const W = { stroke: O, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };

function Eyes({ x = 50, y = 50, s = 1, dx = 9, color = O, spark = '#fff', wink = false }) {
  const eye = (cx, w) => w
    ? <path key={cx} d={`M${cx - 3.4 * s} ${y} Q${cx} ${y - 3.6 * s} ${cx + 3.4 * s} ${y}`} stroke={color} strokeWidth={1.8 * s} fill="none" strokeLinecap="round" />
    : <g key={cx}><ellipse cx={cx} cy={y} rx={3.1 * s} ry={3.9 * s} fill={color} /><circle cx={cx + 1 * s} cy={y - 1.4 * s} r={1.15 * s} fill={spark} /></g>;
  return <>{eye(x - dx * s, false)}{eye(x + dx * s, wink)}</>;
}
function Smile({ x = 50, y = 58, s = 1, open = false }) {
  return open
    ? <path d={`M${x - 4.5 * s} ${y} Q${x} ${y + 9 * s} ${x + 4.5 * s} ${y} Z`} fill="#c2385a" stroke={O} strokeWidth={1.6} strokeLinejoin="round" />
    : <path d={`M${x - 4 * s} ${y} Q${x} ${y + 5 * s} ${x + 4 * s} ${y}`} stroke={O} strokeWidth={1.8 * s} fill="none" strokeLinecap="round" />;
}
function Cheeks({ x = 50, y = 56, s = 1, dx = 14 }) {
  return <><ellipse cx={x - dx * s} cy={y} rx={3.4 * s} ry={2.3 * s} fill="#ff8fab" opacity=".55" /><ellipse cx={x + dx * s} cy={y} rx={3.4 * s} ry={2.3 * s} fill="#ff8fab" opacity=".55" /></>;
}
function Face({ x = 50, y = 50, s = 1, dx = 9, open = true, wink = false, eye = O, spark = '#fff', cheeks = true }) {
  return <g><Eyes x={x} y={y} s={s} dx={dx} color={eye} spark={spark} wink={wink} />{cheeks && <Cheeks x={x} y={y + 6 * s} s={s} dx={dx + 5} />}<Smile x={x} y={y + 8 * s} s={s} open={open} /></g>;
}
const Shadow = () => <ellipse cx="50" cy="94" rx="26" ry="4" fill="#3d3550" opacity=".14" />;
const Shine = ({ x, y, rx = 7, ry = 4, rot = -30 }) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" opacity=".45" transform={`rotate(${rot} ${x} ${y})`} />;
const Sparkle = ({ x, y, r = 4, c = '#ffd93d' }) => <path d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`} fill={c} stroke={O} strokeWidth="1" strokeLinejoin="round" />;
const star5 = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const k = i % 2 ? r : R; return `${(cx + Math.cos(a) * k).toFixed(1)},${(cy + Math.sin(a) * k).toFixed(1)}`; }).join(' ');

/* ── accessories (what makes evolutions and variants different) ─────────── */
const ExplorerHat = ({ y = 22 }) => <g {...W}><ellipse cx="50" cy={y + 6} rx="26" ry="5" fill="#c68b4a" /><path d={`M30 ${y + 5} Q50 ${y - 18} 70 ${y + 5}Z`} fill="#d9a066" /><path d={`M32 ${y + 3} H68`} stroke="#8a4b2a" strokeWidth="4" /></g>;
const DetectiveCap = ({ y = 22 }) => <g {...W}><path d={`M28 ${y + 6} Q50 ${y - 16} 72 ${y + 6}Z`} fill="#8b6f47" /><path d={`M24 ${y + 6} H78 Q70 ${y + 11} 52 ${y + 9}Z`} fill="#6e5636" /></g>;
const Crown = ({ x = 50, y = 18, c = '#ffd93d' }) => <g {...W}><path d={`M${x - 12} ${y + 10} L${x - 14} ${y - 4} L${x - 6} ${y + 3} L${x} ${y - 7} L${x + 6} ${y + 3} L${x + 14} ${y - 4} L${x + 12} ${y + 10}Z`} fill={c} /><circle cx={x} cy={y + 2} r="2" fill="#ff6b8b" strokeWidth="1" /></g>;
const Cape = ({ c = '#ef4444' }) => <path d="M30 52 Q10 78 22 92 L50 84 L78 92 Q90 78 70 52Z" fill={c} {...W} />;
const Magnifier = ({ x = 78, y = 70 }) => <g {...W}><circle cx={x} cy={y} r="8" fill="#dbeafe" fillOpacity=".7" /><path d={`M${x + 6} ${y + 6} L${x + 14} ${y + 15}`} stroke="#8b6f47" strokeWidth="4" /></g>;

/* ── animals ───────────────────────────────────────────────────────────── */
function Penguin({ body = '#46527a', belly = '#fff', beak = '#ffb347', hat = null, cape = false, mask = false, glasses = false, medal = false }) {
  return <g>
    <Shadow />{cape && <Cape />}
    <ellipse cx="38" cy="90" rx="9" ry="4.5" fill={beak} {...W} /><ellipse cx="62" cy="90" rx="9" ry="4.5" fill={beak} {...W} />
    <ellipse cx="22" cy="62" rx="8" ry="16" fill={body} transform="rotate(18 22 62)" {...W} /><ellipse cx="78" cy="62" rx="8" ry="16" fill={body} transform="rotate(-18 78 62)" {...W} />
    <ellipse cx="50" cy="58" rx="27" ry="33" fill={body} {...W} /><ellipse cx="50" cy="66" rx="18" ry="23" fill={belly} />
    <Shine x={38} y={32} /><Face x={50} y={46} s={0.95} dx={10} open={false} />
    <path d="M45 54 L55 54 L50 61Z" fill={beak} {...W} strokeWidth="1.6" />
    {mask && <path d="M30 44 Q50 36 70 44 L70 51 Q50 45 30 51Z" fill="#ef4444" {...W} strokeWidth="1.5" />}
    {glasses && <g fill="none" stroke={O} strokeWidth="1.6"><circle cx="40" cy="46" r="6" /><circle cx="60" cy="46" r="6" /></g>}
    {medal && <g><path d="M44 70 L50 78 L56 70" fill="none" stroke="#ef4444" strokeWidth="3" /><polygon points={star5(50, 80, 6, 2.8)} fill="#ffd93d" {...W} strokeWidth="1.2" /></g>}
    {hat}
  </g>;
}
const Panda = () => <g><Shadow />
  <ellipse cx="50" cy="78" rx="23" ry="16" fill="#fff" {...W} /><ellipse cx="30" cy="78" rx="7" ry="12" fill="#2d2840" {...W} transform="rotate(20 30 78)" /><ellipse cx="70" cy="78" rx="7" ry="12" fill="#2d2840" {...W} transform="rotate(-20 70 78)" />
  <circle cx="26" cy="26" r="11" fill="#2d2840" {...W} /><circle cx="74" cy="26" r="11" fill="#2d2840" {...W} />
  <ellipse cx="50" cy="46" rx="30" ry="26" fill="#fff" {...W} />
  <ellipse cx="37" cy="44" rx="8" ry="10" fill="#2d2840" transform="rotate(20 37 44)" /><ellipse cx="63" cy="44" rx="8" ry="10" fill="#2d2840" transform="rotate(-20 63 44)" />
  <Eyes x={50} y={44} dx={13} color="#fff" spark={O} /><ellipse cx="50" cy="53" rx="4.5" ry="3.2" fill="#2d2840" /><Smile x={50} y={57} open={false} /><Cheeks x={50} y={55} dx={21} /><Shine x={38} y={30} />
  <path d="M34 66 Q50 72 66 66" stroke="#7bc47f" strokeWidth="5" fill="none" strokeLinecap="round" /></g>;
const Hedgehog = () => <g><Shadow />
  <path d="M14 62 L8 50 L18 50 L12 36 L24 42 L24 26 L36 36 L42 20 L50 34 L58 20 L64 36 L76 26 L76 42 L88 36 L82 50 L92 50 L86 62 Q84 84 50 86 Q16 84 14 62Z" fill="#8a5a3c" {...W} />
  <ellipse cx="50" cy="64" rx="24" ry="22" fill="#f6d7b0" {...W} /><circle cx="30" cy="48" r="7" fill="#f6d7b0" {...W} /><circle cx="70" cy="48" r="7" fill="#f6d7b0" {...W} />
  <Face x={50} y={58} s={0.95} dx={10} /><ellipse cx="50" cy="66" rx="3.6" ry="2.6" fill={O} /><Shine x={38} y={30} rx={6} /></g>;
const Fox = () => <g><Shadow />
  <path d="M30 70 Q50 96 70 70 L66 84 Q50 92 34 84Z" fill="#fff" {...W} strokeWidth="1.6" /><path d="M72 78 Q96 70 92 50 Q84 62 70 66Z" fill="#f08a3c" {...W} /><path d="M92 50 Q88 58 84 60 Q88 52 92 50Z" fill="#fff" />
  <path d="M16 18 L32 36 L14 44Z" fill="#f08a3c" {...W} /><path d="M84 18 L68 36 L86 44Z" fill="#f08a3c" {...W} /><path d="M20 26 L28 34 L20 38Z" fill="#3d3550" opacity=".8" />
  <path d="M12 52 Q14 30 50 28 Q86 30 88 52 Q84 76 50 80 Q16 76 12 52Z" fill="#f08a3c" {...W} />
  <path d="M12 54 Q30 52 50 70 Q70 52 88 54 Q84 76 50 82 Q16 76 12 54Z" fill="#fff" />
  <Face x={50} y={50} dx={12} open={false} /><ellipse cx="50" cy="60" rx="4" ry="3" fill={O} /><Shine x={34} y={36} /></g>;
const Turtle = ({ shell = '#4caf7a', head = '#8fd694', gold = false }) => <g><Shadow />
  <ellipse cx="28" cy="86" rx="9" ry="6" fill={head} {...W} /><ellipse cx="72" cy="86" rx="9" ry="6" fill={head} {...W} />
  <path d="M14 78 Q14 42 50 42 Q86 42 86 78Z" fill={shell} {...W} />
  <path d="M50 42 V78 M28 52 L36 78 M72 52 L64 78 M20 66 H80" stroke={O} strokeWidth="1.6" opacity=".55" fill="none" />
  <circle cx="50" cy="30" r="17" fill={head} {...W} /><Face x={50} y={28} s={0.9} dx={8} /><Shine x={42} y={20} rx={5} ry={3} />
  {gold && <Crown y={8} />}</g>;
const Lion = () => <g><Shadow />
  <circle cx="50" cy="50" r="38" fill="#e0872d" {...W} />{[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((a) => <circle key={a} cx={50 + Math.cos((a * Math.PI) / 180) * 36} cy={50 + Math.sin((a * Math.PI) / 180) * 36} r="9" fill="#e0872d" {...W} />)}
  <circle cx="50" cy="50" r="30" fill="#e0872d" /><circle cx="26" cy="30" r="8" fill="#ffd27a" {...W} /><circle cx="74" cy="30" r="8" fill="#ffd27a" {...W} />
  <circle cx="50" cy="52" r="24" fill="#ffd27a" {...W} /><Face x={50} y={48} dx={10} open={false} /><path d="M46 58 L54 58 L50 63Z" fill="#c2385a" {...W} strokeWidth="1.4" /><Crown y={10} /></g>;
const Dolphin = ({ body = '#4ea8de', belly = '#dff3ff', gold = false }) => <g><Shadow />
  {gold && <g>{[[18, 28], [84, 24], [80, 80]].map(([x, y], i) => <Sparkle key={i} x={x} y={y} />)}</g>}
  <path d="M16 70 Q4 54 10 40 Q22 52 32 60Z" fill={body} {...W} />
  <path d="M30 36 Q34 18 48 14 Q44 30 50 38Z" fill={body} {...W} />
  <path d="M14 66 Q16 30 54 30 Q84 30 90 56 Q92 64 82 64 Q72 62 64 66 Q50 90 24 78Z" fill={body} {...W} />
  <path d="M30 78 Q52 86 64 66 Q74 62 82 64 Q70 80 50 84Z" fill={belly} /><ellipse cx="80" cy="60" rx="9" ry="4.5" fill={body} {...W} strokeWidth="1.6" />
  <path d="M46 68 Q58 82 70 74 Q60 68 46 68Z" fill={body} {...W} strokeWidth="1.6" /><Face x={60} y={48} s={0.85} dx={8} open={false} /><Shine x={40} y={40} />
  {gold && <Crown x={46} y={10} />}</g>;
function Butterfly({ wings = ['#ff9ecf', '#c9a7ff'], gold = false, rainbow = false, baby = false, rising = false }) {
  const [a, b] = wings; const rb = ['#ff6b6b', '#ffb347', '#ffe66d', '#7bd88f', '#6bb8ff', '#b388ff'];
  return <g><Shadow />
    <g transform={baby ? 'translate(50 52) scale(.8) translate(-50 -52)' : undefined}>
      <ellipse cx="27" cy="34" rx="22" ry="20" fill={rainbow ? rb[0] : a} {...W} transform="rotate(-20 27 34)" /><ellipse cx="73" cy="34" rx="22" ry="20" fill={rainbow ? rb[4] : a} {...W} transform="rotate(20 73 34)" />
      <ellipse cx="30" cy="66" rx="17" ry="15" fill={rainbow ? rb[2] : b} {...W} transform="rotate(20 30 66)" /><ellipse cx="70" cy="66" rx="17" ry="15" fill={rainbow ? rb[3] : b} {...W} transform="rotate(-20 70 66)" />
      {rainbow && <g opacity=".7"><circle cx="24" cy="32" r="6" fill={rb[1]} /><circle cx="76" cy="32" r="6" fill={rb[5]} /></g>}
      {gold && <g><circle cx="24" cy="32" r="5" fill="#fff6c9" /><circle cx="76" cy="32" r="5" fill="#fff6c9" /><circle cx="30" cy="66" r="4" fill="#fff6c9" /><circle cx="70" cy="66" r="4" fill="#fff6c9" /></g>}
      <ellipse cx="50" cy="58" rx="8" ry="25" fill={gold ? '#d99a1a' : '#5b4a7a'} {...W} />
      <path d="M44 28 Q38 14 32 12 M56 28 Q62 14 68 12" stroke={O} strokeWidth="2" fill="none" strokeLinecap="round" /><circle cx="32" cy="12" r="2.4" fill={O} /><circle cx="68" cy="12" r="2.4" fill={O} />
      <circle cx="50" cy="34" r="11" fill={gold ? '#f6c744' : '#7a63a6'} {...W} /><Face x={50} y={33} s={0.62} dx={8} cheeks={false} open={false} eye="#fff" spark={O} />
    </g>
    {gold && <Crown y={4} />}
    {rising && <g {...W} strokeWidth="1.6"><path d="M86 70 V50 M80 56 L86 48 L92 56" stroke="#2fb67f" strokeWidth="3" fill="none" /></g>}</g>;
}
const Caterpillar = () => <g><Shadow />
  {[[18, 78], [32, 70], [46, 66], [60, 68], [74, 74]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11 - i * 0.2} fill={i % 2 ? '#a3e08a' : '#7bd05f'} {...W} />)}
  <circle cx="82" cy="52" r="16" fill="#8fe06b" {...W} /><Face x={82} y={50} s={0.85} dx={8} open={false} />
  <path d="M76 38 Q72 26 66 24 M88 38 Q92 26 98 24" stroke={O} strokeWidth="2" fill="none" /><circle cx="66" cy="24" r="2.5" fill="#ff8fab" {...W} strokeWidth="1" /><circle cx="98" cy="24" r="2.5" fill="#ff8fab" {...W} strokeWidth="1" /></g>;

/* ── sweets ─────────────────────────────────────────────────────────────── */
const Cookie = () => <g><Shadow /><circle cx="50" cy="52" r="36" fill="#e3a85c" {...W} />{[[30, 32], [66, 30], [76, 56], [64, 78], [30, 74], [22, 54]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="5.5" ry="4" fill="#6b3f26" transform={`rotate(${i * 40} ${x} ${y})`} />)}<Shine x={34} y={30} /><Face x={50} y={50} dx={11} /></g>;
const ChocoStar = () => <g><Shadow /><polygon points={star5(50, 52, 42, 22)} fill="#7a4a2e" {...W} /><polygon points={star5(50, 52, 34, 17)} fill="#93603b" /><path d="M50 22 V80 M26 40 L74 40" stroke="#6a3f27" strokeWidth="1.4" opacity=".6" /><Shine x={40} y={36} rx={5} /><Face x={50} y={54} s={0.9} dx={9} /></g>;
const Donut = () => <g><Shadow />
  <rect x="12" y="38" width="76" height="44" rx="22" fill="#e8b27a" {...W} /><path d="M12 56 Q12 36 34 38 Q50 30 66 38 Q88 36 88 56 Q80 52 74 60 Q66 52 58 62 Q50 52 42 62 Q34 52 26 60 Q18 52 12 56Z" fill="#ff8fc7" {...W} />
  {[[28, 46, 20], [48, 42, 80], [68, 46, 140], [78, 54, 10], [20, 56, 60]].map(([x, y, r], i) => <rect key={i} x={x} y={y} width="7" height="2.8" rx="1.4" fill={['#ffe66d', '#6bb8ff', '#7bd88f', '#fff', '#ff6b6b'][i]} transform={`rotate(${r} ${x} ${y})`} />)}
  <Face x={50} y={64} s={0.8} dx={9} cheeks={false} /><Crown y={20} /></g>;
const Gummy = () => <g><Shadow />
  <circle cx="30" cy="20" r="9" fill="#ff5c7a" {...W} /><circle cx="70" cy="20" r="9" fill="#ff5c7a" {...W} />
  <ellipse cx="22" cy="62" rx="8" ry="12" fill="#ff5c7a" {...W} transform="rotate(30 22 62)" /><ellipse cx="78" cy="62" rx="8" ry="12" fill="#ff5c7a" {...W} transform="rotate(-30 78 62)" />
  <ellipse cx="50" cy="66" rx="23" ry="24" fill="#ff5c7a" {...W} /><ellipse cx="36" cy="88" rx="9" ry="7" fill="#ff5c7a" {...W} /><ellipse cx="64" cy="88" rx="9" ry="7" fill="#ff5c7a" {...W} />
  <circle cx="50" cy="36" r="21" fill="#ff5c7a" {...W} /><Shine x={40} y={24} rx={6} /><Shine x={38} y={60} rx={5} ry={9} rot={10} /><Face x={50} y={36} s={0.9} dx={9} /><ellipse cx="50" cy="45" rx="4" ry="3" fill="#ffd0da" {...W} strokeWidth="1.2" /></g>;
const IceCream = () => <g><Shadow />
  <path d="M30 56 L50 94 L70 56Z" fill="#e8b27a" {...W} /><path d="M36 62 L64 62 M40 72 L60 72 M44 82 L56 82" stroke="#c8873f" strokeWidth="1.4" />
  <circle cx="34" cy="52" r="13" fill="#ffd0e6" {...W} /><circle cx="66" cy="52" r="13" fill="#d0f0ff" {...W} /><circle cx="50" cy="40" r="19" fill="#fff0c9" {...W} />
  <Shine x={42} y={30} rx={6} /><Face x={50} y={42} s={0.9} dx={9} /><circle cx="50" cy="19" r="6" fill="#ef4444" {...W} /><path d="M50 14 Q52 6 58 4" stroke="#3b8a4a" strokeWidth="2" fill="none" />
  <Crown y={6} x={34} c="#cfe9ff" /></g>;
const Cupcake = () => <g><Shadow />
  <path d="M22 54 L30 90 H70 L78 54Z" fill="#f6c744" {...W} /><path d="M36 58 L38 88 M50 58 V88 M64 58 L62 88" stroke="#d99a1a" strokeWidth="1.6" />
  <ellipse cx="50" cy="52" rx="32" ry="12" fill="#ffd0e6" {...W} /><ellipse cx="50" cy="40" rx="24" ry="11" fill="#ffb3d4" {...W} /><ellipse cx="50" cy="29" rx="15" ry="9" fill="#ff93c0" {...W} />
  <circle cx="50" cy="17" r="5.5" fill="#ef4444" {...W} /><Face x={50} y={45} s={0.75} dx={9} cheeks={false} /><Sparkle x={20} y={22} /><Sparkle x={82} y={30} /><Sparkle x={74} y={12} r={3} /></g>;

/* ── magic ──────────────────────────────────────────────────────────────── */
const Unicorn = () => <g><Shadow />
  {['#ff6b6b', '#ffb347', '#ffe66d', '#7bd88f', '#6bb8ff'].map((c, i) => <circle key={c} cx={76 + (i % 2) * 6} cy={30 + i * 11} r="9" fill={c} {...W} />)}
  <path d="M30 10 L38 34 L24 30Z" fill="#fff6c9" {...W} /><path d="M45 6 L52 32 L38 30Z" fill="#ffd93d" {...W} />
  <path d="M26 28 L32 6 L44 26Z" fill="#fff" {...W} /><path d="M52 24 L62 6 L68 30Z" fill="#fff" {...W} />
  <ellipse cx="46" cy="56" rx="30" ry="28" fill="#fff" {...W} /><ellipse cx="56" cy="70" rx="22" ry="16" fill="#ffe0ef" {...W} />
  <Face x={42} y={50} dx={10} open={false} /><circle cx="52" cy="70" r="1.8" fill={O} /><circle cx="62" cy="70" r="1.8" fill={O} /><Shine x={30} y={38} /><Sparkle x={14} y={20} /><Sparkle x={88} y={14} r={3} /></g>;
const Dragon = ({ body = '#5fcf80', belly = '#e8ffd9', gold = false }) => <g><Shadow />
  <path d="M10 24 Q14 8 30 18Z" fill={gold ? '#f6c744' : '#9be39b'} {...W} /><path d="M90 24 Q86 8 70 18Z" fill={gold ? '#f6c744' : '#9be39b'} {...W} />
  <path d="M80 80 Q100 70 94 54 Q88 62 78 64Z" fill={body} {...W} /><path d="M16 56 Q2 40 12 28 Q22 42 30 48Z" fill={gold ? '#ffd93d' : '#8bdc9f'} {...W} /><path d="M84 56 Q98 40 88 28 Q78 42 70 48Z" fill={gold ? '#ffd93d' : '#8bdc9f'} {...W} />
  <ellipse cx="50" cy="74" rx="24" ry="20" fill={body} {...W} /><ellipse cx="50" cy="78" rx="14" ry="14" fill={belly} />
  <path d="M30 28 L36 10 L44 24Z" fill="#ffd93d" {...W} /><path d="M70 28 L64 10 L56 24Z" fill="#ffd93d" {...W} />
  <circle cx="50" cy="44" r="25" fill={body} {...W} /><Shine x={38} y={30} /><Face x={50} y={42} dx={11} /><circle cx="44" cy="52" r="1.6" fill={O} /><circle cx="56" cy="52" r="1.6" fill={O} />
  {gold && <g><Crown y={4} /><Sparkle x={86} y={84} /><Sparkle x={12} y={80} /></g>}</g>;
const ShootingStar = () => <g><Shadow />
  <path d="M6 30 L40 44 M2 52 L34 52 M10 72 L40 60" stroke="#ffe66d" strokeWidth="5" strokeLinecap="round" opacity=".7" />
  <polygon points={star5(60, 52, 36, 18)} fill="#ffd93d" {...W} /><Shine x={52} y={38} rx={5} /><Face x={60} y={54} s={0.85} dx={8} /><Sparkle x={88} y={18} /><Sparkle x={20} y={14} r={3} /></g>;
const Fairy = () => <g><Shadow />
  <ellipse cx="22" cy="46" rx="16" ry="22" fill="#cfeaff" fillOpacity=".8" {...W} transform="rotate(-25 22 46)" /><ellipse cx="78" cy="46" rx="16" ry="22" fill="#e9d5ff" fillOpacity=".8" {...W} transform="rotate(25 78 46)" />
  <path d="M34 62 L26 90 H74 L66 62Z" fill="#ff9ecf" {...W} /><path d="M30 80 L36 90 M50 78 V90 M70 80 L64 90" stroke="#fff" strokeWidth="1.5" opacity=".7" />
  <circle cx="50" cy="18" r="9" fill="#a56bd6" {...W} /><circle cx="50" cy="42" r="21" fill="#ffe3cf" {...W} /><path d="M29 38 Q50 14 71 38 Q60 28 50 30 Q40 28 29 38Z" fill="#a56bd6" {...W} />
  <Face x={50} y={44} s={0.85} dx={9} /><path d="M72 66 L84 54" stroke="#8b6f47" strokeWidth="3" strokeLinecap="round" /><polygon points={star5(86, 50, 8, 3.6)} fill="#ffd93d" {...W} strokeWidth="1.2" /><Sparkle x={14} y={20} /></g>;
const Princess = () => <g><Shadow />
  <path d="M32 60 L18 92 H82 L68 60Z" fill="#9ed8ff" {...W} /><path d="M30 78 H70" stroke="#fff" strokeWidth="2" strokeDasharray="3 4" /><path d="M50 62 V78 M44 70 H56" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  <path d="M22 44 Q20 74 30 82 L36 52Z" fill="#d6f0ff" {...W} /><path d="M78 44 Q80 74 70 82 L64 52Z" fill="#d6f0ff" {...W} />
  <circle cx="50" cy="44" r="21" fill="#ffe3cf" {...W} /><path d="M27 44 Q28 18 50 20 Q72 18 73 44 Q66 30 50 32 Q34 30 27 44Z" fill="#e8f6ff" {...W} />
  <Face x={50} y={46} s={0.85} dx={9} /><g {...W}><path d="M38 22 L42 12 L46 20 L50 8 L54 20 L58 12 L62 22Z" fill="#cfe9ff" /><circle cx="50" cy="12" r="2" fill="#7cc4ff" strokeWidth="1" /></g><Sparkle x={16} y={24} c="#cfe9ff" /><Sparkle x={86} y={30} c="#cfe9ff" r={3} /></g>;
const Phoenix = () => <g><Shadow />
  <path d="M50 96 Q30 80 38 60 Q30 74 14 70 Q22 88 50 96Z" fill="#ff6b3d" {...W} /><path d="M50 96 Q70 80 62 60 Q70 74 86 70 Q78 88 50 96Z" fill="#ff6b3d" {...W} />
  <path d="M50 92 Q44 76 50 62 Q56 76 50 92Z" fill="#ffd93d" {...W} />
  <path d="M30 56 Q4 54 8 28 Q22 38 32 44Z" fill="#ff8a3d" {...W} /><path d="M70 56 Q96 54 92 28 Q78 38 68 44Z" fill="#ff8a3d" {...W} />
  <ellipse cx="50" cy="56" rx="22" ry="26" fill="#ffb02e" {...W} /><path d="M40 12 Q44 24 50 20 Q56 24 60 12 Q60 26 50 30 Q40 26 40 12Z" fill="#ff5252" {...W} />
  <circle cx="50" cy="40" r="17" fill="#ffc94d" {...W} /><Face x={50} y={38} s={0.8} dx={8} open={false} /><path d="M46 46 L54 46 L50 52Z" fill="#ff6b3d" {...W} strokeWidth="1.4" /><Shine x={42} y={30} rx={5} /><Sparkle x={86} y={10} /></g>;

/* ── adventure ─────────────────────────────────────────────────────────── */
function Kid({ hat, skin = '#ffd9b8', hair = '#6b4226', extra = null, shirt = '#5dade2' }) {
  return <g><Shadow />
    <path d="M26 96 Q26 66 50 64 Q74 66 74 96Z" fill={shirt} {...W} /><circle cx="50" cy="42" r="23" fill={skin} {...W} />
    <path d="M27 40 Q28 20 50 20 Q72 20 73 40 Q64 28 50 28 Q36 28 27 40Z" fill={hair} {...W} />
    <Face x={50} y={46} s={0.9} dx={9} />{hat}{extra}</g>;
}
const Explorer = () => <Kid hat={<ExplorerHat y={22} />} extra={<g {...W}><rect x="68" y="66" width="14" height="20" rx="4" fill="#e67e22" /></g>} />;
const Treasure = () => <g><Shadow />
  <rect x="14" y="48" width="72" height="42" rx="6" fill="#a8693c" {...W} /><path d="M14 52 Q14 22 50 22 Q86 22 86 52Z" fill="#c07d48" {...W} />
  <path d="M14 56 H86 M32 22 V90 M68 22 V90" stroke="#ffd93d" strokeWidth="5" opacity=".95" /><rect x="43" y="52" width="14" height="14" rx="3" fill="#ffd93d" {...W} />
  <Face x={50} y={38} s={0.8} dx={9} cheeks={false} /><Sparkle x={14} y={14} /><Sparkle x={88} y={22} r={3} /><circle cx="84" cy="12" r="4" fill="#ffd93d" {...W} strokeWidth="1.2" /></g>;
const Jungle = () => <Kid skin="#e9b98a" hair="#2e2a24" shirt="#6ab04c" hat={<g {...W}><path d="M26 30 Q50 6 74 30 Q50 24 26 30Z" fill="#4a8f3c" /><path d="M50 8 Q58 -2 66 4 Q58 8 50 8Z" fill="#7bd05f" /></g>} extra={<path d="M24 70 Q10 74 12 88" stroke="#3b8a4a" strokeWidth="4" fill="none" strokeLinecap="round" />} />;
const MapMaster = () => <g><Shadow />
  <rect x="16" y="26" width="68" height="58" rx="6" fill="#f6e3b4" {...W} /><rect x="10" y="22" width="12" height="66" rx="6" fill="#d9b66a" {...W} /><rect x="78" y="22" width="12" height="66" rx="6" fill="#d9b66a" {...W} />
  <path d="M28 70 Q40 52 52 62 T74 44" stroke="#c2385a" strokeWidth="2.4" strokeDasharray="4 4" fill="none" strokeLinecap="round" /><path d="M70 40 l8 8 m0 -8 l-8 8" stroke="#c2385a" strokeWidth="3.4" strokeLinecap="round" />
  <path d="M26 36 l6 6 l8 -8" stroke="#4a8f3c" strokeWidth="0" /><Face x={44} y={44} s={0.8} dx={8} open={false} /></g>;
const Champion = () => <g><Shadow />
  <path d="M26 24 H74 V44 Q74 66 50 70 Q26 66 26 44Z" fill="#ffd93d" {...W} /><path d="M26 30 Q10 30 12 44 Q14 54 28 54 M74 30 Q90 30 88 44 Q86 54 72 54" fill="none" stroke={O} strokeWidth="5" strokeLinecap="round" /><path d="M26 30 Q10 30 12 44 Q14 54 28 54 M74 30 Q90 30 88 44 Q86 54 72 54" fill="none" stroke="#ffd93d" strokeWidth="2.4" strokeLinecap="round" />
  <rect x="44" y="70" width="12" height="12" fill="#e5a916" {...W} /><rect x="30" y="82" width="40" height="10" rx="4" fill="#8b5cf6" {...W} />
  <Face x={50} y={44} s={0.85} dx={9} /><Shine x={36} y={32} rx={5} /><Sparkle x={86} y={16} /><Sparkle x={12} y={20} r={3} /></g>;

/* ── space ─────────────────────────────────────────────────────────────── */
const Astronaut = () => <g><Shadow />
  <rect x="22" y="62" width="56" height="30" rx="14" fill="#f5f7ff" {...W} /><rect x="42" y="70" width="16" height="10" rx="3" fill="#7cc4ff" {...W} strokeWidth="1.4" /><circle cx="26" cy="72" r="7" fill="#fff" {...W} /><circle cx="74" cy="72" r="7" fill="#fff" {...W} />
  <circle cx="50" cy="38" r="31" fill="#f5f7ff" {...W} /><ellipse cx="50" cy="40" rx="23" ry="19" fill="#2a3b8f" {...W} /><Face x={50} y={40} s={0.85} dx={9} eye="#fff" spark={O} cheeks={false} />
  <Shine x={36} y={28} rx={6} /><circle cx="50" cy="8" r="3" fill="#ef4444" {...W} strokeWidth="1.2" /><Sparkle x={90} y={14} /></g>;
const Planet = () => <g><Shadow />
  <path d="M8 64 Q50 90 92 50" stroke={O} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0" />
  <circle cx="50" cy="50" r="30" fill="#ffa94d" {...W} /><path d="M24 36 Q50 28 76 38 M22 62 Q50 72 78 62" stroke="#ff8a3d" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7" />
  <ellipse cx="50" cy="56" rx="46" ry="11" fill="none" stroke={O} strokeWidth="9" transform="rotate(-18 50 56)" /><ellipse cx="50" cy="56" rx="46" ry="11" fill="none" stroke="#7cc4ff" strokeWidth="5" transform="rotate(-18 50 56)" />
  <circle cx="50" cy="50" r="30" fill="none" /><path d="M24 50 A30 30 0 0 1 76 50" fill="#ffa94d" opacity="0" /><Face x={50} y={44} s={0.9} dx={9} /><Shine x={38} y={32} rx={6} /></g>;
const Rocket = () => <g><Shadow />
  <path d="M38 70 Q50 100 62 70Z" fill="#ffd93d" {...W} /><path d="M44 72 Q50 88 56 72Z" fill="#ff8a3d" />
  <path d="M30 56 L14 78 L34 72Z" fill="#ef4444" {...W} /><path d="M70 56 L86 78 L66 72Z" fill="#ef4444" {...W} />
  <path d="M50 4 Q74 22 70 66 H30 Q26 22 50 4Z" fill="#fff" {...W} /><path d="M50 4 Q64 12 68 30 H32 Q36 12 50 4Z" fill="#ef4444" {...W} />
  <circle cx="50" cy="46" r="13" fill="#7cc4ff" {...W} /><Face x={50} y={46} s={0.62} dx={7} eye={O} cheeks={false} open={false} /><Sparkle x={86} y={22} /><Sparkle x={12} y={34} r={3} /></g>;
const Alien = () => <g><Shadow />
  <path d="M38 74 Q50 98 62 74Z" fill="#7bd88f" {...W} /><path d="M36 22 Q30 8 22 8 M64 22 Q70 8 78 8" stroke={O} strokeWidth="2.4" fill="none" /><circle cx="22" cy="8" r="4.4" fill="#ff6bd6" {...W} strokeWidth="1.4" /><circle cx="78" cy="8" r="4.4" fill="#ff6bd6" {...W} strokeWidth="1.4" />
  <path d="M12 44 Q12 18 50 18 Q88 18 88 44 Q88 78 50 80 Q12 78 12 44Z" fill="#8be07b" {...W} /><Shine x={32} y={32} rx={7} />
  <ellipse cx="34" cy="46" rx="9" ry="12" fill={O} transform="rotate(12 34 46)" /><ellipse cx="66" cy="46" rx="9" ry="12" fill={O} transform="rotate(-12 66 46)" /><circle cx="37" cy="41" r="3" fill="#fff" /><circle cx="69" cy="41" r="3" fill="#fff" />
  <Smile x={50} y={64} open={true} s={1.1} /><Cheeks x={50} y={60} dx={25} /></g>;
const Guardian = () => <g><Shadow />
  <path d="M50 6 L86 18 V52 Q86 78 50 94 Q14 78 14 52 V18Z" fill="#7c5cdb" {...W} /><path d="M50 14 L78 24 V52 Q78 72 50 86 Q22 72 22 52 V24Z" fill="#a78bfa" />
  <polygon points={star5(50, 40, 14, 6.5)} fill="#ffd93d" {...W} strokeWidth="1.4" /><Face x={50} y={62} s={0.8} dx={9} eye="#fff" spark={O} /><Sparkle x={10} y={12} /><Sparkle x={90} y={10} r={3} /></g>;

/* ── learning ──────────────────────────────────────────────────────────── */
const Ninja = () => <g><Shadow />
  <path d="M26 96 Q26 68 50 66 Q74 68 74 96Z" fill="#2d3a6b" {...W} /><circle cx="50" cy="42" r="26" fill="#2d3a6b" {...W} /><path d="M26 42 Q50 30 74 42 L74 56 Q50 66 26 56Z" fill="#ffd9b8" {...W} />
  <Eyes x={50} y={47} s={0.95} dx={10} /><Cheeks x={50} y={53} dx={17} /><path d="M24 30 Q50 22 76 30 L76 38 Q50 30 24 38Z" fill="#ef4444" {...W} />
  <path d="M74 32 Q92 22 96 34 M74 34 Q94 36 92 48" stroke="#ef4444" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M44 31 h12 M50 25 v12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></g>;
const Wizard = ({ robe = '#6d4bd6', star = '#ffd93d' }) => <g><Shadow />
  <path d="M24 96 Q26 66 50 64 Q74 66 76 96Z" fill={robe} {...W} /><circle cx="50" cy="48" r="20" fill="#ffe3cf" {...W} />
  <path d="M32 54 Q50 96 68 54 Q50 66 32 54Z" fill="#fff" {...W} /><Face x={50} y={46} s={0.85} dx={9} />
  <path d="M26 38 Q50 30 74 38 L56 -2Z" fill={robe} {...W} /><path d="M20 40 Q50 32 80 40 L78 46 Q50 38 22 46Z" fill={robe} {...W} /><polygon points={star5(52, 20, 7, 3.2)} fill={star} {...W} strokeWidth="1.2" /><Sparkle x={84} y={62} /></g>;
const ShapeMaster = () => <g><Shadow />
  <polygon points="50,6 78,46 22,46" fill="#ff8a8a" {...W} /><rect x="20" y="46" width="60" height="42" rx="6" fill="#6bc6ff" {...W} /><circle cx="80" cy="76" r="14" fill="#ffd93d" {...W} />
  <Face x={50} y={64} s={0.85} dx={10} /><Shine x={34} y={58} rx={5} /></g>;
const Scientist = () => <g><Shadow />
  <path d="M40 8 H60 V38 L82 82 Q86 94 72 94 H28 Q14 94 18 82 L40 38Z" fill="#dff7ff" fillOpacity=".85" {...W} /><path d="M26 66 H74 L82 82 Q86 94 72 94 H28 Q14 94 18 82Z" fill="#6ee7a7" opacity=".9" />
  <rect x="36" y="4" width="28" height="8" rx="4" fill="#d9b66a" {...W} /><circle cx="32" cy="58" r="3.4" fill="#fff" opacity=".8" /><circle cx="68" cy="52" r="2.6" fill="#fff" opacity=".8" />
  <g fill="none" stroke={O} strokeWidth="1.6"><circle cx="40" cy="70" r="6" fill="#fff" fillOpacity=".5" /><circle cx="60" cy="70" r="6" fill="#fff" fillOpacity=".5" /><path d="M46 70 H54" /></g><Eyes x={50} y={70} s={0.7} dx={10} /><Smile x={50} y={80} open={true} s={0.9} /></g>;
const Nature = () => <g><Shadow />
  <path d="M50 70 Q20 62 22 30 Q50 34 50 70Z" fill="#6bd08a" {...W} /><path d="M50 70 Q80 62 78 30 Q50 34 50 70Z" fill="#4cbf74" {...W} /><path d="M50 70 V44" stroke={O} strokeWidth="2.4" />
  <path d="M26 74 L32 94 H68 L74 74Z" fill="#c8794a" {...W} /><ellipse cx="50" cy="74" rx="24" ry="6" fill="#8b5a3c" {...W} />
  <circle cx="50" cy="40" r="15" fill="#fff3c9" {...W} /><Face x={50} y={40} s={0.78} dx={8} /><Sparkle x={86} y={14} c="#8be07b" /></g>;
const Genius = () => <g><Shadow />
  {[[50, 2, 50, 12], [14, 16, 22, 24], [86, 16, 78, 24], [4, 46, 14, 46], [96, 46, 86, 46]].map(([a, b, c, d], i) => <path key={i} d={`M${a} ${b} L${c} ${d}`} stroke="#ffd93d" strokeWidth="4" strokeLinecap="round" />)}
  <path d="M50 14 Q82 14 82 44 Q82 58 68 68 V78 H32 V68 Q18 58 18 44 Q18 14 50 14Z" fill="#fff0a3" {...W} /><rect x="32" y="78" width="36" height="14" rx="5" fill="#9aa5b8" {...W} /><path d="M34 84 H66" stroke={O} strokeWidth="1.4" />
  <Face x={50} y={44} s={0.95} dx={10} /><Shine x={36} y={30} rx={6} /><g fill="none" stroke={O} strokeWidth="1.6"><circle cx="40" cy="43" r="6.5" /><circle cx="60" cy="43" r="6.5" /><path d="M46.5 43 h7" /></g></g>;
const WordWizard = () => <g><Shadow />
  <path d="M10 34 Q30 26 50 36 Q70 26 90 34 V84 Q70 76 50 86 Q30 76 10 84Z" fill="#a78bfa" {...W} /><path d="M50 36 V86" stroke={O} strokeWidth="2" /><path d="M16 40 Q30 36 46 42 V80 Q30 74 16 78Z" fill="#fff" /><path d="M84 40 Q70 36 54 42 V80 Q70 74 84 78Z" fill="#fff" />
  <path d="M24 52 H40 M24 60 H38 M60 52 H76 M62 60 H74" stroke="#c4b5fd" strokeWidth="2.4" strokeLinecap="round" />
  <path d="M30 28 Q50 20 70 28 L52 -2Z" fill="#6d4bd6" {...W} /><polygon points={star5(52, 14, 6, 2.8)} fill="#ffd93d" {...W} strokeWidth="1.1" /><Face x={50} y={68} s={0.7} dx={8} cheeks={false} open={false} /></g>;
const Grammar = () => <g><Shadow />
  <path d="M50 6 L84 18 V50 Q84 76 50 92 Q16 76 16 50 V18Z" fill="#4ea8de" {...W} /><path d="M50 14 L76 24 V50 Q76 70 50 84 Q24 70 24 50 V24Z" fill="#bfe3ff" />
  <path d="M60 18 Q84 10 90 30 Q76 28 66 40Z" fill="#ff8fab" {...W} /><path d="M66 40 L56 52" stroke={O} strokeWidth="2.4" strokeLinecap="round" /><Face x={46} y={52} s={0.85} dx={9} /></g>;
const Vocab = () => <g><Shadow />
  <path d="M12 44 Q30 38 50 46 Q70 38 88 44 V86 Q70 80 50 88 Q30 80 12 86Z" fill="#ff8a5c" {...W} /><path d="M50 46 V88" stroke={O} strokeWidth="2" /><path d="M18 48 Q32 44 46 50 V82 Q32 78 18 82Z" fill="#fff6e8" /><path d="M82 48 Q68 44 54 50 V82 Q68 78 82 82Z" fill="#fff6e8" />
  <Crown y={22} /><Face x={50} y={66} s={0.75} dx={8} cheeks={false} open={false} /><Sparkle x={10} y={20} /><Sparkle x={90} y={22} r={3} /></g>;

/* ── game masters & teacher ────────────────────────────────────────────── */
const QuizRookie = () => <g><Shadow />
  <path d="M16 22 Q16 10 28 10 H72 Q84 10 84 22 V58 Q84 70 72 70 H58 L46 88 V70 H28 Q16 70 16 58Z" fill="#ffb347" {...W} />
  <path d="M43 24 Q43 17 50 17 Q58 17 58 23 Q58 28 52 31 V34" stroke={O} strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="52" cy="39" r="2.2" fill={O} />
  <Face x={50} y={50} s={0.72} dx={10} open={false} /><Shine x={28} y={22} rx={6} /><Sparkle x={88} y={10} /></g>;
const SequenceStar = () => <g><Shadow />
  <rect x="12" y="74" width="24" height="18" rx="4" fill="#6bc6ff" {...W} /><rect x="38" y="60" width="24" height="32" rx="4" fill="#7bd88f" {...W} /><rect x="64" y="46" width="24" height="46" rx="4" fill="#ffb347" {...W} />
  <path d="M20 84 h8 M46 76 h8 M72 70 h8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><polygon points={star5(76, 24, 20, 10)} fill="#ffd93d" {...W} /><Face x={76} y={26} s={0.62} dx={7} /></g>;
const MatchingMaster = () => <g><Shadow />
  <path d="M10 40 Q10 20 30 20 Q44 20 46 34 L56 34 Q58 20 70 20 Q90 20 90 40 Q90 56 70 70 L50 86 L30 70 Q10 56 10 40Z" fill="#ff8fab" {...W} />
  <circle cx="30" cy="42" r="14" fill="#fff4f7" {...W} strokeWidth="1.6" /><circle cx="70" cy="42" r="14" fill="#fff4f7" {...W} strokeWidth="1.6" /><Face x={30} y={42} s={0.55} dx={8} cheeks={false} open={false} /><Face x={70} y={42} s={0.55} dx={8} cheeks={false} open={false} /><path d="M44 42 H56" stroke={O} strokeWidth="2.4" strokeDasharray="2 3" /></g>;
const CrosswordDetective = () => <g><Shadow />
  <rect x="12" y="24" width="64" height="64" rx="8" fill="#fff" {...W} />{[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={18 + c * 19} y={30 + r * 19} width="17" height="17" rx="3" fill={(r + c) % 2 ? '#dbeafe' : '#fff'} stroke={O} strokeWidth="1.3" />))}
  <path d="M26 41 h0" stroke={O} /><circle cx="68" cy="66" r="18" fill="#fff" fillOpacity=".72" {...W} /><path d="M82 80 L94 94" stroke="#8b6f47" strokeWidth="6" strokeLinecap="round" /><Face x={68} y={66} s={0.62} dx={7} cheeks={false} open={false} />
  <DetectiveCap y={14} /></g>;
const Ultimate = () => <g><Shadow />
  <rect x="8" y="42" width="84" height="44" rx="22" fill="#7c5cdb" {...W} /><path d="M26 54 v20 M16 64 h20" stroke="#fff" strokeWidth="5" strokeLinecap="round" /><circle cx="72" cy="58" r="5" fill="#ff6b6b" {...W} strokeWidth="1.4" /><circle cx="82" cy="68" r="5" fill="#ffd93d" {...W} strokeWidth="1.4" />
  <Face x={50} y={62} s={0.85} dx={8} eye="#fff" spark={O} /><Crown y={20} /><Sparkle x={10} y={20} /><Sparkle x={90} y={18} /><Sparkle x={50} y={4} r={3} /></g>;
const HelpfulHero = () => <g><Shadow /><Cape c="#4ea8de" />
  <path d="M50 88 Q10 62 12 36 Q14 18 32 18 Q46 18 50 32 Q54 18 68 18 Q86 18 88 36 Q90 62 50 88Z" fill="#ff6b8b" {...W} /><Shine x={30} y={34} rx={7} /><Face x={50} y={52} dx={11} /><Sparkle x={86} y={12} /></g>;
const KindnessStar = () => <g><Shadow /><polygon points={star5(50, 52, 44, 22)} fill="#ff9ecf" {...W} /><polygon points={star5(50, 52, 34, 17)} fill="#ffc2e0" /><Shine x={38} y={36} rx={5} /><Face x={50} y={54} s={0.95} dx={9} /><path d="M14 16 q4 -6 8 0 q4 -6 8 0 q0 6 -8 10 q-8 -4 -8 -10z" fill="#ff6b8b" {...W} strokeWidth="1.2" /></g>;

const FALLBACK = () => <g><Shadow /><polygon points={star5(50, 52, 40, 20)} fill="#ffd93d" {...W} /><Face x={50} y={54} dx={9} /></g>;

const REGISTRY = {
  baby_penguin: () => <Penguin />,
  explorer_penguin: () => <Penguin body="#3d6a9a" hat={<ExplorerHat y={20} />} glasses={false} />,
  super_penguin: () => <Penguin body="#2f3e8f" cape mask medal hat={<Crown y={14} c="#ffd93d" />} />,
  panda_buddy: Panda, happy_hedgehog: Hedgehog, clever_fox: Fox,
  baby_turtle: () => <Turtle />, royal_lion: Lion, golden_dolphin: () => <Dolphin body="#f2b632" belly="#fff3c4" gold />,
  baby_butterfly: () => <Butterfly baby wings={['#ffd0e6', '#d9ecff']} />,
  rainbow_butterfly: () => <Butterfly rainbow />,
  golden_butterfly: () => <Butterfly gold wings={['#ffd45c', '#ffb02e']} />,
  rising_butterfly: () => <Butterfly rising wings={['#8ad6ff', '#8be0b4']} />,
  caterpillar_cutie: Caterpillar,
  detective_pingu: () => <Penguin body="#59627f" hat={<DetectiveCap y={20} />} glasses />,
  cookie_buddy: Cookie, choco_star: ChocoStar, donut_king: Donut, gummy_bear: Gummy, ice_cream_queen: IceCream, golden_cupcake: Cupcake,
  shooting_star: ShootingStar, fairy_butterfly: Fairy, baby_dragon: () => <Dragon />, rainbow_unicorn: Unicorn,
  ice_princess: Princess, golden_phoenix: Phoenix, golden_dragon: () => <Dragon body="#f6c744" belly="#fff3c4" gold />,
  little_explorer: Explorer, treasure_hunter: Treasure, jungle_adventurer: Jungle, map_master: MapMaster, adventure_champion: Champion,
  mini_astronaut: Astronaut, planet_buddy: Planet, rocket_racer: Rocket, space_alien: Alien, galaxy_guardian: Guardian,
  math_wizard: () => <Wizard robe="#3d8bd6" star="#ffd93d" />, shape_master: ShapeMaster, number_ninja: Ninja,
  nature_explorer: Nature, little_scientist: Scientist, science_genius: Genius,
  grammar_guardian: Grammar, word_wizard: WordWizard, vocabulary_champion: Vocab,
  quiz_rookie: QuizRookie, sequence_star: SequenceStar, matching_master: MatchingMaster, crossword_detective: CrosswordDetective, ultimate_game_master: Ultimate,
  helpful_hero: HelpfulHero, kindness_star: KindnessStar,
};

export const STICKER_ART_KEYS = Object.keys(REGISTRY);

/** `silhouette` renders the same artwork as a flat, faded shape for locked stickers (no colour spoilers). */
export default function StickerArt({ art, size = 96, silhouette = false, title }) {
  const Figure = REGISTRY[art] || FALLBACK;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      style={silhouette ? { filter: 'brightness(0) opacity(.22)' } : { filter: 'drop-shadow(0 2px 0 rgba(255,255,255,.9))' }} focusable="false">
      <Figure />
    </svg>
  );
}
