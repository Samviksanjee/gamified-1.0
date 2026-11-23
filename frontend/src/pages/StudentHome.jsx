import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, assetUrl } from '../api.js';
import '../styles/pages.css';

const DIFF_COLOR = { easy:'#e5f8eb', medium:'#fff7dc', hard:'#ffe9e7' };
const DIFF_TEXT  = { easy:'#238650', medium:'#a77818', hard:'#c85a59' };

export default function StudentHome({ user }) {
  const [dashboard,  setDashboard]  = useState(null);
  const [crosswords, setCrosswords] = useState([]);
  const [puzzles,    setPuzzles]    = useState([]);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      const [d, cw, p] = await Promise.all([
        api.studentDashboard(),
        api.crossword.listStudent().catch(() => ({ crosswords:[] })),
        api.puzzle.list().catch(() => ({ puzzles:[] })),
      ]);
      setDashboard(d);
      setCrosswords((cw?.crosswords) || []);
      setPuzzles((p?.puzzles) || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:40, marginBottom:16, animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</div>
      <p style={{ color:'#688097', fontWeight:700 }}>Loading your dashboard…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const stats    = dashboard?.stats || {};
  const topics   = dashboard?.topics || [];
  const acc      = stats.accuracy;
  const avgScore = stats.average_score;
  const totalGames = crosswords.length + puzzles.length;

  return (
    <>
      {error && (
        <div style={{ padding:'14px 18px', background:'#ffe9e7', color:'#c85a59', borderRadius:12, marginBottom:20, fontSize:13, fontWeight:600 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Hero banner ── */}
      <section style={{
        borderRadius:20, minHeight:180, background:'linear-gradient(110deg,#e4f7fa 0%,#edf9fa 55%,#d5f1eb 100%)',
        padding:'clamp(20px,4vw,32px) clamp(20px,4vw,36px)', display:'flex', alignItems:'center',
        justifyContent:'space-between', overflow:'hidden', position:'relative', marginBottom:24,
        boxShadow:'0 4px 20px rgba(18,169,159,0.10)', gap:16,
      }}>
        <div style={{ position:'relative', zIndex:1, maxWidth:520, minWidth:0 }}>
          <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:900, color:'#078b84', textTransform:'uppercase', letterSpacing:'1px' }}>
            Your little steps make big discoveries
          </p>
          <h1 style={{ margin:'0 0 10px', fontSize:'clamp(20px,4vw,30px)', color:'#153e67', fontWeight:900, lineHeight:1.2, letterSpacing:-0.5 }}>
            Hi, {user?.name?.split(' ')[0] || 'Learner'}! 👋<br/>
            <span style={{ fontSize:'clamp(16px,3vw,24px)', color:'#19a49a' }}>Ready to learn today?</span>
          </h1>
          <p style={{ margin:'0 0 16px', fontSize:13, color:'#47677d' }}>
            Play. Recall. Apply. Grow. Every question makes you smarter.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={() => navigate('/learning')} className="btn btn-yellow" style={{ border:'none', fontSize:13 }}>
              Start REPLAY →
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-soft" style={{ fontSize:13 }}>
              My Dashboard
            </button>
          </div>
        </div>
        <div className="student-hero-art" style={{ fontSize:'clamp(60px,8vw,100px)', lineHeight:1, filter:'drop-shadow(0 8px 6px rgba(164,217,208,0.5))', flexShrink:0 }} aria-hidden="true">
          👧🏻📘
        </div>
      </section>
      <style>{`@media(max-width:400px){.student-hero-art{display:none}}`}</style>

      {/* ── Quick stats ── */}
      {dashboard && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:14, marginBottom:28 }}>
          {[
            { emoji:'🎮', val:stats.attempts_completed ?? 0, label:'Activities Done' },
            { emoji:'🎯', val:acc != null ? `${acc}%` : '—', label:'Accuracy' },
            { emoji:'⭐', val:avgScore != null ? `${avgScore}%` : '—', label:'Avg Score' },
            { emoji:'🏫', val:stats.classrooms ?? 0, label:'Classes Joined' },
          ].map(({ emoji, val, label }) => (
            <div key={label} style={{ background:'white', borderRadius:16, padding:'16px 14px', textAlign:'center', border:'1px solid #e8f0f3', boxShadow:'0 2px 8px rgba(24,63,93,0.04)' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>{emoji}</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#153e67', lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:11, color:'#688097', marginTop:4, fontWeight:700 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Feature cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginBottom:28 }}>
        {[
          { emoji:'🧠', title:'Recall',    desc:"Bring what you've learnt back from memory.", bg:'#eef8ff', path:'/learning' },
          { emoji:'🎮', title:'Play',      desc:'Explore through fun, interactive games.',     bg:'#fff7dc', path:'/learning' },
          { emoji:'🎯', title:'Apply',     desc:'Use your knowledge in new situations.',      bg:'#fff1ef', path:'/learning' },
          { emoji:'🔤', title:'Crossword', desc:'Fill in the grid one letter at a time.',     bg:'#eef4ff', path: totalGames > 0 ? '#games' : '/dashboard' },
        ].map(({ emoji, title, desc, bg, path }) => (
          <button key={title} onClick={() => {
            if (path.startsWith('#')) document.getElementById(path.slice(1))?.scrollIntoView({ behavior:'smooth' });
            else navigate(path);
          }} style={{
            background:bg, border:'1.5px solid transparent', borderRadius:16, padding:'20px 16px',
            textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center',
            gap:8, cursor:'pointer', transition:'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(24,63,93,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
          >
            <span style={{ fontSize:34 }}>{emoji}</span>
            <strong style={{ fontSize:15, color:'#153e67', fontWeight:900 }}>{title}</strong>
            <span style={{ fontSize:12, color:'#688097', lineHeight:1.5 }}>{desc}</span>
          </button>
        ))}
      </div>

      {/* ── Continue learning ── */}
      {dashboard && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:18, marginBottom:28 }}>
          {dashboard.recommended_activity ? (
            <article style={{
              background:'linear-gradient(120deg, #38b4df, #2597d1)', color:'white',
              borderRadius:18, padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center',
              boxShadow:'0 8px 24px rgba(38,150,209,0.25)',
            }}>
              <div>
                <div style={{ fontSize:11, fontWeight:900, opacity:0.85, marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>
                  TODAY'S 10-MINUTE REPLAY
                </div>
                <h3 style={{ color:'white', fontSize:18, margin:'0 0 14px', fontWeight:900, lineHeight:1.3 }}>
                  {dashboard.recommended_activity.title}
                </h3>
                <button onClick={() => navigate(`/play/a/${dashboard.recommended_activity.id}`)} className="btn btn-yellow" style={{ border:'none', fontSize:13 }}>
                  Start now →
                </button>
              </div>
              <div style={{ fontSize:56 }}>🌿</div>
            </article>
          ) : (
            <article style={{ background:'linear-gradient(120deg,#e9f8f3,#e3f3fd)', borderRadius:18, padding:'24px', border:'1.5px solid #c8eae4', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:36 }}>🎉</div>
              <h3 style={{ color:'#153e67', margin:0, fontWeight:900 }}>All caught up!</h3>
              <p style={{ color:'#688097', margin:0, fontSize:13 }}>You've completed all available activities. Ask your teacher for new assignments.</p>
              <button onClick={() => navigate('/join-classroom')} className="btn btn-primary" style={{ alignSelf:'flex-start', fontSize:13 }}>Join a class</button>
            </article>
          )}

          {/* Learning path */}
          <article style={{ background:'white', borderRadius:18, padding:'24px', border:'1px solid #e0eaed' }}>
            <h3 style={{ margin:'0 0 16px', color:'#153e67', fontWeight:900, fontSize:15 }}>Your learning path</h3>
            {topics.length > 0 ? (
              <>
                <div className="path-card" style={{ marginBottom:16 }}>
                  {topics.slice(0,4).map((topic,idx) => (
                    <div key={topic.id} className={`path-step ${topic.completion_percentage===0 && idx>0 ? 'locked' : ''}`}>
                      <div className="path-icon" style={{
                        background: topic.completion_percentage >= 80 ? '#d9f4e8' : topic.completion_percentage > 0 ? '#fff3c4' : '#eef2f4',
                        borderColor: topic.completion_percentage >= 80 ? '#6bc5a2' : topic.completion_percentage > 0 ? '#e0c050' : '#d2dce0',
                      }}>
                        {topic.completion_percentage >= 80 ? '✓' : topic.completion_percentage > 0 ? '▶' : idx===0 ? '▶' : '🔒'}
                      </div>
                      <small style={{ fontSize:10 }}>{topic.title?.split(' ').slice(0,3).join(' ')}</small>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                    <span style={{ color:'#688097', fontWeight:700 }}>Overall progress</span>
                    <span style={{ fontWeight:900, color:'#153e67' }}>{dashboard.overall_completion||0}%</span>
                  </div>
                  <div style={{ background:'#e6eff1', height:8, borderRadius:20, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${dashboard.overall_completion||0}%`, background:'linear-gradient(90deg,#16b4a5,#3bb5d8)', borderRadius:20, transition:'width .4s' }}/>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color:'#9aabb5', fontSize:13, margin:0 }}>No topics available yet.</p>
            )}
            <button onClick={() => navigate('/resources')} className="btn btn-soft" style={{ marginTop:8, fontSize:12 }}>
              Explore chapters →
            </button>
          </article>
        </div>
      )}

      {/* ── Game Center ── */}
      {totalGames > 0 && (
        <div id="games" style={{ marginBottom:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ margin:0, fontSize:17, color:'#153e67', fontWeight:900 }}>🎮 Game Center</h2>
            <span style={{ fontSize:12, color:'#688097', fontWeight:700 }}>{totalGames} game{totalGames!==1?'s':''} available</span>
          </div>

          {crosswords.length > 0 && (
            <>
              <div style={{ fontSize:12, fontWeight:800, color:'#688097', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                🔤 Crossword Puzzles
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:14, marginBottom:22 }}>
                {crosswords.map(cw => (
                  <div key={cw.id} style={{ background:'white', border:'1px solid #e0eaed', borderRadius:16, padding:'18px', boxShadow:'0 2px 8px rgba(24,63,93,0.05)', display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:30 }}>🔤</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:900, fontSize:13, color:'#153e67', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {cw.title || cw.topic}
                        </div>
                        <div style={{ fontSize:11, color:'#688097', marginTop:1 }}>
                          {[cw.grade_level ? `Grade ${cw.grade_level}` : null, cw.word_count ? `${cw.word_count} words` : null].filter(Boolean).join(' · ') || 'Crossword'}
                        </div>
                      </div>
                    </div>
                    {cw.difficulty && (
                      <span style={{ alignSelf:'flex-start', fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:999, background:DIFF_COLOR[cw.difficulty]||'#f0f4f6', color:DIFF_TEXT[cw.difficulty]||'#688097' }}>
                        {cw.difficulty.charAt(0).toUpperCase() + cw.difficulty.slice(1)}
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/play/crossword/${cw.id}`)}
                      style={{ width:'100%', padding:'8px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(100deg,#19b7a7,#079c98)', color:'white', fontWeight:900, fontSize:12, marginTop:4 }}
                    >
                      Play Crossword →
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {puzzles.length > 0 && (
            <>
              <div style={{ fontSize:12, fontWeight:800, color:'#688097', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                🧩 Puzzle Games
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:14 }}>
                {puzzles.map(p => (
                  <div key={p.puzzle_id} style={{ background:'white', border:'1px solid #e0eaed', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(24,63,93,0.05)' }}>
                    {p.thumbnail_url ? (
                      <div style={{ width:'100%', paddingBottom:'55%', position:'relative', overflow:'hidden' }}>
                        <img src={assetUrl(p.thumbnail_url)} alt={p.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
                      </div>
                    ) : (
                      <div style={{ width:'100%', paddingBottom:'55%', position:'relative', background:'linear-gradient(135deg,#e4f7fa,#edf9fa)' }}>
                        <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:40 }}>🧩</span>
                      </div>
                    )}
                    <div style={{ padding:'12px 14px' }}>
                      <div style={{ fontWeight:900, fontSize:13, color:'#153e67', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                      {p.grid_size && <div style={{ fontSize:11, color:'#688097', marginBottom:10 }}>{p.grid_size}×{p.grid_size} · {p.total_pieces} pieces</div>}
                      <button onClick={() => navigate(`/play/puzzle/${p.puzzle_id}`)} style={{ width:'100%', padding:'8px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(100deg,#19b7a7,#079c98)', color:'white', fontWeight:900, fontSize:12 }}>
                        Play Puzzle →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── How to play ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ margin:0, fontSize:17, color:'#153e67', fontWeight:900 }}>Choose how you want to play</h2>
          <button onClick={() => navigate('/learning')} style={{ background:'none', border:'none', cursor:'pointer', color:'#078b84', fontWeight:900, fontSize:13 }}>
            My learning →
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:14 }}>
          {[
            { icon:'❓', bg:'#e5f7ec', title:'Quick Quiz',           desc:'Recall key ideas with fun questions.',   btn:'Play quiz →',       onClick:() => navigate('/learning') },
            { icon:'🔢', bg:'#dff9f5', title:'Sequencing Challenge', desc:'Put concepts in the right order.',       btn:'Arrange steps →',   onClick:() => navigate('/learning') },
            { icon:'🔤', bg:'#eef4ff', title:'Crossword Puzzle',     desc:'Solve clues and fill the grid.',         btn:'Play crossword →',  onClick:() => document.getElementById('games')?.scrollIntoView({ behavior:'smooth' }) || navigate('/dashboard') },
          ].map(({ icon, bg, title, desc, btn, onClick }) => (
            <article key={title} style={{ background:'white', border:'1px solid #e0eaed', borderRadius:16, padding:'20px', display:'flex', gap:16, alignItems:'flex-start', boxShadow:'0 2px 8px rgba(24,63,93,0.04)' }}>
              <div style={{ width:68, height:68, borderRadius:16, background:bg, display:'grid', placeItems:'center', fontSize:38, flexShrink:0 }}>{icon}</div>
              <div style={{ flex:1 }}>
                <h3 style={{ margin:'0 0 6px', color:'#153e67', fontSize:15, fontWeight:900 }}>{title}</h3>
                <p style={{ margin:'0 0 14px', color:'#688097', fontSize:12, lineHeight:1.5 }}>{desc}</p>
                <button onClick={onClick} className="btn btn-primary" style={{ fontSize:12, padding:'9px 16px', border:'none' }}>{btn}</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ── Topics preview ── */}
      {topics.length > 0 && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ margin:0, fontSize:17, color:'#153e67', fontWeight:900 }}>Your topics</h2>
            <button onClick={() => navigate('/resources')} style={{ background:'none', border:'none', cursor:'pointer', color:'#078b84', fontWeight:900, fontSize:13 }}>
              All topics →
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            {topics.slice(0,6).map(topic => {
              const pct = topic.completion_percentage || 0;
              const statusLabel = pct>=80?'Mastered':pct>0?'In Progress':'Not Started';
              const statusColor = pct>=80?{bg:'#e5f8eb',fg:'#238650'}:pct>0?{bg:'#fff3d4',fg:'#a77818'}:{bg:'#f0f4f6',fg:'#688097'};
              return (
                <button key={topic.id} onClick={() => navigate('/resources')} style={{ background:'white', border:'1px solid #e0eaed', borderRadius:14, padding:'16px', textAlign:'left', cursor:'pointer', transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#7ccdc7'; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e0eaed'; e.currentTarget.style.transform='none'; }}
                >
                  <div style={{ fontSize:28, marginBottom:8 }}>{topic.icon||'📖'}</div>
                  <div style={{ fontWeight:800, fontSize:13, color:'#153e67', marginBottom:4, lineHeight:1.3 }}>{topic.title}</div>
                  <div style={{ fontSize:11, color:'#688097', marginBottom:10 }}>Grade {topic.grade} · {topic.subject}</div>
                  <div style={{ background:'#e8eef5', height:5, borderRadius:10, marginBottom:8, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'#36a9db', borderRadius:10, transition:'width .3s' }}/>
                  </div>
                  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:900, background:statusColor.bg, color:statusColor.fg }}>
                    {statusLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
