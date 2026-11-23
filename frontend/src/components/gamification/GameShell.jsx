/**
 * Shared game shell used by Sequencing and Matching players.
 * Provides: themed background, top bar (brand + user + sign out),
 *           subject chip row, progress bar.
 *
 * Props:
 *   attempt     – { title, subject, grade, difficulty, attempt_number, max_attempts }
 *   theme       – from getTheme()
 *   diff        – from getDifficultyColor()
 *   current     – 0-based current question index
 *   total       – total questions/pair-sets
 *   answered    – number completed so far
 *   user        – { name }
 *   onExit      – callback for the Exit button
 *   onSignOut   – callback
 *   timer       – optional <TimerReminder> node
 *   children    – the game content
 */
import { ArrowLeft } from 'lucide-react';
import ScoreBar from './ScoreBar.jsx';

export default function GameShell({
  attempt, theme, diff, current = 0, total = 1, answered = 0,
  user, onExit, onSignOut, timer, children,
}) {
  const progress = total ? ((answered) / total) * 100 : 0;

  return (
    <div style={{ background: theme.bgGradient, minHeight: '100vh' }}>
      {/* Topbar */}
      <header className="topbar">
        <span className="brand">Gamifi<span>ED</span></span>
        <span style={{ marginLeft: 10, color: '#688097', fontSize: 13 }}>{user?.name}</span>
        <button className="btn btn-soft" style={{ marginLeft: 'auto' }} onClick={onSignOut}>Sign out</button>
      </header>

      <main className="content" style={{ maxWidth: 860, margin: '0 auto', paddingTop: 16 }}>
        {/* Game header card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          border: `1px solid ${theme.cardBorder}`,
          padding: '14px 20px', marginBottom: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <button type="button" className="btn btn-soft" style={{ padding: '8px 14px', fontSize: 12 }} onClick={onExit}>
              <ArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} />Exit
            </button>
            <div style={{ flex: 1, minWidth: 160 }}>
              <ScoreBar
                value={progress}
                label={`${attempt?.title || 'Activity'} · ${current + 1} of ${total}`}
                color={theme.accent}
              />
            </div>
            {timer}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {attempt?.subject && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: theme.accentSoft, color: theme.accentText, fontSize: 11, fontWeight: 900 }}>
                {theme.hero} {attempt.subject}
              </span>
            )}
            {attempt?.grade != null && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: '#f0f9ff', color: '#0369a1', fontSize: 11, fontWeight: 900 }}>
                Class {attempt.grade}
              </span>
            )}
            {attempt?.difficulty && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: diff.bg, color: diff.text, fontSize: 11, fontWeight: 900, textTransform: 'capitalize' }}>
                {attempt.difficulty}
              </span>
            )}
            {attempt?.attempt_number != null && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: '#ede9fe', color: '#4c1d95', fontSize: 11, fontWeight: 900 }}>
                Attempt {attempt.attempt_number}{attempt.max_attempts ? ` of ${attempt.max_attempts}` : ''}
              </span>
            )}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
