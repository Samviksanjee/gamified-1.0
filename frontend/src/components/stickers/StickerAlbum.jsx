import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import StickerArt from './StickerArt.jsx';
import StickerCard from './StickerCard.jsx';
import '../../styles/stickers.css';

/** Evolution strip: every stage of a character, what is owned, and progress towards the next one. */
function EvolutionStrip({ family, stickers }) {
  const stages = stickers.filter((s) => s.family === family).sort((a, b) => a.stage - b.stage);
  if (stages.length < 2) return null;
  const next = stages.find((s) => !s.earned && !s.needs);
  return (
    <section className="stk-evo" aria-label={`${family} evolution`}>
      {stages.map((s, i) => (
        <span key={s.key} style={{ display: 'contents' }}>
          {i > 0 && <span className="stk-evo-arrow" aria-hidden="true">→</span>}
          <span className="stk-evo-step">
            <StickerArt art={s.art} size={56} silhouette={!s.earned} />
            <span>Stage {s.stage}</span>
            <span style={{ color: s.earned ? '#238650' : '#688097' }}>{s.earned ? 'Unlocked' : s.needs ? 'Locked' : 'Next!'}</span>
          </span>
        </span>
      ))}
      {next?.progress && (
        <span style={{ flex: '1 1 160px', fontSize: 12, fontWeight: 800, color: '#5b21b6' }}>
          Next: {next.name} ({next.progress.current}/{next.progress.target})
          <span className="stk-bar" style={{ display: 'block', marginTop: 4 }}><span style={{ width: `${next.progress.percent}%` }} /></span>
        </span>
      )}
    </section>
  );
}

function CollectionView({ collection, onBack }) {
  const families = useMemo(() => [...new Set(collection.stickers.map((s) => s.family).filter(Boolean))], [collection]);
  return (
    <div>
      <button type="button" className="btn btn-soft" onClick={onBack} style={{ marginBottom: 12 }}>← All collections</button>
      <h3 style={{ margin: '0 0 2px', color: '#153e67' }}>{collection.name}</h3>
      <p style={{ margin: '0 0 12px', color: '#688097', fontSize: 13 }}>{collection.collected} of {collection.total} collected · {collection.description}</p>
      {families.map((family) => <div key={family} style={{ marginBottom: 12 }}><EvolutionStrip family={family} stickers={collection.stickers} /></div>)}
      <div className="stk-grid">{collection.stickers.map((s) => <StickerCard key={s.key} sticker={s} />)}</div>
    </div>
  );
}

/**
 * MY STICKER ALBUM. All data comes from GET /student/stickers, so progress is the server's truth.
 * `initial` lets a parent (and tests) supply an already-loaded album.
 */
export default function StickerAlbum({ initial = null }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState('');
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    if (initial) return undefined;
    let active = true;
    api.stickers().then((value) => { if (active) setData(value); }).catch((err) => { if (active) setError(err.message || 'Could not load your stickers.'); });
    return () => { active = false; };
  }, [initial]);

  if (error) return <p role="alert" style={{ color: '#a63c3c', fontWeight: 700 }}>{error}</p>;
  if (!data) return <p role="status" style={{ color: '#688097' }}>Opening your sticker album…</p>;

  const { summary, collections } = data;
  const open = collections.find((c) => c.key === openKey);
  return (
    <section aria-labelledby="sticker-album-title" data-sticker-album>
      <h2 id="sticker-album-title" style={{ margin: 0, color: '#153e67', letterSpacing: '.02em' }}>MY STICKER ALBUM</h2>
      <div className="stk-summary">
        <div><strong>{summary.collected}</strong><small>Stickers collected</small></div>
        <div><strong>{summary.total}</strong><small>Stickers to find</small></div>
        <div><strong>{summary.percent}%</strong><small>Album complete</small></div>
        <div><strong>{summary.legendary_collected}</strong><small>Legendary</small></div>
      </div>
      {open ? <CollectionView collection={open} onBack={() => setOpenKey(null)} /> : (
        <div className="stk-collections">
          {collections.map((c) => {
            const percent = c.total ? Math.round((c.collected / c.total) * 100) : 0;
            return (
              <button key={c.key} type="button" className="stk-collection" onClick={() => setOpenKey(c.key)} aria-label={`${c.name}: ${c.collected} of ${c.total} stickers collected. Open collection`}>
                <span className="stk-cover"><StickerArt art={c.cover} size={84} /></span>
                <strong style={{ color: '#153e67', fontSize: 15 }}>{c.name}</strong>
                <span style={{ fontSize: 12, color: '#688097', fontWeight: 700 }}>{c.collected}/{c.total} stickers</span>
                <span className="stk-bar"><span style={{ width: `${percent}%` }} /></span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
