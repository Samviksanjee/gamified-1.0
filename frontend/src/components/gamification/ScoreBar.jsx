import { motion } from 'motion/react';

/**
 * Animated horizontal progress / score bar used in game headers.
 *
 * Props:
 *   value   – 0-100 percent
 *   label   – optional label
 *   color   – fill colour (default teal)
 *   height  – px (default 10)
 */
export default function ScoreBar({ value = 0, label, color = '#12a99f', height = 10 }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#688097', marginBottom: 4 }}>
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={label || 'Progress'}
        style={{ height, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 999, background: color }}
        />
      </div>
    </div>
  );
}
