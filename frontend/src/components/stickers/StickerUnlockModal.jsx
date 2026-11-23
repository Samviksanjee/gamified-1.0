import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Celebration from '../gamification/Celebration.jsx';
import StickerArt from './StickerArt.jsx';
import { RARITY_LABEL } from './StickerCard.jsx';
import '../../styles/stickers.css';

function GiftBox({ open }) {
  return (
    <svg viewBox="0 0 120 110" width="150" height="138" aria-hidden="true" focusable="false">
      <rect x="18" y="52" width="84" height="52" rx="8" fill="#ff8fab" stroke="#3d3550" strokeWidth="2.4" />
      <rect x="54" y="52" width="12" height="52" fill="#ffd93d" stroke="#3d3550" strokeWidth="2" />
      <motion.g animate={open ? { y: -34, rotate: -14, x: -14 } : { y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }} style={{ transformOrigin: '60px 50px' }}>
        <rect x="12" y="34" width="96" height="22" rx="8" fill="#ff6b8b" stroke="#3d3550" strokeWidth="2.4" />
        <rect x="54" y="34" width="12" height="22" fill="#ffd93d" stroke="#3d3550" strokeWidth="2" />
        <path d="M60 34 Q40 10 30 24 Q40 34 60 34 Q80 34 90 24 Q80 10 60 34Z" fill="#ffd93d" stroke="#3d3550" strokeWidth="2.2" strokeLinejoin="round" />
      </motion.g>
    </svg>
  );
}

/**
 * "You got a new sticker!" reward. Shown on the result screen AFTER a game, never during questions.
 * A gift box shakes, opens, and reveals each newly-earned sticker one at a time.
 */
export default function StickerUnlockModal({ stickers = [], onClose, onViewAlbum }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const closeRef = useRef(null);
  const current = stickers[index];

  useEffect(() => {
    setOpened(false);
    const timer = setTimeout(() => setOpened(true), reduce ? 0 : 900);
    return () => clearTimeout(timer);
  }, [index, reduce]);
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!current) return null;
  const last = index === stickers.length - 1;
  return (
    <div className="stk-scrim" role="dialog" aria-modal="true" aria-label="New sticker unlocked">
      <Celebration active={opened} duration={3500} colors={['#ffd93d', '#ff8fab', '#7cc4ff', '#8be07b', '#c4b5fd']} />
      <motion.div className="stk-modal" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div role="status" aria-live="polite" style={{ color: '#153e67', fontWeight: 900, fontSize: 20, marginBottom: 4 }}>
          {opened ? 'You unlocked a new sticker!' : 'Something special is inside…'}
        </div>
        <div style={{ minHeight: 170, display: 'grid', placeItems: 'center' }}>
          <AnimatePresence mode="wait">
            {!opened ? (
              <motion.div key="box" animate={reduce ? {} : { rotate: [0, -6, 6, -6, 6, 0] }} transition={{ duration: 0.8 }}><GiftBox open={false} /></motion.div>
            ) : (
              <motion.div key={current.key} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                className={`stk-frame stk-${current.rarity}`} style={{ width: 170 }} data-unlocked={current.key}>
                <div className="stk-inner"><StickerArt art={current.art} size={120} title={current.name} /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {opened && (
          <div>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#153e67', marginTop: 8 }}>{current.name}</div>
            <span className={`stk-rarity ${current.rarity}`}>{RARITY_LABEL[current.rarity]}</span>
            <p style={{ color: '#47677d', margin: '10px 0 0', fontSize: 14 }}>{current.description}</p>
            <p style={{ color: '#238650', margin: '6px 0 0', fontSize: 13, fontWeight: 800 }}>Saved to your Sticker Album!</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
          {opened && !last && <button type="button" className="btn btn-primary" onClick={() => setIndex(index + 1)}>Next sticker →</button>}
          {onViewAlbum && opened && last && <button type="button" className="btn btn-primary" onClick={onViewAlbum}>See my album</button>}
          <button ref={closeRef} type="button" className="btn btn-soft" onClick={onClose}>{opened && last ? 'Keep playing' : 'Skip'}</button>
        </div>
        {stickers.length > 1 && <p style={{ color: '#688097', fontSize: 11, margin: '8px 0 0' }}>{index + 1} of {stickers.length}</p>}
      </motion.div>
    </div>
  );
}
