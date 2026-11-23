import { AnimatePresence, motion } from 'motion/react';

/**
 * Animated feedback badge that appears after an answer is submitted.
 * tone: "correct" | "wrong" | "hint" | "info"
 */

const STYLES = {
  correct: { bg: '#dcfce7', border: '#86efac', color: '#166534', icon: '✅' },
  wrong:   { bg: '#fff1f2', border: '#fca5a5', color: '#991b1b', icon: '💙' },
  hint:    { bg: '#fef9c3', border: '#fde047', color: '#713f12', icon: '💡' },
  info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e3a8a', icon: 'ℹ️' },
};

export default function FeedbackBadge({ tone = 'info', children, visible = true }) {
  const s = STYLES[tone] || STYLES.info;
  return (
    <AnimatePresence>
      {visible && children && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            padding: '14px 16px',
            borderRadius: 14,
            background: s.bg,
            border: `1.5px solid ${s.border}`,
            color: s.color,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">{s.icon}</span>
          <div>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
