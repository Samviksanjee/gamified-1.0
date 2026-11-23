import { useCallback, useEffect, useRef } from 'react';
import ReactConfetti from 'react-confetti';

/**
 * Full-screen confetti + optional star burst overlay.
 * Automatically stops after `duration` ms.
 *
 * Props:
 *   active    – boolean
 *   colors    – string[] (optional, defaults to rainbow)
 *   duration  – ms (default 4000)
 *   onDone    – callback when animation stops
 */
export default function Celebration({ active, colors, duration = 4000, onDone }) {
  const stopTimer = useRef(null);

  useEffect(() => {
    if (active) {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => onDone?.(), duration);
    }
    return () => clearTimeout(stopTimer.current);
  }, [active, duration, onDone]);

  if (!active) return null;

  return (
    <ReactConfetti
      width={typeof window !== 'undefined' ? window.innerWidth : 800}
      height={typeof window !== 'undefined' ? window.innerHeight : 600}
      colors={colors || ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f87171']}
      numberOfPieces={180}
      recycle={false}
      tweenDuration={duration}
      gravity={0.28}
      style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none' }}
    />
  );
}
