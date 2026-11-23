import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import StickerAlbum from '../components/stickers/StickerAlbum.jsx';
import '../styles/pages.css';

// ─── tiny helpers ─────────────────────────────────────────────────────────────
function Pill({ children, color = '#e5f8eb', text = '#238650' }) {
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, background:color, color:text, fontSize:11, fontWeight:900 }}>
      {children}
    </span>
  );
}

function StatCard({ emoji, value, label, color = '#eaf7f7', onClick }) {
  return (
    <div onClick={onClick} style={{
      background:color, borderRadius:16, padding:'18px 16px',
      display:'flex', flexDirection:'column', alignItems:'center',
      gap:6, textAlign:'center', border:'1px solid rgba(0,0,0,0.05)',
      cursor: onClick ? 'pointer' : 'default',
      transition:'transform .15s',
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'none')}
    >
      <div style={{ fontSize:32 }}>{emoji}</div>
      <div style={{ fontSize:26, fontWeight:900, color:'#153e67', lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontSize:11, color:'#688097', fontWeight:700 }}>{label}</div>
    </div>
  );
}

function MiniBar({ value = 0, color = '#19b7a7' }) {
  return (
    <div style={{ background:'#e6eff1', height:7, borderRadius:20, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.min(value,100)}%`, background:color, borderRadius:20, transition:'width .4s' }} />
    </div>
  );
}

function SectionHead({ children, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'28px 0 14px', flexWrap:'wrap', gap:8 }}>
      <h2 style={{ margin:0, fontSize:17, color:'#153e67', fontWeight:900 }}>{children}</h2>
      {action}
    </div>
  );
}

function BadgeCard({ badge }) {
  const earned = badge.earned;
  return (
    <div style={{
      background:earned?'white':'#f8fafc', border:`1.5px solid ${earned?'#d4e8e0':'#e4ecef'}`,
      borderRadius:16, padding:'18px 14px', textAlign:'center',
      opacity:earned?1:0.65, boxShadow:earned?'0 4px 14px rgba(24,63,93,0.07)':'none', position:'relative',
    }}>
      {!earned && <div style={{ position:'absolute', top:10, right:10, fontSize:14 }}>🔒</div>}
      <div style={{ fontSize:44, marginBottom:8, filter:earned?'none':'grayscale(1)' }}>{badge.icon}</div>
      <div style={{ fontWeight:900, fontSize:13, color:'#153e67', marginBottom:4 }}>{badge.name}</div>
      <div style={{ fontSize:11, color:'#688097', lineHeight:1.5, marginBottom:8 }}>{badge.description}</div>
      {earned
        ? <Pill>{badge.earned_at ? `Earned ${badge.earned_at.slice(0,10)}` : 'Earned!'}</Pill>
        : <Pill color="#f1f5f7" text="#8097a3">Locked</Pill>
      }
    </div>
  );
}

const STATUS_CONFIG = {
  'Mastered':       { dot:'#4dbb85', bg:'#e5f8eb', text:'#238650' },
  'Practising':     { dot:'#f4c64d', bg:'#fff3d4', text:'#a77818' },
  'Needs Practice': { dot:'#f07878', bg:'#ffe9e7', text:'#c85a59' },
};

function TrendChart({ data }) {
  if (!data || data.length < 2) return (
    <div style={{ padding:'24px', textAlign:'center', color:'#8097a3', fontSize:13 }}>
      Complete more activities to see your trend.
    </div>
  );
  const H = 80, W = 100;
  const pts = data.map((d,i) => ({ x:(i/(data.length-1))*W, y:H-(d.accuracy/100)*H, acc:d.accuracy, date:d.date }));
  const polyline = pts.map(p=>`${p.x},${p.y}`).join(' ');
  return (
    <div style={{ position:'relative', height:100, padding:'8px 0' }}>
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ width:'100%', height:H, display:'block' }}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#19b7a7" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#19b7a7" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${polyline} ${W},${H}`} fill="url(#tg)"/>
        <polyline points={polyline} fill="none" stroke="#19b7a7" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="white" stroke="#19b7a7" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>)}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#9aabb5', marginTop:4 }}>
        {pts.map((p,i) => <span key={i}>{p.date?.slice(5)}</span>)}
      </div>
    </div>
  );
}

function SubjectBars({ subjects }) {
  if (!subjects?.length) return <p style={{ color:'#9aabb5', fontSize:13 }}>No subject data yet.</p>;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {subjects.map(s => (
        <div key={s.subject}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:12, fontWeight:700 }}>
            <span style={{ color:'#153e67' }}>{s.subject}</span>
            <span style={{ color:'#688097' }}>{s.average_score ?? '—'}%</span>
          </div>
          <MiniBar value={s.average_score ?? 0} color="#36a9db"/>
        </div>
      ))}
    </div>
  );
}

const GAME_ICON = { quiz:'🎯', matching:'🔗', sequencing:'🔀', puzzle:'🧩', crossword:'🔤' };
const GAME_LABEL = { quiz:'Quiz', matching:'Matching', sequencing:'Sequencing', puzzle:'Puzzle', crossword:'Crossword' };
const DIFF_COLOR = { easy:'#e5f8eb', medium:'#fff7dc', hard:'#ffe9e7' };
const DIFF_TEXT  = { easy:'#238650', medium:'#a77818', hard:'#c85a59' };

// ─── Game card (unified for puzzle + crossword) ───────────────────────────────
function GameCard({ icon, title, subtitle, badge, diffLabel, diffColor, diffText, onPlay, playLabel = 'Play →' }) {
  return (
    <div style={{ background:'white', border:'1px solid #e0eaed', borderRadius:16, padding:'18px', boxShadow:'0 2px 8px rgba(24,63,93,0.05)', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ fontSize:34, lineHeight:1, flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:900, fontSize:13, color:'#153e67', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
          <div style={{ fontSize:11, color:'#688097', marginTop:2 }}>{subtitle}</div>
        </div>
        {badge && (
          <span style={{ flexShrink:0, fontSize:10, fontWeight:900, padding:'3px 8px', borderRadius:999, background:'#e5f8eb', color:'#238650' }}>{badge}</span>
        )}
      </div>
      {diffLabel && (
        <span style={{ alignSelf:'flex-start', fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:999, background: diffColor || '#f0f4f6', color: diffText || '#688097' }}>
          {diffLabel}
        </span>
      )}
      <button
        onClick={onPlay}
        style={{ width:'100%', padding:'9px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(100deg,#19b7a7,#079c98)', color:'white', fontWeight:900, fontSize:12, marginTop:'auto' }}
      >
        {playLabel}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [stats,       setStats]       = useState(null);
  const [dashboard,   setDashboard]   = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [puzzles,     setPuzzles]     = useState([]);
  const [crosswords,  setCrosswords]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [album,       setAlbum]       = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, d, a, p, cw, st] = await Promise.all([
        api.studentStats(),
        api.studentDashboard(),
        api.studentAssignments().catch(() => []),
        api.puzzle.list().catch(() => ({ puzzles:[] })),
        api.crossword.listStudent().catch(() => ({ crosswords:[] })),
        api.stickers().catch(() => null),
      ]);
      setStats(s);
      setDashboard(d);
      setAssignments(a || []);
      setPuzzles((p?.puzzles) || []);
      setCrosswords((cw?.crosswords) || []);
      setAlbum(st);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) return (
    <div style={{ textAlign:'center', padding:60 }}>
      <div style={{ fontSize:36, marginBottom:16 }}>⏳</div>
      <p style={{ color:'#688097' }}>Loading your dashboard…</p>
    </div>
  );

  const overall     = stats?.overall || {};
  const badges      = stats?.badges || [];
  const concepts    = stats?.concepts || [];
  const subjects    = stats?.subject_performance || [];
  const trend       = stats?.accuracy_trend || [];
  const recent      = stats?.recent_activity || [];
  const dailyPct    = Math.min(Math.round(((dashboard?.daily_progress||0)/(dashboard?.daily_goal||10))*100),100);
  const earnedCount = badges.filter(b=>b.earned).length;
  const pendingAssign = assignments.filter(a=>a.status!=='Completed');
  const totalGames  = puzzles.length + crosswords.length;

  return (
    <>
      {error && (
        <div style={{ padding:14, background:'#ffe0e0', color:'#c00', borderRadius:10, marginBottom:20 }}>
          {error}{' '}
          <button style={{ marginLeft:12, fontWeight:800, cursor:'pointer', background:'none', border:'none', color:'#c00' }} onClick={loadAll}>Retry</button>
        </div>
      )}

      {/* Welcome banner */}
      <div style={{
        background:'linear-gradient(110deg,#e4f7fa,#edf9fa 55%,#d5f1eb)',
        borderRadius:18, padding:'clamp(18px,3vw,28px) clamp(18px,3vw,32px)', marginBottom:24,
        display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap',
      }}>
        <div>
          <div style={{ fontSize:11, fontWeight:900, color:'#078b84', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>Your Learning Space</div>
          <h1 style={{ margin:'0 0 8px', fontSize:'clamp(20px,4vw,28px)', color:'#153e67', fontWeight:900 }}>
            Hi, {user?.name?.split(' ')[0] || 'Learner'}! 🌟
          </h1>
          <p style={{ margin:0, color:'#47677d', fontSize:14 }}>Ready for another learning adventure? You're doing great!</p>
          {user?.phone_number && (
            <p style={{ margin:'6px 0 0', color:'#688097', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
              <span aria-hidden="true">📞</span>
              <span>{user.phone_number}</span>
            </p>
          )}
        </div>
        <div style={{ fontSize:'clamp(48px,8vw,72px)', lineHeight:1 }}>🦔</div>
      </div>

      {/* Daily goal */}
      <div style={{
        background:'white', border:'1.5px solid #5bbeb8', borderRadius:16,
        padding:'16px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
      }}>
        <div style={{ fontSize:36, flexShrink:0 }}>⏱️</div>
        <div style={{ flex:1, minWidth:140 }}>
          <div style={{ fontWeight:900, color:'#153e67', marginBottom:4, fontSize:14 }}>
            Daily Goal: Answer {dashboard?.daily_goal || 10} questions
          </div>
          <MiniBar value={dailyPct} color="#19b7a7"/>
        </div>
        <div style={{ fontWeight:900, fontSize:16, color:'#153e67', whiteSpace:'nowrap' }}>
          {dashboard?.daily_progress||0}/{dashboard?.daily_goal||10}
        </div>
        <Pill color={dailyPct>=100?'#e5f8eb':'#eaf7f7'} text={dailyPct>=100?'#238650':'#147d81'}>
          {dailyPct>=100?'✓ Done!':`${dailyPct}%`}
        </Pill>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:14, marginBottom:28 }}>
        <StatCard emoji="🎮" value={overall.total_attempts}       label="Activities Played"  color="#eaf7f7"/>
        <StatCard emoji="✅" value={overall.total_questions}      label="Questions Answered" color="#e5f8eb"/>
        <StatCard emoji="🎯" value={overall.accuracy!=null?`${overall.accuracy}%`:'—'}        label="Accuracy"          color="#fff7dc"/>
        <StatCard emoji="⭐" value={overall.average_score!=null?`${overall.average_score}%`:'—'} label="Avg Score"      color="#fff0ef"/>
        <StatCard emoji="🏅" value={album?.summary?.collected ?? 0}   label="Stickers Collected"      color="#f3f0ff"/>
        <StatCard emoji="🔤" value={crosswords.length}            label="Crosswords"         color="#eef4ff"
          onClick={crosswords.length > 0 ? () => document.getElementById('game-center')?.scrollIntoView({ behavior:'smooth' }) : undefined}
        />
      </div>

      {/* Assignments + Recent */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap:22 }}>
        <div>
          <SectionHead>
            📋 Your Assignments
            <span style={{ fontSize:12, color:'#688097', fontWeight:600 }}>{pendingAssign.length} pending</span>
          </SectionHead>
          {pendingAssign.length === 0 ? (
            <div style={{ padding:'24px 0', color:'#8097a3', fontSize:13, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
              All caught up! No pending assignments.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {pendingAssign.slice(0,6).map(a => {
                const ss = ({ New:{bg:'#eaf7f7',fg:'#147d81'}, 'In Progress':{bg:'#fff3d4',fg:'#a77818'}, Overdue:{bg:'#ffe9e7',fg:'#c85a59'}, Completed:{bg:'#e5f8eb',fg:'#238650'} })[a.status] || {bg:'#f0f4f6',fg:'#688097'};
                const playPath = a.game_type==='puzzle' ? `/play/puzzle/${a.activity_id}` : a.game_type==='crossword' ? `/play/crossword/${a.activity_id}` : `/play/a/${a.activity_id}`;
                return (
                  <div key={`${a.activity_id}-${a.classroom_id}`} style={{ background:'white', border:'1px solid #e0eaed', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:28 }}>{GAME_ICON[a.game_type]||'📋'}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:13, color:'#153e67', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.game_type === 'sequencing' && a.title ? a.title : a.topic_title}</div>
                      <div style={{ fontSize:11, color:'#688097' }}>{a.subject} · Grade {a.grade} · {a.difficulty} · {a.classroom_name}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                      <Pill color={ss.bg} text={ss.fg}>{a.status}</Pill>
                      <button onClick={() => navigate(playPath)} style={{ fontSize:11, fontWeight:900, padding:'5px 12px', borderRadius:999, border:'none', cursor:'pointer', background:'linear-gradient(100deg,#19b7a7,#079c98)', color:'white' }}>
                        Start →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <SectionHead>🕓 Recent Activity</SectionHead>
          {recent.length === 0 ? (
            <div style={{ padding:'24px 0', color:'#8097a3', fontSize:13, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🌱</div>
              No activity yet. Start a quiz!
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {recent.slice(0,6).map((r,i) => (
                <div key={r.attempt_id||i} style={{ background:'white', border:'1px solid #e0eaed', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ fontSize:26 }}>{GAME_ICON[r.game_type]||'📋'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:12, color:'#153e67', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.activity_title}</div>
                    <div style={{ fontSize:11, color:'#688097' }}>{r.completed_at?.slice(0,10)} · {r.correct_questions}/{r.total_questions} correct</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:900, fontSize:15, color:r.score>=70?'#238650':'#c85a59' }}>{r.score??'—'}%</div>
                    <div style={{ fontSize:10, color:'#9aabb5' }}>score</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Game Center */}
      {totalGames > 0 && (
        <div id="game-center" style={{ marginTop:28 }}>
          <SectionHead>
            🎮 Game Center
            <span style={{ fontSize:12, color:'#688097', fontWeight:600 }}>{totalGames} game{totalGames!==1?'s':''} available</span>
          </SectionHead>

          {/* Crosswords */}
          {crosswords.length > 0 && (
            <>
              <div style={{ fontSize:13, fontWeight:800, color:'#688097', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                🔤 Crossword Puzzles
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14, marginBottom:22 }}>
                {crosswords.map(cw => (
                  <GameCard
                    key={cw.id}
                    icon="🔤"
                    title={cw.title || cw.topic}
                    subtitle={[
                      cw.grade_level ? `Grade ${cw.grade_level}` : null,
                      cw.word_count ? `${cw.word_count} words` : null,
                    ].filter(Boolean).join(' · ') || 'Crossword'}
                    diffLabel={cw.difficulty ? cw.difficulty.charAt(0).toUpperCase() + cw.difficulty.slice(1) : null}
                    diffColor={DIFF_COLOR[cw.difficulty] || '#f0f4f6'}
                    diffText={DIFF_TEXT[cw.difficulty] || '#688097'}
                    onPlay={() => navigate(`/play/crossword/${cw.id}`)}
                    playLabel="Play Crossword →"
                  />
                ))}
              </div>
            </>
          )}

          {/* Puzzles */}
          {puzzles.length > 0 && (
            <>
              <div style={{ fontSize:13, fontWeight:800, color:'#688097', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                🧩 Puzzle Games
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14 }}>
                {puzzles.map(p => (
                  <GameCard
                    key={p.puzzle_id}
                    icon="🧩"
                    title={p.title}
                    subtitle={p.grid_size ? `${p.grid_size}×${p.grid_size} grid · ${p.total_pieces} pieces` : 'Puzzle'}
                    onPlay={() => navigate(`/play/puzzle/${p.puzzle_id}`)}
                    playLabel="Play Puzzle →"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap:22, marginTop:28 }}>
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0eaed', padding:'18px 20px' }}>
          <h3 style={{ margin:'0 0 12px', fontSize:14, color:'#153e67', fontWeight:900 }}>📈 Accuracy Trend</h3>
          <TrendChart data={trend}/>
        </div>
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0eaed', padding:'18px 20px' }}>
          <h3 style={{ margin:'0 0 14px', fontSize:14, color:'#153e67', fontWeight:900 }}>📚 Performance by Subject</h3>
          <SubjectBars subjects={subjects}/>
        </div>
      </div>

      {/* Concepts */}
      <SectionHead>🎯 Concepts Needing Practice</SectionHead>
      {concepts.length === 0 ? (
        <p style={{ color:'#8097a3', fontSize:13 }}>Complete some activities to see topic performance.</p>
      ) : (
        <div style={{ background:'white', borderRadius:16, border:'1px solid #e0eaed', overflow:'hidden' }}>
          <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:440 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Topic','Grade','Subject','Score','Status'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 16px', fontSize:11, color:'#688097', fontWeight:900, borderBottom:'1px solid #edf1f2' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {concepts.map(c => {
                  const cfg = STATUS_CONFIG[c.status]||{dot:'#ccc',bg:'#f0f4f6',text:'#688097'};
                  return (
                    <tr key={c.topic_id} style={{ borderBottom:'1px solid #edf1f2' }}>
                      <td style={{ padding:'10px 16px', fontWeight:700, fontSize:13, color:'#153e67' }}>{c.title}</td>
                      <td style={{ padding:'10px 16px', fontSize:12, color:'#688097' }}>{c.grade}</td>
                      <td style={{ padding:'10px 16px', fontSize:12, color:'#688097' }}>{c.subject}</td>
                      <td style={{ padding:'10px 16px', fontWeight:900, color:'#153e67', fontSize:13 }}>{c.average_score}%</td>
                      <td style={{ padding:'10px 16px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:999, background:cfg.bg, color:cfg.text, fontSize:11, fontWeight:900 }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, flexShrink:0 }}/>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sticker album (replaces the old generic badge grid) */}
      <div style={{ marginBottom: 32 }}>
        <StickerAlbum initial={album} />
      </div>
    </>
  );
}