/**
 * PuzzlePlayer — native HTML5 drag-and-drop + squirrel timer
 *
 * Drag a piece from the tray onto a board slot.
 * Drag a placed piece onto another slot to swap.
 * Drag a placed piece back onto the tray to unplace.
 * Click a tray piece to place it in the first empty slot (mobile/keyboard).
 * 30-second squirrel timer motivates/taunts the student.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, assetUrl } from '../../api.js';
import TimerReminder from '../../components/TimerReminder.jsx';

/* ── colours ─────────────────────────────────────────────────────────── */
const TEAL    = '#12a99f';
const BORDER  = '#e0eaed';
const TEXT    = '#153e67';
const MUTED   = '#688097';

export default function PuzzlePlayer() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  /* ── state (all at top level) ────────────────────────────────────── */
  const [status,    setStatus]    = useState('loading');
  const [errorMsg,  setErrorMsg]  = useState('');
  const [gameData,  setGameData]  = useState(null);
  const [pieceMap,  setPieceMap]  = useState({});   // displayId → url
  const [board,     setBoard]     = useState({});   // slotIndex(string) → displayId|null
  const [tray,      setTray]      = useState([]);   // [displayId, …]
  const [moves,     setMoves]     = useState(0);
  const [completed, setCompleted] = useState(false);
  const [verifyErr, setVerifyErr] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [dragId,    setDragId]    = useState(null);
  const [overSlot,  setOverSlot]  = useState(null);
  const [timerKey,  setTimerKey]  = useState(0);
  const [selected,  setSelected]  = useState(null);

  const startedAt = useRef(Date.now());

  /* ── load ─────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    setVerifyErr('');
    try {
      const meta = await api.puzzle.get(activityId);
      const data = await api.puzzle.start(activityId);

      const map = {};
      data.pieces.forEach(p => { map[p.display_id] = assetUrl(p.piece_url); });
      setPieceMap(map);

      if (data.resumed && data.board_state?.board) {
        const b = {};
        const t = [];
        Object.entries(data.board_state.board).forEach(([s, d]) => { b[s] = d || null; });
        data.pieces.forEach(({ display_id }) => {
          if (!Object.values(b).includes(display_id)) t.push(display_id);
        });
        setBoard(b); setTray(t);
        setMoves(data.board_state.moves || 0);
        startedAt.current = Date.now() - (data.board_state.elapsed_seconds || 0) * 1000;
      } else {
        const empty = {};
        for (let i = 0; i < data.total_pieces; i++) empty[String(i)] = null;
        setBoard(empty);
        setTray(data.pieces.map(p => p.display_id));
        setMoves(0);
        startedAt.current = Date.now();
      }

      setGameData({
        attemptId: data.attempt_id,
        gridSize: data.grid_size,
        totalPieces: data.total_pieces,
        title: meta.title || 'Puzzle',
        fullImageUrl: assetUrl(meta.thumbnail_url) || null,
      });
      setCompleted(false);
      setStatus('ready');
      setTimerKey(k => k + 1);   // reset squirrel timer on each load/reload
    } catch (err) {
      setErrorMsg(err.message || 'Could not load puzzle.');
      setStatus('error');
    }
  }, [activityId]);

  useEffect(() => { load(); }, [load]);

  /* ── drag-and-drop helpers ────────────────────────────────────────── */

  /** Find where a displayId currently lives: 'tray' or slot index string */
  const findSource = (displayId, b, t) => {
    if (t.includes(displayId)) return 'tray';
    const slot = Object.entries(b).find(([, v]) => v === displayId)?.[0];
    return slot !== undefined ? slot : null;
  };

  /** Move piece to a board slot, swapping occupant if needed */
  const movePiece = (displayId, targetSlot) => {
    setBoard(prevBoard => {
      setTray(prevTray => {
        const newBoard = { ...prevBoard };
        const newTray  = [...prevTray];
        const source   = findSource(displayId, prevBoard, prevTray);
        const occupant = newBoard[targetSlot];

        if (occupant === displayId) return prevTray; // dropped on itself

        // Place piece in target slot
        newBoard[targetSlot] = displayId;

        // Handle where the piece came from
        if (source === 'tray') {
          const idx = newTray.indexOf(displayId);
          if (idx !== -1) newTray.splice(idx, 1);
        } else if (source !== null) {
          newBoard[source] = null;
        }

        // Handle occupant
        if (occupant) {
          if (source === 'tray') {
            // Occupant goes back to tray
            newTray.push(occupant);
          } else if (source !== null) {
            // Swap: occupant goes to old source slot
            newBoard[source] = occupant;
          } else {
            newTray.push(occupant);
          }
        }

        setBoard(newBoard);
        return newTray;
      });
      return prevBoard; // the real board is set inside via setBoard above
    });

    // Use a cleaner direct approach
    setBoard(b => {
      const newBoard = { ...b };
      return newBoard;
    });
  };

  /** Direct state update for a move (cleaner than nested setters) */
  const applyMove = useCallback((displayId, target) => {
    setBoard(prevBoard => {
      const newBoard = { ...prevBoard };
      setTray(prevTray => {
        const newTray  = [...prevTray];
        const src      = prevTray.includes(displayId) ? 'tray'
                       : Object.entries(prevBoard).find(([, v]) => v === displayId)?.[0] ?? null;
        const occupant = target === 'tray' ? null : newBoard[target];

        if (target === 'tray') {
          // Return piece to tray
          if (src !== 'tray' && src !== null) newBoard[src] = null;
          if (!newTray.includes(displayId)) newTray.push(displayId);
        } else {
          // Place on board slot
          newBoard[target] = displayId;
          if (occupant && occupant !== displayId) {
            if (src === 'tray') newTray.push(occupant);
            else if (src !== null) newBoard[src] = occupant;
          } else if (!occupant && src !== null && src !== 'tray') {
            newBoard[src] = null;
          }
          const trayIdx = newTray.indexOf(displayId);
          if (trayIdx !== -1) newTray.splice(trayIdx, 1);
        }

        return newTray;
      });
      return newBoard;
    });
    setMoves(m => m + 1);
    setVerifyErr('');
  }, []);

  /* ── DnD event handlers ───────────────────────────────────────────── */
  const handleDragStart = (e, displayId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', displayId);
    setDragId(displayId);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverSlot(null);
  };

  const handleDragOver = (e, target) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverSlot(target);
  };

  const handleDragLeave = () => {
    setOverSlot(null);
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    const displayId = e.dataTransfer.getData('text/plain');
    setDragId(null);
    setOverSlot(null);
    if (!displayId) return;
    applyMove(displayId, target);
  };

  /* ── click-to-place (mobile / keyboard backup) ───────────────────── */  const handlePieceClick = (displayId) => {
    if (selected === displayId) { setSelected(null); return; }
    if (selected) {
      // Swap the two
      applyMove(displayId, findSource(selected, board, tray) ?? 'tray');
      applyMove(selected, findSource(displayId, board, tray) ?? 'tray');
      setSelected(null);
      return;
    }
    setSelected(displayId);
  };

  const handleSlotClick = (slotIndex) => {
    if (!selected) return;
    applyMove(selected, String(slotIndex));
    setSelected(null);
  };

  /* ── verify ───────────────────────────────────────────────────────── */
  const verify = async () => {
    if (tray.length > 0) {
      setVerifyErr(`Place all ${tray.length} remaining piece${tray.length !== 1 ? 's' : ''} before checking.`);
      return;
    }
    setVerifying(true);
    setVerifyErr('');
    try {
      const arrangement = {};
      Object.entries(board).forEach(([slot, did]) => { if (did) arrangement[did] = Number(slot); });
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const result = await api.puzzle.verify(gameData.attemptId, { arrangement, elapsed_seconds: elapsed, moves });
      if (result.is_correct) {
        setCompleted(true);
      } else {
        setVerifyErr(`Not quite — ${result.correct_pieces}/${result.total_pieces} pieces in the right position. Keep rearranging!`);
      }
    } catch (err) {
      setVerifyErr(err.message || 'Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  /* ── tile size ──────────────────────────────────────────────────────── */
  const tileSize = gameData
    ? Math.max(44, Math.min(100, Math.floor((Math.min(window.innerWidth - 32, 560)) / gameData.gridSize) - 4))
    : 64;

  /* ── renders ─────────────────────────────────────────────────────── */
  if (status === 'loading') return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🧩</div>
      <p style={{ color: MUTED, fontSize: 17 }}>Loading puzzle…</p>
    </div>
  );

  if (status === 'error') return (
    <div style={{ textAlign: 'center', padding: 60, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
      <h2 style={{ color: TEXT }}>Could not load puzzle</h2>
      <p style={{ color: '#c85a59', background: '#ffe9e7', padding: '12px 18px', borderRadius: 10 }}>{errorMsg}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
        <button onClick={load} style={{ padding: '10px 20px', background: TEAL, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>🔄 Retry</button>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#f4f8f9', border: '1px solid #e0eaed', borderRadius: 10, cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  if (completed) return (
    <div style={{ textAlign: 'center', padding: 60, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
      <h2 style={{ color: TEXT, margin: '0 0 8px' }}>Puzzle Complete!</h2>
      {gameData.fullImageUrl && (
        <img src={gameData.fullImageUrl} alt={gameData.title}
          style={{ maxWidth: 240, borderRadius: 12, border: `2px solid ${BORDER}`, margin: '16px auto', display: 'block' }} />
      )}
      <p style={{ color: MUTED }}>Completed in {moves} moves</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setCompleted(false); load(); }}
          style={{ padding: '12px 28px', background: TEAL, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
          🔄 Play Again
        </button>
        <button onClick={() => navigate('/learning')}
          style={{ padding: '12px 28px', background: '#f4f8f9', border: `1px solid ${BORDER}`, borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15, color: TEXT }}>
          📚 Back to Learning
        </button>
      </div>
    </div>
  );

  if (!gameData) return <div style={{ padding: 60, textAlign: 'center', color: MUTED }}>Preparing…</div>;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)}
          style={{ padding: '7px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, background: '#f4f8f9', cursor: 'pointer', fontSize: 13 }}>
          ← Back
        </button>
        <h2 style={{ margin: 0, color: TEXT, flex: 1, fontSize: 'clamp(15px,4vw,22px)' }}>🧩 {gameData.title}</h2>
        <TimerReminder
          config={{ enabled: true, duration_seconds: 30, reminder_at_seconds: 0 }}
          gameType="puzzle"
          active={!completed}
          timerKey={timerKey}
          loop={true}
        />
        <span style={{ fontSize: 12, color: MUTED }}>Moves: {moves} · {tray.length} in tray</span>
      </div>

      {/* Preview */}
      {gameData.fullImageUrl && (
        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', color: TEAL, fontSize: 13, userSelect: 'none' }}>👁 Preview image</summary>
          <img src={gameData.fullImageUrl} alt={gameData.title}
            style={{ maxWidth: 200, borderRadius: 8, marginTop: 6, border: `1px solid ${BORDER}` }} />
        </details>
      )}

      {/* Instructions */}
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 8, background: '#f4f8f9', padding: '6px 10px', borderRadius: 8 }}>
        🖱 Drag pieces from the tray onto the board · Drag placed pieces to swap · Click to select/place on mobile
      </p>

      {/* Board */}
      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${gameData.gridSize}, ${tileSize}px)`, gap: 3, background: '#ecf3f5', borderRadius: 10, padding: 6, width: 'fit-content', marginBottom: 12 }}
        aria-label="Puzzle board"
      >
        {Array.from({ length: gameData.totalPieces }, (_, i) => {
          const slotKey = String(i);
          const did     = board[slotKey];
          const isOver  = overSlot === slotKey;
          const isSelected = did && selected === did;

          return (
            <div key={i}
              onDragOver={(e) => handleDragOver(e, slotKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, slotKey)}
              onClick={() => did ? handlePieceClick(did) : handleSlotClick(i)}
              role="button"
              tabIndex={0}
              aria-label={`Slot ${i + 1}${did ? ' (occupied)' : ' (empty)'}`}
              onKeyDown={e => { if (e.key === 'Enter') { did ? handlePieceClick(did) : handleSlotClick(i); } }}
              style={{
                width: tileSize, height: tileSize,
                border: `2px ${isSelected ? 'solid' : isOver ? 'dashed' : 'solid'} ${isSelected ? '#f4a225' : isOver ? TEAL : BORDER}`,
                borderRadius: 6, background: isOver ? '#e8faf8' : '#f4f8f9',
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                boxSizing: 'border-box', transition: 'border-color .12s, background .12s',
              }}
            >
              {did ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, did)}
                  onDragEnd={handleDragEnd}
                  style={{
                    width: '100%', height: '100%',
                    backgroundImage: `url(${pieceMap[did]})`,
                    backgroundSize: 'cover',
                    opacity: dragId === did ? 0.4 : 1,
                    outline: isSelected ? '3px solid #f4a225' : 'none',
                    cursor: 'grab',
                    transition: 'opacity .15s',
                  }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 11, color: '#c5d5da', fontWeight: 700 }}>
                  {i + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tray */}
      <div
        onDragOver={(e) => handleDragOver(e, 'tray')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'tray')}
        aria-label="Piece tray"
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 4,
          padding: 8, borderRadius: 10,
          border: `2px dashed ${overSlot === 'tray' ? TEAL : BORDER}`,
          background: overSlot === 'tray' ? '#e8faf8' : '#f8fdfd',
          minHeight: tileSize + 16, marginBottom: 14,
          transition: 'border-color .12s, background .12s',
        }}
      >
        {tray.length === 0 && (
          <span style={{ color: MUTED, fontSize: 12, padding: '10px 16px' }}>All pieces placed ✓</span>
        )}
        {tray.map(did => (
          <div
            key={did}
            draggable
            onDragStart={(e) => handleDragStart(e, did)}
            onDragEnd={handleDragEnd}
            onClick={() => handlePieceClick(did)}
            role="button"
            tabIndex={0}
            aria-label="Puzzle piece"
            onKeyDown={e => { if (e.key === 'Enter') handlePieceClick(did); }}
            style={{
              width: tileSize, height: tileSize,
              backgroundImage: `url(${pieceMap[did]})`,
              backgroundSize: 'cover',
              borderRadius: 6, cursor: 'grab',
              border: `3px solid ${selected === did ? '#f4a225' : BORDER}`,
              boxSizing: 'border-box',
              opacity: dragId === did ? 0.4 : 1,
              outline: selected === did ? '2px solid #f4a22555' : 'none',
              transition: 'border-color .12s, opacity .15s',
            }}
          />
        ))}
      </div>

      {/* Selection hint */}
      {selected && (
        <p style={{ fontSize: 12, color: TEAL, margin: '0 0 10px' }}>
          ← Piece selected — click an empty slot or another piece to place/swap. Click the same piece to deselect.
        </p>
      )}

      {/* Error */}
      {verifyErr && (
        <div role="alert" style={{ background: '#ffe9e7', color: '#a63c3c', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
          ⚠ {verifyErr}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={verify}
          disabled={verifying}
          style={{ padding: '10px 22px', background: TEAL, color: '#fff', border: 'none', borderRadius: 12, cursor: verifying ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: verifying ? 0.7 : 1 }}
        >
          {verifying ? 'Checking…' : tray.length === 0 ? '✓ Check Puzzle' : `Check (${tray.length} remaining)`}
        </button>
        <button
          onClick={() => { const e = {}; for (let i = 0; i < gameData.totalPieces; i++) e[String(i)] = null; setBoard(e); setTray(Object.keys(pieceMap)); setMoves(m => m + 1); setVerifyErr(''); setSelected(null); }}
          style={{ padding: '10px 16px', background: '#f4f8f9', border: `1px solid ${BORDER}`, borderRadius: 12, cursor: 'pointer', fontSize: 13 }}
        >
          ↺ Reset
        </button>
      </div>
    </main>
  );
}
