import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_QUIZ_TIMER = { enabled: true, duration_seconds: 30, reminder_at_seconds: 0 };

export function timerSettings(config, gameType) {
  if (!config) return gameType === 'quiz' ? DEFAULT_QUIZ_TIMER : { enabled: false };
  if (!config.enabled) return { enabled: false };
  const duration = Number(config.duration_seconds);
  const reminderAt = Number(config.reminder_at_seconds);
  if (!Number.isFinite(duration) || duration < 5) return { enabled: false };
  return {
    enabled: true,
    duration_seconds: duration,
    reminder_at_seconds: Math.max(0, Math.min(Number.isFinite(reminderAt) ? reminderAt : 0, duration)),
  };
}

const SQUIRREL_MSGS = [
  'Hey! Time is running away! 🏃',
  'Come on, little explorer! Pick your answer! 🌟',
  'Time is ticking! The squirrel is getting impatient! ⏰',
  "Are you still thinking? Let's go! 🐿️",
  'Oops! The clock is faster than me! 💨',
  "Still thinking? You've totally got this! 🌰",
  'My snack break is coming up. How about your answer? 🥜',
];

const PUZZLE_MSGS = [
  "Drag those pieces faster, I'm watching! 🧩",
  "You're SO close! Keep going! 💪",
  "The puzzle won't solve itself, you know! 😄",
  "Tick tock! Which piece goes next? 🐿️",
  "I believe in you — just a few more pieces! ⭐",
  "My acorns are getting cold. Hurry up! 🌰",
  "Faster, faster! You've got this! 🚀",
  "Hmm, that piece looks lonely over there… 🤔",
  "Almost there! I can see the solar system! 🪐",
  "Keep rearranging — you'll crack it! 🔄",
];

function TimerRing({ elapsed, total }) {
  const remaining = Math.max(total - elapsed, 0);
  const fraction = remaining / total;
  const r = 22, circ = 2 * Math.PI * r;
  const color = remaining <= 5 ? '#ee7777' : remaining <= 10 ? '#f4b400' : '#19b7a7';
  return <div aria-label={`${remaining} seconds remaining`} style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
    <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
      <circle cx="30" cy="30" r={r} fill="none" stroke="#e6eef1" strokeWidth="5" />
      <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${circ * fraction} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .9s linear, stroke .3s' }} />
    </svg>
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: remaining <= 9 ? 16 : 15, color }}>{remaining}</div>
  </div>;
}

function SquirrelReminder({ message, onDismiss }) {
  return <div role="status" aria-live="polite" style={{ position: 'fixed', bottom: 90, left: 0, right: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', animation: 'sqRoll 4.2s ease-in-out forwards' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'white', border: '2.5px solid #19b7a7', borderRadius: 999, padding: '11px 16px 11px 22px', boxShadow: '0 8px 32px rgba(20,169,159,0.22)', maxWidth: '88vw' }}>
      <span aria-hidden="true" style={{ fontSize: 38, animation: 'sqBounce .55s infinite alternate', display: 'inline-block' }}>🐿️</span>
      <span style={{ fontWeight: 800, color: '#153e67', fontSize: 14 }}>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss squirrel reminder" style={{ border: 0, background: 'transparent', color: '#153e67', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
    </div>
    <style>{`@keyframes sqRoll{0%{transform:translateX(-110%);opacity:0}14%{transform:translateX(0);opacity:1}82%{transform:translateX(0);opacity:1}100%{transform:translateX(110%);opacity:0}}@keyframes sqBounce{from{transform:rotate(-10deg) translateY(0)}to{transform:rotate(10deg) translateY(-5px)}}@media(prefers-reduced-motion:reduce){@keyframes sqRoll{from{opacity:1}to{opacity:1}}@keyframes sqBounce{from{}to{}}}`}</style>
  </div>;
}

export default function TimerReminder({ config, gameType, active = true, timerKey, loop = false }) {
  const settings = useMemo(() => timerSettings(config, gameType), [config, gameType]);
  const [elapsed, setElapsed] = useState(0);
  const [showSquirrel, setShowSquirrel] = useState(false);
  const [reminderFired, setReminderFired] = useState(false);
  const [message, setMessage] = useState('');
  const msgIndexRef = useMemo(() => ({ current: 0 }), []);   // track next message index for loops

  const msgs = gameType === 'puzzle' ? PUZZLE_MSGS : SQUIRREL_MSGS;

  const nextMessage = () => {
    const msg = msgs[msgIndexRef.current % msgs.length];
    msgIndexRef.current += 1;
    return msg;
  };

  useEffect(() => {
    setElapsed(0);
    setShowSquirrel(false);
    setReminderFired(false);
    setMessage('');
    if (!settings.enabled || !active) return undefined;
    const startedAt = Date.now();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(interval);
  }, [timerKey, settings.enabled, settings.duration_seconds, settings.reminder_at_seconds, active]);

  useEffect(() => {
    if (!settings.enabled || !active || reminderFired || elapsed < settings.duration_seconds - settings.reminder_at_seconds) return;
    setMessage(nextMessage());
    setReminderFired(true);
    setShowSquirrel(true);
  }, [active, elapsed, reminderFired, settings]);

  useEffect(() => {
    if (!showSquirrel) return undefined;
    const timeout = setTimeout(() => {
      setShowSquirrel(false);
      // If loop mode: reset reminder so it fires again on next cycle
      if (loop) {
        setReminderFired(false);
      }
    }, 4400);
    return () => clearTimeout(timeout);
  }, [showSquirrel, loop]);

  if (!settings.enabled) return null;
  return <><TimerRing elapsed={elapsed} total={settings.duration_seconds} />{showSquirrel && <SquirrelReminder message={message} onDismiss={() => setShowSquirrel(false)} />}</>;
}
