import StickerArt from './StickerArt.jsx';
import '../../styles/stickers.css';

export const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

function formatDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return iso.slice(0, 10); }
}

/** Plain-language "what is left to do" for a locked sticker. */
export function remainingText(sticker) {
  if (sticker.teacher_only) return 'Only your teacher can give you this one.';
  if (sticker.needs) return `First collect ${sticker.needs}.`;
  const p = sticker.progress;
  if (!p) return sticker.unlock_text;
  const left = Math.max(p.target - p.current, 0);
  return left === 1 ? 'Just 1 more to unlock this sticker!' : `${left} more to unlock this sticker.`;
}

/** One sticker in the album: full colour when earned, a faded silhouette + live progress when locked. */
export default function StickerCard({ sticker }) {
  const earned = sticker.earned;
  const p = sticker.progress;
  const label = earned ? `${sticker.name}, ${RARITY_LABEL[sticker.rarity]} sticker, unlocked` : `${sticker.name}, locked. ${sticker.unlock_text}`;
  return (
    <article className={`stk-frame stk-${sticker.rarity}${earned ? '' : ' stk-locked'}`} aria-label={label} data-sticker={sticker.key} data-earned={earned}>
      <div className="stk-inner">
        <StickerArt art={sticker.art} size={88} silhouette={!earned} />
        <div className="stk-name">{sticker.name}</div>
        <span className={`stk-rarity ${sticker.rarity}`}>{RARITY_LABEL[sticker.rarity]}</span>
        {earned ? (
          <>
            <div className="stk-desc">{sticker.unlock_text}</div>
            <div className="stk-desc" style={{ fontWeight: 800, color: '#238650' }}>Unlocked {formatDate(sticker.earned_at)}</div>
          </>
        ) : (
          <>
            <div className="stk-desc">{sticker.unlock_text}</div>
            {p && !sticker.needs && (
              <div style={{ width: '100%' }}>
                <div className="stk-bar" role="progressbar" aria-valuemin={0} aria-valuemax={p.target} aria-valuenow={p.current} aria-label={`${sticker.name} progress`}><span style={{ width: `${p.percent}%` }} /></div>
                <div className="stk-desc" style={{ marginTop: 3, fontWeight: 800 }}>{p.current}/{p.target}</div>
              </div>
            )}
            <div className="stk-desc" style={{ fontWeight: 800, color: '#147d81' }}>{remainingText(sticker)}</div>
          </>
        )}
      </div>
    </article>
  );
}
