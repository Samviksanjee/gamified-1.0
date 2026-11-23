/**
 * CrosswordPlayer — Phase 7D
 *
 * Full interactive crossword puzzle player for students.
 * Newspaper-style cell-by-cell keyboard input system.
 *
 * Expected API response shape from startAttempt:
 *   { attempt_id, activity_id, title, difficulty, grid_rows, grid_cols,
 *     cells: [{row, col, is_blocked, number}],
 *     across: [{word_id, number, clue, hint, row, col, length}],
 *     down:   [{word_id, number, clue, hint, row, col, length}],
 *     tools: [...], assist_mode, filled_cells: {"r,c": letter}, status }
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import TimerReminder from '../../components/TimerReminder.jsx';
import Celebration from '../../components/gamification/Celebration.jsx';
import StickerRewards from '../../components/stickers/StickerRewards.jsx';
import { getTheme } from '../../components/gamification/subjectTheme.js';

/* ── Helpers ─────────────────────────────────────────────────────────── */

/**
 * Build a map keyed `${word_id}_${direction}` containing full word entry data.
 * Each entry: { cells:[{row,col}], clue, hint, word_id, number, direction }
 */
function buildWordMap(gameData) {
  if (!gameData) return {};
  const { across = [], down = [] } = gameData;
  const wm = {};

  const addWord = (word, direction) => {
    const cells = [];
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? word.row + i : word.row;
      const c = direction === 'across' ? word.col + i : word.col;
      cells.push({ row: r, col: c });
    }
    wm[`${word.word_id}_${direction}`] = {
      cells,
      clue: word.clue,
      hint: word.hint,
      word_id: word.word_id,
      number: word.number,
      direction,
    };
  };

  for (const w of across) addWord(w, 'across');
  for (const w of down) addWord(w, 'down');
  return wm;
}

/**
 * Build a map keyed `row,col` with cell metadata.
 * Each entry: { row, col, isBlocked, number, acrossWordId, downWordId }
 */
function buildGridMap(gameData) {
  if (!gameData) return {};
  const { across = [], down = [], cells = [] } = gameData;
  const m = {};

  for (const c of cells) {
    m[`${c.row},${c.col}`] = {
      row: c.row,
      col: c.col,
      isBlocked: c.is_blocked,
      number: c.number,
      acrossWordId: null,
      downWordId: null,
    };
  }

  for (const word of across) {
    for (let i = 0; i < word.length; i++) {
      const key = `${word.row},${word.col + i}`;
      if (m[key]) m[key].acrossWordId = word.word_id;
    }
  }
  for (const word of down) {
    for (let i = 0; i < word.length; i++) {
      const key = `${word.row + i},${word.col}`;
      if (m[key]) m[key].downWordId = word.word_id;
    }
  }

  return m;
}

function countWordCells(gameData) {
  if (!gameData) return 0;
  return (gameData.cells || []).filter((c) => !c.is_blocked).length;
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const CONFETTI_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#f9844a', '#4cc9f0'];

/* ── Completion modal ─────────────────────────────────────────────────── */
function CompletionModal({ data, onBack }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 96),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: parseFloat((Math.random() * 2).toFixed(2)),
        dur: parseFloat((1.5 + Math.random() * 1.5).toFixed(2)),
        round: Math.random() > 0.5,
      })),
    [],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crossword complete"
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', padding: 20 }}
    >
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {pieces.map((p) => (
        <div
          key={p.id}
          aria-hidden="true"
          style={{
            position: 'fixed', left: `${p.left}%`, top: 0,
            width: 10, height: 10, background: p.color,
            borderRadius: p.round ? '50%' : 2,
            animation: `confetti-fall ${p.dur}s ${p.delay}s ease-in infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div style={{
        background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center',
        maxWidth: 360, width: '100%', position: 'relative', zIndex: 1,
        boxShadow: '0 20px 60px rgba(0,0,0,.25)', border: '2px solid #fcd34d',
      }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
        <h2 style={{ color: '#153e67', margin: '0 0 4px' }}>Crossword Complete!</h2>
        <p style={{ color: '#688097', margin: '0 0 20px', fontSize: 13 }}>Great work! Here are your results:</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Score', value: data?.score != null ? `${data.score}/100` : '—' },
            { label: 'Time', value: fmtTime(data?.time_seconds ?? 0) },
            { label: 'Hints Used', value: data?.hints_used ?? 0 },
            { label: 'Words Correct', value: data?.words_correct != null ? `${data.words_correct}/${data.words_total}` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f4f8f9', borderRadius: 12, padding: '12px 8px' }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: '#153e67', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: '#688097', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={onBack}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function CrosswordPlayer() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [celebrate, setCelebrate] = useState(false);

  // Game state
  const [gameData, setGameData] = useState(null);
  const [filledCells, setFilledCells] = useState({});
  const [cellStatus, setCellStatus] = useState({});
  const [activeCell, setActiveCell] = useState(null);
  const [activeDirection, setActiveDirection] = useState('across');
  const [completed, setCompleted] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inGameError, setInGameError] = useState('');
  const [timerKey, setTimerKey] = useState(0);

  // Metrics: tracked across 30-second cycles
  const [metrics, setMetrics] = useState({
    cycleCount: 0,
    cellsAtCycleStart: 0,
    checksCorrect: 0,
    checksTotal: 0,
    revealCount: 0,
  });

  // Refs
  const timerRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const attemptIdRef = useRef(null);
  const filledCellsRef = useRef({});
  const completionTriggeredRef = useRef(false);
  const didInteractRef = useRef(false);
  const gridRef = useRef(null);
  const hiddenInputRef = useRef(null);
  // Always points to the latest handleKeyDown so the window listener never goes stale.
  const handleKeyDownRef = useRef(null);

  // Detect mobile (touch pointer)
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try { return window.matchMedia('(pointer: coarse)').matches; } catch (_) { return false; }
  }, []);

  // ── Load game on mount ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.crossword.startAttempt(activityId)
      .then((d) => {
        if (!active) return;
        setGameData(d);
        attemptIdRef.current = d.attempt_id;
        const fc = d.filled_cells || {};
        setFilledCells(fc);
        filledCellsRef.current = fc;
        setTimerKey(k => k + 1);
        if (d.status === 'completed') {
          setCompleted(true);
          setCompletionData(d.completion || d);
          completionTriggeredRef.current = true;
        }
        setLoading(false);
      })
      .catch((err) => {
        const isAuthError = err.message && (
          err.message.includes('403') ||
          err.message.toLowerCase().includes('forbidden') ||
          err.message.toLowerCase().includes('student')
        );
        if (isAuthError) {
          api.crossword.previewPlay(activityId)
            .then((d) => {
              if (!active) return;
              setGameData({ ...d, attempt_id: null, preview_mode: true });
              setLoading(false);
            })
            .catch((e) => {
              if (active) { setError(e.message || 'Could not load crossword preview.'); setLoading(false); }
            });
        } else {
          if (active) { setError(err.message || 'Could not load crossword.'); setLoading(false); }
        }
      });
    return () => { active = false; };
  }, [activityId]);

  // ── 30-second cycle timer ────────────────────────────────────────────
  useEffect(() => {
    if (!gameData || completed) return;
    const interval = setInterval(() => {
      timerRef.current += 30;
      setMetrics(prev => ({
        ...prev,
        cycleCount: prev.cycleCount + 1,
        cellsAtCycleStart: Object.keys(filledCellsRef.current).length,
      }));
      // Squirrel fires at 25s (reminder_at_seconds=5). Its 4.4s animation
      // completes at ~29.4s. Reset the ring 5s after cycle end so squirrel
      // fully glides in before the countdown restarts.
      setTimeout(() => setTimerKey(k => k + 1), 5000);
    }, 30000);
    return () => clearInterval(interval);
  }, [gameData, completed]);

  // ── Derived data ────────────────────────────────────────────────────
  const wordMap = useMemo(() => buildWordMap(gameData), [gameData]);
  const gridMap = useMemo(() => buildGridMap(gameData), [gameData]);
  const totalWordCells = useMemo(() => countWordCells(gameData), [gameData]);

  // Ordered word list for Enter key cycling: across sorted by number, then down sorted by number
  const orderedWords = useMemo(() => {
    if (!gameData) return [];
    const acrossWords = (gameData.across || []).slice().sort((a, b) => a.number - b.number);
    const downWords = (gameData.down || []).slice().sort((a, b) => a.number - b.number);
    return [
      ...acrossWords.map((w) => ({ word_id: w.word_id, direction: 'across' })),
      ...downWords.map((w) => ({ word_id: w.word_id, direction: 'down' })),
    ];
  }, [gameData]);

  const progress = totalWordCells > 0
    ? Math.round((Object.keys(filledCells).length / totalWordCells) * 100)
    : 0;

  // Derive active word entry from gridMap acrossWordId/downWordId + wordMap lookup
  const activeWordEntry = useMemo(() => {
    if (!activeCell) return null;
    const cellData = gridMap[`${activeCell.row},${activeCell.col}`];
    if (!cellData) return null;
    const wordId = activeDirection === 'across' ? cellData.acrossWordId : cellData.downWordId;
    if (wordId) {
      const entry = wordMap[`${wordId}_${activeDirection}`];
      if (entry) return entry;
    }
    // Fallback to other direction
    const otherDir = activeDirection === 'across' ? 'down' : 'across';
    const otherWordId = otherDir === 'across' ? cellData.acrossWordId : cellData.downWordId;
    if (otherWordId) {
      return wordMap[`${otherWordId}_${otherDir}`] || null;
    }
    return null;
  }, [activeCell, activeDirection, gridMap, wordMap]);

  const activeWordCellSet = useMemo(() => {
    if (!activeWordEntry) return new Set();
    return new Set(activeWordEntry.cells.map((c) => `${c.row},${c.col}`));
  }, [activeWordEntry]);

  // ── Global keydown listener ─────────────────────────────────────────
  useLayoutEffect(() => { handleKeyDownRef.current = handleKeyDown; });
  useEffect(() => {
    const handler = (e) => {
      if (handleKeyDownRef.current) handleKeyDownRef.current(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Keep filledCellsRef in sync ──────────────────────────────────────
  useEffect(() => {
    filledCellsRef.current = filledCells;
  }, [filledCells]);

  // ── Autosave (debounce 3s) ──────────────────────────────────────────
  useEffect(() => {
    if (!didInteractRef.current || !gameData || !attemptIdRef.current) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const cleanCells = Object.fromEntries(
          Object.entries(filledCellsRef.current).filter(([, v]) => v != null)
        );
        await api.crossword.saveProgress(activityId, attemptIdRef.current, {
          filled_cells: cleanCells,
          time_seconds: Math.floor(timerRef.current),
        });
      } catch (_) {}
    }, 3000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [filledCells, activityId, gameData]);

  // ── Completion check ────────────────────────────────────────────────
  useEffect(() => {
    if (progress < 100 || !gameData || completionTriggeredRef.current || !attemptIdRef.current) return;
    api.crossword.completeAttempt(activityId, attemptIdRef.current)
      .then((result) => {
        completionTriggeredRef.current = true;
        clearInterval(timerIntervalRef.current);
        if (result?.completed) {
          setCompleted(true);
          setCompletionData(result);
          setCelebrate(true);
        }
      })
      .catch(() => {
        completionTriggeredRef.current = false;
        setInGameError('Could not save your completion. Please try again.');
      });
  }, [progress, gameData, activityId]);

  // ── Cell fill helper ────────────────────────────────────────────────
  const fillLetter = useCallback((row, col, letter) => {
    didInteractRef.current = true;
    const key = `${row},${col}`;
    setFilledCells((prev) => {
      const next = { ...prev };
      if (letter === null) delete next[key];
      else next[key] = letter;
      return next;
    });
    setCellStatus((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // ── Clue click handler ──────────────────────────────────────────────
  // Sets direction, moves to first empty cell in that word (or cells[0]).
  const handleClueClick = useCallback((word, direction) => {
    const entry = wordMap[`${word.word_id}_${direction}`];
    if (!entry) return;
    setActiveDirection(direction);
    const firstEmpty = entry.cells.find((c) => !filledCellsRef.current[`${c.row},${c.col}`]);
    const targetCell = firstEmpty || entry.cells[0];
    setActiveCell({ row: targetCell.row, col: targetCell.col });
    if (gridRef.current) gridRef.current.focus();
  }, [wordMap]);

  // ── Grid cell click ─────────────────────────────────────────────────
  const handleCellClick = useCallback((row, col) => {
    const cellData = gridMap[`${row},${col}`];
    if (!cellData || cellData.isBlocked) return;

    if (activeCell?.row === row && activeCell?.col === col) {
      // Same cell: toggle direction only if cell belongs to both words
      if (cellData.acrossWordId && cellData.downWordId) {
        setActiveDirection((prev) => (prev === 'across' ? 'down' : 'across'));
      }
    } else {
      setActiveCell({ row, col });
      const hasAcross = !!cellData.acrossWordId;
      const hasDown = !!cellData.downWordId;
      // Keep current direction if valid for this cell, otherwise switch
      if (activeDirection === 'across' && !hasAcross) {
        setActiveDirection(hasDown ? 'down' : 'across');
      } else if (activeDirection === 'down' && !hasDown) {
        setActiveDirection(hasAcross ? 'across' : 'down');
      }
    }

    if (isMobile && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    } else if (!isMobile && gridRef.current) {
      gridRef.current.focus();
    }
  }, [activeCell, activeDirection, gridMap, isMobile]);

  // ── Mobile input handler ────────────────────────────────────────────
  const handleMobileInput = useCallback((e) => {
    if (!activeCell) return;
    const text = e.target.value;
    if (text) {
      const letter = text.slice(-1).toUpperCase();
      if (/[A-Z]/.test(letter)) {
        fillLetter(activeCell.row, activeCell.col, letter);
        if (activeWordEntry) {
          const { cells } = activeWordEntry;
          const idx = cells.findIndex((c) => c.row === activeCell.row && c.col === activeCell.col);
          if (idx >= 0 && idx < cells.length - 1) {
            const allRemainingFilled = cells.slice(idx + 1).every(
              (c) => !!filledCellsRef.current[`${c.row},${c.col}`]
            );
            if (allRemainingFilled) {
              setActiveCell({ row: cells[cells.length - 1].row, col: cells[cells.length - 1].col });
            } else {
              setActiveCell({ row: cells[idx + 1].row, col: cells[idx + 1].col });
            }
          }
        }
      }
    }
    e.target.value = '';
  }, [activeCell, activeWordEntry, fillLetter]);

  // ── Keyboard handler ────────────────────────────────────────────────
  // Tab is NOT handled here — browser handles it naturally.
  // onBlur on the grid div clears activeCell when focus leaves the grid.
  const handleKeyDown = useCallback((e) => {
    if (!activeCell || !gameData) return;
    const key = e.key;

    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      e.preventDefault();
      const letter = key.toUpperCase();
      fillLetter(activeCell.row, activeCell.col, letter);
      if (activeWordEntry) {
        const { cells } = activeWordEntry;
        const idx = cells.findIndex((c) => c.row === activeCell.row && c.col === activeCell.col);
        if (idx >= 0 && idx < cells.length - 1) {
          // Always advance to next cell UNLESS all remaining cells are already filled
          const allRemainingFilled = cells.slice(idx + 1).every(
            (c) => !!filledCells[`${c.row},${c.col}`]
          );
          if (allRemainingFilled) {
            // Stop at last cell
            setActiveCell({ row: cells[cells.length - 1].row, col: cells[cells.length - 1].col });
          } else {
            setActiveCell({ row: cells[idx + 1].row, col: cells[idx + 1].col });
          }
        }
        // If at last cell already (idx === cells.length - 1), stay
      }
    } else if (key === 'Backspace') {
      e.preventDefault();
      const cellKey = `${activeCell.row},${activeCell.col}`;
      if (filledCells[cellKey]) {
        // Cell has a letter: clear it and stay on this cell
        fillLetter(activeCell.row, activeCell.col, null);
      } else if (activeWordEntry) {
        // Cell is empty: move to previous cell and clear it
        const { cells } = activeWordEntry;
        const idx = cells.findIndex((c) => c.row === activeCell.row && c.col === activeCell.col);
        if (idx > 0) {
          const prevCell = cells[idx - 1];
          fillLetter(prevCell.row, prevCell.col, null);
          setActiveCell({ row: prevCell.row, col: prevCell.col });
        }
      }
    } else if (key === 'Delete') {
      e.preventDefault();
      fillLetter(activeCell.row, activeCell.col, null);
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      const nxt = { row: activeCell.row, col: activeCell.col + 1 };
      const nc = gridMap[`${nxt.row},${nxt.col}`];
      if (nc && !nc.isBlocked) { setActiveCell(nxt); setActiveDirection('across'); }
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      const nxt = { row: activeCell.row, col: activeCell.col - 1 };
      const nc = gridMap[`${nxt.row},${nxt.col}`];
      if (nc && !nc.isBlocked) { setActiveCell(nxt); setActiveDirection('across'); }
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      const nxt = { row: activeCell.row + 1, col: activeCell.col };
      const nc = gridMap[`${nxt.row},${nxt.col}`];
      if (nc && !nc.isBlocked) { setActiveCell(nxt); setActiveDirection('down'); }
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      const nxt = { row: activeCell.row - 1, col: activeCell.col };
      const nc = gridMap[`${nxt.row},${nxt.col}`];
      if (nc && !nc.isBlocked) { setActiveCell(nxt); setActiveDirection('down'); }
    } else if (key === 'Enter') {
      e.preventDefault();
      if (orderedWords.length === 0) return;
      const currentIdx = activeWordEntry
        ? orderedWords.findIndex(
            (w) => w.word_id === activeWordEntry.word_id && w.direction === activeWordEntry.direction
          )
        : -1;
      const nextIdx = currentIdx >= orderedWords.length - 1 ? 0 : currentIdx + 1;
      const nw = orderedWords[nextIdx];
      const nextEntry = wordMap[`${nw.word_id}_${nw.direction}`];
      if (!nextEntry) return;
      setActiveDirection(nw.direction);
      const firstEmpty = nextEntry.cells.find((c) => !filledCells[`${c.row},${c.col}`]);
      const targetCell = firstEmpty || nextEntry.cells[0];
      setActiveCell({ row: targetCell.row, col: targetCell.col });
    } else if (key === 'Escape') {
      e.preventDefault();
      setActiveCell(null);
      if (gridRef.current) gridRef.current.blur();
    }
    // Tab / Shift+Tab: not handled — let browser navigate naturally
  }, [activeCell, activeDirection, activeWordEntry, filledCells, gridMap, wordMap, gameData, fillLetter, orderedWords]);

  const [checkResult, setCheckResult] = useState(null); // {correct, total} shown after Check All
  const [checking, setChecking] = useState(false);

  const handleCheckAll = useCallback(async () => {
    if (!attemptIdRef.current) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const r = await api.crossword.checkCells(activityId, attemptIdRef.current, { scope: 'all' });
      // Backend returns {results: [{row, col, correct}], checks_used: N}
      if (r?.results) {
        // Convert array → {"row,col": bool} map
        const cellMap = {};
        r.results.forEach(({ row, col, correct }) => { cellMap[`${row},${col}`] = correct; });
        const updated = { ...cellStatus, ...cellMap };
        setCellStatus(updated);
        const values = Object.values(cellMap);
        setMetrics(prev => ({
          ...prev,
          checksCorrect: prev.checksCorrect + values.filter(Boolean).length,
          checksTotal:   prev.checksTotal   + values.length,
        }));
        // Count fully-correct words
        const allWords = Object.values(wordMap);
        const uniqueWords = allWords.filter((w, i, arr) =>
          arr.findIndex(x => x.word_id === w.word_id && x.direction === w.direction) === i
        );
        let correctCount = 0;
        for (const word of uniqueWords) {
          if (word.cells.length > 0 && word.cells.every(({ row, col }) => updated[`${row},${col}`] === true))
            correctCount++;
        }
        setCheckResult({ correct: correctCount, total: uniqueWords.length });
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('limit') || msg.includes('422')) {
        setInGameError('Check limit reached for this difficulty. Try revealing hints instead.');
      } else {
        setInGameError(`Could not check answers: ${msg || 'Please try again.'}`);
      }
    } finally {
      setChecking(false);
    }
  }, [activityId, cellStatus, wordMap]);

  // Helper: convert backend {results:[{row,col,correct}]} → {"row,col": bool} map
  const toCheckMap = useCallback((results) =>
    (results || []).reduce((m, { row, col, correct }) => { m[`${row},${col}`] = correct; return m; }, {})
  , []);

  // ── Tool handlers ───────────────────────────────────────────────────
  const handleTool = useCallback(async (toolName) => {
    if (!activeCell || !attemptIdRef.current) return;
    const wordId = activeWordEntry?.word_id;
    try {
      if (toolName === 'check_letter') {
        const r = await api.crossword.checkCells(activityId, attemptIdRef.current, {
          scope: 'letter', row: activeCell.row, col: activeCell.col,
        });
        if (r?.results) {
          const cellMap = toCheckMap(r.results);
          setCellStatus((prev) => ({ ...prev, ...cellMap }));
          const vals = Object.values(cellMap);
          setMetrics(prev => ({
            ...prev,
            checksCorrect: prev.checksCorrect + vals.filter(Boolean).length,
            checksTotal: prev.checksTotal + vals.length,
          }));
        }
      } else if (toolName === 'check_word' && wordId) {
        const r = await api.crossword.checkCells(activityId, attemptIdRef.current, {
          scope: 'word', word_id: wordId,
        });
        if (r?.results) {
          const cellMap = toCheckMap(r.results);
          setCellStatus((prev) => ({ ...prev, ...cellMap }));
          const vals = Object.values(cellMap);
          setMetrics(prev => ({
            ...prev,
            checksCorrect: prev.checksCorrect + vals.filter(Boolean).length,
            checksTotal: prev.checksTotal + vals.length,
          }));
        }
      } else if (toolName === 'check_all') {
        const r = await api.crossword.checkCells(activityId, attemptIdRef.current, { scope: 'all' });
        if (r?.results) {
          const cellMap = toCheckMap(r.results);
          setCellStatus((prev) => ({ ...prev, ...cellMap }));
          const vals = Object.values(cellMap);
          setMetrics(prev => ({
            ...prev,
            checksCorrect: prev.checksCorrect + vals.filter(Boolean).length,
            checksTotal: prev.checksTotal + vals.length,
          }));
        }
      } else if (toolName === 'reveal_letter') {
        const r = await api.crossword.revealCells(activityId, attemptIdRef.current, {
          scope: 'letter', row: activeCell.row, col: activeCell.col,
        });
        if (r?.revealed) {
          didInteractRef.current = true;
          setFilledCells((prev) => ({ ...prev, ...r.revealed }));
          setMetrics(prev => ({
            ...prev,
            revealCount: prev.revealCount + Object.keys(r.revealed).length,
          }));
        }
      } else if (toolName === 'reveal_word' && wordId) {
        const r = await api.crossword.revealCells(activityId, attemptIdRef.current, {
          scope: 'word', word_id: wordId,
        });
        if (r?.revealed) {
          didInteractRef.current = true;
          setFilledCells((prev) => ({ ...prev, ...r.revealed }));
          setMetrics(prev => ({
            ...prev,
            revealCount: prev.revealCount + Object.keys(r.revealed).length,
          }));
        }
      }
    } catch (_) {
      setInGameError('Could not complete the action. Please try again.');
    }
  }, [activeCell, activeWordEntry, activityId]);

  // ── Loading / error states ──────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ textAlign: 'center', padding: 60, color: '#688097' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p role="status">Loading puzzle…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ textAlign: 'center', padding: 60 }}>
        <div role="alert" style={{ color: '#a63c3c', marginBottom: 16 }}>{error}</div>
        <button className="btn btn-soft" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </main>
    );
  }

  if (!gameData) return null;

  const tools = gameData.tools || [];
  const TOOL_CONFIG = {
    check_letter:  { label: '✓ Check Letter',  handler: () => handleTool('check_letter') },
    check_word:    { label: '✓ Check Word',     handler: () => handleTool('check_word') },
    check_all:     { label: '✓ Check All',      handler: () => handleTool('check_all') },
    reveal_letter: { label: '👁 Reveal Letter',  handler: () => handleTool('reveal_letter') },
    reveal_word:   { label: '👁 Reveal Word',    handler: () => handleTool('reveal_word') },
  };

  const activeClueText = activeWordEntry
    ? `${activeWordEntry.direction === 'across' ? 'Across' : 'Down'} ${activeWordEntry.number}: ${activeWordEntry.clue}`
    : '';

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(12px,2vw,24px)', fontFamily: 'inherit', background: getTheme(gameData?.subject).bgGradient, minHeight: '100vh' }}>
      {completed && <StickerRewards stickers={completionData?.newly_earned_stickers} />}
      {celebrate && <Celebration active={celebrate} colors={getTheme(gameData?.subject).confetti} onDone={() => setCelebrate(false)} />}
      {/* Preview-mode banner for teachers using Test Play */}
      {gameData?.preview_mode && (
        <div role="status" style={{
          background: '#fff7dc', border: '1px solid #f0c040', borderRadius: 10,
          padding: '10px 16px', marginBottom: 14, fontSize: 13, fontWeight: 700,
          color: '#a77818', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          👁 Preview mode — you are viewing this as a teacher. Student progress is not tracked.
        </div>
      )}

      {/* Hidden mobile input: receives focus on cell tap, relays single chars */}
      <input
        ref={hiddenInputRef}
        type="text"
        aria-hidden="true"
        tabIndex={-1}
        onInput={handleMobileInput}
        style={{
          position: 'absolute', opacity: 0, width: 1, height: 1,
          pointerEvents: 'none', overflow: 'hidden',
        }}
      />

      {/* Aria-live clue announcer */}
      <div
        role="status"
        aria-live="polite"
        data-testid="active-clue"
        style={{
          position: 'absolute', width: 1, height: 1,
          overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
        }}
      >
        {activeWordEntry ? `Clue: ${activeWordEntry.clue}` : ''}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(16px,3vw,22px)', color: '#153e67' }}>
            {gameData.title || 'Crossword'}
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#688097' }}>
            {gameData.difficulty} · {gameData.grid_rows}×{gameData.grid_cols}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <TimerReminder
            config={{ enabled: true, duration_seconds: 30, reminder_at_seconds: 5 }}
            gameType="crossword"
            active={!completed}
            timerKey={timerKey}
            loop={true}
          />
          <button className="btn btn-soft" onClick={() => navigate('/dashboard')} style={{ fontSize: 12 }}>
            ← Back
          </button>
        </div>
      </div>

      {/* Live metrics bar — shown after first 30-second cycle */}
      {metrics.cycleCount > 0 && (() => {
        const totalFilled = Object.keys(filledCells).length;
        const speed = Math.max(0, totalFilled - metrics.cellsAtCycleStart);
        const accuracy = metrics.checksTotal > 0 ? Math.round((metrics.checksCorrect / metrics.checksTotal) * 100) : null;
        const understanding = totalWordCells > 0 ? Math.round(((totalFilled - metrics.revealCount) / totalWordCells) * 100) : null;
        return (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, padding: '8px 14px', background: '#f0f6f6', borderRadius: 10 }}>
            <span style={{ fontSize: 12, color: '#153e67', fontWeight: 700 }}>
              ⚡ Speed: <strong>{speed} cells/30s</strong>
            </span>
            {accuracy !== null && (
              <span style={{ fontSize: 12, color: accuracy >= 70 ? '#238650' : '#c85a59', fontWeight: 700 }}>
                🎯 Accuracy: <strong>{accuracy}%</strong>
              </span>
            )}
            {understanding !== null && (
              <span style={{ fontSize: 12, color: understanding >= 70 ? '#238650' : '#a77818', fontWeight: 700 }}>
                🧠 Understanding: <strong>{Math.min(100, understanding)}%</strong>
              </span>
            )}
          </div>
        );
      })()}

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#688097', marginBottom: 4 }}>
          <span>Progress</span><span>{progress}%</span>
        </div>
        <div style={{ background: '#e6eff1', height: 8, borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#19b7a7', borderRadius: 20, transition: 'width .3s' }} />
        </div>
      </div>

      {/* Check button + result */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <button
          className="btn btn-primary"
          onClick={handleCheckAll}
          disabled={checking || !attemptIdRef.current}
          style={{ fontSize: 13, padding: '8px 20px', borderRadius: 10, border: 'none' }}
        >
          {checking ? '⏳ Checking…' : '✓ Check'}
        </button>
        {checkResult && (
          <div
            role="status"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10,
              background: checkResult.correct === checkResult.total ? '#e5f8eb' : '#fff7dc',
              border: `1px solid ${checkResult.correct === checkResult.total ? '#8ddcac' : '#f0c040'}`,
              fontSize: 13, fontWeight: 700,
              color: checkResult.correct === checkResult.total ? '#238650' : '#a77818',
            }}
          >
            {checkResult.correct === checkResult.total ? '🎉' : '📝'}
            {' '}{checkResult.correct} of {checkResult.total} word{checkResult.total !== 1 ? 's' : ''} correct
            {checkResult.correct === checkResult.total && ' — All done!'}
            <button
              onClick={() => setCheckResult(null)}
              aria-label="Dismiss result"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, marginLeft: 4, color: 'inherit' }}
            >×</button>
          </div>
        )}
      </div>

      {/* Tool buttons */}
      {tools.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {tools.map((t) => {
            const cfg = TOOL_CONFIG[t];
            if (!cfg) return null;
            return (
              <button
                key={t}
                className="btn btn-soft"
                onClick={cfg.handler}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* In-game error banner (non-fatal) */}
      {inGameError && (
        <div
          role="alert"
          data-testid="in-game-error"
          style={{
            background: '#ffe9e7', color: '#a63c3c',
            border: '1px solid #f5c0b8', borderRadius: 10,
            padding: '10px 14px', marginBottom: 14, fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span>{inGameError}</span>
          <button
            onClick={() => setInGameError('')}
            aria-label="Dismiss error"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a63c3c', fontWeight: 700, fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Active clue banner (visible, above grid) */}
      {activeWordEntry && (
        <div style={{
          background: '#eef8ff', border: '1px solid #cde8f5',
          borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13,
        }}>
          <strong style={{ color: '#153e67' }}>
            {activeWordEntry.direction === 'across' ? 'Across' : 'Down'} {activeWordEntry.number}
          </strong>
          {' — '}
          <span style={{ color: '#356580' }}>{activeWordEntry.clue}</span>
          {activeWordEntry.hint && (
            <span style={{ color: '#688097', fontSize: 11, marginLeft: 8 }}>
              (Hint: {activeWordEntry.hint})
            </span>
          )}
        </div>
      )}

      {/* Grid + Clues layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* ── Grid ── */}
        <div
          ref={gridRef}
          tabIndex={0}
          role="grid"
          aria-label="Crossword puzzle grid"
          onBlur={(e) => {
            // Clear active cell when focus truly leaves the grid container
            if (!gridRef.current?.contains(e.relatedTarget)) {
              setActiveCell(null);
            }
          }}
          style={{ outline: 'none', touchAction: 'manipulation' }}
        >
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <tbody>
              {Array.from({ length: gameData.grid_rows }, (_, row) => (
                <tr key={row}>
                  {Array.from({ length: gameData.grid_cols }, (_, col) => {
                    const cellKey = `${row},${col}`;
                    const cellData = gridMap[cellKey];
                    const isWordCell = cellData && !cellData.isBlocked;
                    const isActive = activeCell?.row === row && activeCell?.col === col;
                    const inActiveWord = activeWordCellSet.has(cellKey);
                    const status = cellStatus[cellKey];
                    const letter = filledCells[cellKey];

                    if (!isWordCell) {
                      return (
                        <td
                          key={col}
                          style={{ width: 34, height: 34, background: '#1e2d3d', border: '1px solid #111' }}
                          aria-label="blocked"
                        />
                      );
                    }

                    // Determine background color — order of priority:
                    // active > correct > wrong > active-word > default
                    let cellBg = '#fff';
                    if (isActive) cellBg = '#e0f7f5';
                    else if (status === true) cellBg = '#d4f7d4';
                    else if (status === false) cellBg = '#ffd4d4';
                    else if (inActiveWord) cellBg = '#f0fbfa';

                    const cellBorder = isActive ? '2px solid #19b7a7' : '1px solid #bbb';

                    return (
                      <td
                        key={col}
                        role="button"
                        tabIndex={0}
                        data-cell={cellKey}
                        onClick={() => handleCellClick(row, col)}
                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleCellClick(row, col); }}
                        aria-label={`${status === true ? 'correct ' : status === false ? 'wrong ' : ''}cell${cellData.number ? ` ${cellData.number}` : ''}`}
                        style={{
                          width: 34, height: 34,
                          background: cellBg,
                          border: cellBorder,
                          cursor: 'pointer', position: 'relative',
                          textAlign: 'center', verticalAlign: 'middle',
                          userSelect: 'none',
                        }}
                      >
                        {cellData.number != null && (
                          <span style={{
                            position: 'absolute', top: 1, left: 2,
                            fontSize: 8, color: '#555', lineHeight: 1, pointerEvents: 'none',
                          }}>
                            {cellData.number}
                          </span>
                        )}
                        {letter && (
                          <span style={{
                            pointerEvents: 'none',
                            fontSize: 18, fontWeight: 700, color: '#153e67',
                            lineHeight: 1,
                          }}>
                            {letter}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Clue lists ── */}
        <div style={{ flex: 1, minWidth: 200, display: 'grid', gap: 16 }}>
          {(gameData.across || []).length > 0 && (
            <div>
              <h3 style={{ color: '#153e67', margin: '0 0 8px', fontSize: 14 }}>Across</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(gameData.across || []).map((word) => {
                  const isActive = activeWordEntry?.word_id === word.word_id && activeWordEntry?.direction === 'across';
                  return (
                    <button
                      key={word.word_id}
                      onClick={() => handleClueClick(word, 'across')}
                      style={{
                        textAlign: 'left', padding: '6px 10px', borderRadius: 8,
                        border: '1px solid #e0eaed',
                        borderLeft: isActive ? '3px solid #19b7a7' : '1px solid #e0eaed',
                        background: isActive ? '#e8f9f5' : '#fff',
                        cursor: 'pointer', fontSize: 12, color: '#153e67',
                        fontFamily: 'inherit', width: '100%',
                      }}
                    >
                      <strong>{word.number}.</strong> {word.clue}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(gameData.down || []).length > 0 && (
            <div>
              <h3 style={{ color: '#153e67', margin: '0 0 8px', fontSize: 14 }}>Down</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(gameData.down || []).map((word) => {
                  const isActive = activeWordEntry?.word_id === word.word_id && activeWordEntry?.direction === 'down';
                  return (
                    <button
                      key={word.word_id}
                      onClick={() => handleClueClick(word, 'down')}
                      style={{
                        textAlign: 'left', padding: '6px 10px', borderRadius: 8,
                        border: '1px solid #e0eaed',
                        borderLeft: isActive ? '3px solid #19b7a7' : '1px solid #e0eaed',
                        background: isActive ? '#e8f9f5' : '#fff',
                        cursor: 'pointer', fontSize: 12, color: '#153e67',
                        fontFamily: 'inherit', width: '100%',
                      }}
                    >
                      <strong>{word.number}.</strong> {word.clue}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      {isMobile && activeWordEntry && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#153e67', color: '#fff', padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10, zIndex: 100,
          boxShadow: '0 -4px 12px rgba(0,0,0,.15)',
        }}>
          <button
            onClick={() => {
              const idx = orderedWords.findIndex(
                (w) => w.word_id === activeWordEntry.word_id && w.direction === activeWordEntry.direction
              );
              const prevOW = orderedWords[idx <= 0 ? orderedWords.length - 1 : idx - 1];
              const prevEntry = wordMap[`${prevOW.word_id}_${prevOW.direction}`];
              if (!prevEntry) return;
              setActiveDirection(prevOW.direction);
              setActiveCell({ row: prevEntry.cells[0].row, col: prevEntry.cells[0].col });
            }}
            style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
          >
            ‹ Prev
          </button>
          <div style={{ flex: 1, fontSize: 12, textAlign: 'center' }}>
            <strong>{activeWordEntry.direction === 'across' ? 'Across' : 'Down'} {activeWordEntry.number}</strong>
            {' — '}{activeWordEntry.clue}
          </div>
          <button
            onClick={() => {
              const idx = orderedWords.findIndex(
                (w) => w.word_id === activeWordEntry.word_id && w.direction === activeWordEntry.direction
              );
              const nextOW = orderedWords[idx >= orderedWords.length - 1 ? 0 : idx + 1];
              const nextEntry = wordMap[`${nextOW.word_id}_${nextOW.direction}`];
              if (!nextEntry) return;
              setActiveDirection(nextOW.direction);
              setActiveCell({ row: nextEntry.cells[0].row, col: nextEntry.cells[0].col });
            }}
            style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
          >
            Next ›
          </button>
        </div>
      )}

      {/* Completion modal */}
      {completed && completionData && (
        <CompletionModal
          data={completionData}
          onBack={() => navigate('/dashboard')}
        />
      )}
    </main>
  );
}
