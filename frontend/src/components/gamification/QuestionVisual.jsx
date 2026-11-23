import { motion } from 'motion/react';
import { Icon, Scene, nounKeyFor } from './illustrations.jsx';
import { normaliseGroups, pictureFor } from './visualAssetResolver.js';
import { assetUrl } from '../../api.js';

const APPLE_TONES = { red: '#ef4444', green: '#6bd08a', yellow: '#facc15', orange: '#fb923c' };
const frame = { margin: '4px 0 14px', padding: 14, borderRadius: 16, background: '#f8fafc', border: '1.5px dashed #cbd5e1' };

/** A small picture for one word: our SVG if we have it, else the emoji table, else nothing. */
export function WordPicture({ text, size = 44 }) {
  const key = nounKeyFor(text);
  if (key) return <Icon name={key} size={size} />;
  const emoji = pictureFor(text);
  return emoji ? <span aria-hidden="true" style={{ fontSize: size * 0.8, lineHeight: 1 }}>{emoji}</span> : null;
}

/**
 * Renders a question's illustration:
 *  - counting:     the exact quantities in the metadata, as countable pictures
 *  - scene:        a named teaching scene (addition apples, number path, plant needs, ...)
 *  - illustration: a stored asset image (lazy loaded) with alt text
 * Returns nothing when there is no usable visual, so plain questions stay plain.
 */
export default function QuestionVisual({ visual }) {
  if (!visual) return null;

  if (visual.type === 'scene') {
    const hasScene = Boolean(Scene({ scene: visual.scene, params: visual.params }));
    return hasScene ? <figure style={frame}><Scene scene={visual.scene} params={visual.params} /></figure> : null;
  }

  if (visual.type === 'counting') {
    const groups = normaliseGroups(visual.groups);
    if (!groups.length) return null;
    const total = groups.reduce((n, g) => n + g.count, 0);
    return (
      <figure role="group" aria-label={visual.alt_text || `${total} objects to count`} style={frame}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          {groups.map((group, g) => {
            const key = nounKeyFor(group.kind);
            const emoji = key ? null : pictureFor(group.kind);
            return (
              <div key={g} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 280, justifyContent: 'center' }}>
                {Array.from({ length: group.count }, (_, i) => (
                  <motion.span key={i} data-count-item initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: (g * 4 + i) * 0.04, type: 'spring', stiffness: 380, damping: 18 }}
                    aria-hidden="true" style={{ display: 'inline-grid', placeItems: 'center' }}>
                    {key ? <Icon name={key} size={40} fill={key === 'apple' ? (group.color || APPLE_TONES.red) : undefined} /> : <span style={{ fontSize: 32, lineHeight: 1 }}>{emoji || '⚫'}</span>}
                  </motion.span>
                ))}
              </div>
            );
          })}
        </div>
      </figure>
    );
  }

  if (visual.asset_url) {
    return (
      <figure style={{ margin: '4px 0 14px', textAlign: 'center' }}>
        <img src={assetUrl(visual.asset_url)} alt={visual.alt_text || ''} loading="lazy" decoding="async"
          style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff' }} />
      </figure>
    );
  }
  return null;
}
