import { motion, AnimatePresence } from 'motion/react';

/**
 * Subject-aware animated mascot displayed beside quiz/sequencing questions.
 * Reacts to state: idle | correct | wrong | finished.
 *
 * Props:
 *   subject  – "mathematics" | "science" | "english" | anything
 *   state    – "idle" | "correct" | "wrong" | "thinking" | "finished"
 *   size     – px (default 96)
 */

const MASCOT = {
  mathematics: { idle: '🦊', correct: '🦊', wrong: '🦊', thinking: '🦊', finished: '🦊', label: 'Fox' },
  science:     { idle: '🦉', correct: '🦉', wrong: '🦉', thinking: '🦉', finished: '🦉', label: 'Owl' },
  evs:         { idle: '🦉', correct: '🦉', wrong: '🦉', thinking: '🦉', finished: '🦉', label: 'Owl' },
  english:     { idle: '🐧', correct: '🐧', wrong: '🐧', thinking: '🐧', finished: '🐧', label: 'Penguin' },
  default:     { idle: '🐶', correct: '🐶', wrong: '🐶', thinking: '🐶', finished: '🐶', label: 'Dog' },
};

const STATE_BG = {
  idle:     '#f0f9ff',
  correct:  '#dcfce7',
  wrong:    '#fff1f2',
  thinking: '#fef9c3',
  finished: '#ede9fe',
};

const STATE_SPEECH = {
  idle:     'Ready? Let\'s go!',
  correct:  'Brilliant! You got it! 🌟',
  wrong:    'Good try! You can do it!',
  thinking: 'Hmm… think carefully!',
  finished: 'Amazing work! 🎉',
};

export default function Mascot({ subject, state = 'idle', size = 96, speech }) {
  const key = String(subject || '').toLowerCase().split(/[\s/]/)[0];
  const chars = MASCOT[key] || MASCOT.default;
  const emoji = chars[state] || chars.idle;
  const text = speech || STATE_SPEECH[state] || STATE_SPEECH.idle;
  const bg = STATE_BG[state] || STATE_BG.idle;

  const animate = {
    correct:  { scale: [1, 1.25, 0.95, 1.1, 1], rotate: [0, -8, 8, -4, 0] },
    wrong:    { x: [0, -8, 8, -6, 6, 0] },
    thinking: { y: [0, -4, 0, -4, 0] },
    finished: { scale: [1, 1.35, 1.1, 1.2, 1], rotate: [0, 15, -10, 5, 0] },
    idle:     {},
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, userSelect: 'none' }}>
      <motion.div
        key={`${emoji}-${state}`}
        animate={animate[state] || {}}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ fontSize: size, lineHeight: 1, display: 'block', cursor: 'default' }}
        aria-label={`${chars.label} mascot, ${state}`}
        role="img"
      >
        {emoji}
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          style={{
            background: bg,
            borderRadius: 999,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 800,
            color: '#153e67',
            maxWidth: 200,
            textAlign: 'center',
            lineHeight: 1.4,
            border: '1.5px solid rgba(0,0,0,0.07)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          role="status"
          aria-live="polite"
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
