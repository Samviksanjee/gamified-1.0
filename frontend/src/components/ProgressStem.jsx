// A growing stem: one node per question. Filled leaves = finished, ringed node = current.
export default function ProgressStem({ total, index, states, items }) {
  const nodes = Array.from({ length: total }, (_, i) => i);
  const w = Math.max(total * 44, 120);
  return (
    <svg className="stem" viewBox={`0 0 ${w} 44`} role="img" aria-label={`Question ${index + 1} of ${total}`}>
      <line x1="12" y1="30" x2={w - 12} y2="30" className="stem-line" />
      {nodes.map((i) => {
        const x = 22 + i * 44;
        const st = states[items[i].id];
        const done = st?.finished;
        return (
          <g key={i} transform={`translate(${x},30)`}>
            {i === index && <circle r="13" className="stem-now" />}
            <path d="M0,0 C-10,-4 -10,-18 0,-22 C10,-18 10,-4 0,0Z" className={done ? (st.is_correct ? 'leaf-ok' : 'leaf-miss') : 'leaf-todo'} />
          </g>
        );
      })}
    </svg>
  );
}
