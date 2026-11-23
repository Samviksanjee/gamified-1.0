import { useId } from 'react';

/**
 * Small dependency-free SVG charts. They only DRAW the numbers the API returned (no data is invented here).
 * Every chart scales with its container (viewBox) and exposes a text summary for screen readers.
 */
export const PALETTE = ['#12a99f', '#36a9db', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#22c55e', '#ef4444', '#0ea5e9', '#a16207'];

const niceMax = (max) => {
  if (!max || max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};
const shorten = (text, n = 12) => (String(text).length > n ? `${String(text).slice(0, n - 1)}…` : String(text));

export function ChartEmpty({ message = 'No data for this period.' }) {
  return <div className="sa-state" role="status"><strong>{message}</strong>Try a wider date range.</div>;
}

/** Vertical bars. data: [{label, value, color?}]; value null = no data (drawn as an empty slot). */
export function BarChart({ data, title, unit = '', height = 220, max, colorFor }) {
  const id = useId();
  const real = (data || []).filter((d) => d.value !== null && d.value !== undefined);
  if (!data?.length || !real.length) return <ChartEmpty />;
  const W = 560, H = height, L = 38, B = 46, T = 12, R = 8;
  const top = max ?? niceMax(Math.max(...real.map((d) => d.value)));
  const bw = Math.min(54, (W - L - R) / data.length - 10);
  const step = (W - L - R) / data.length;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  return (
    <figure style={{ margin: 0 }}>
      <svg className="sa-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id}>
        <title id={id}>{title}. {data.map((d) => `${d.label}: ${d.value ?? 'no data'}${d.value != null ? unit : ''}`).join('; ')}</title>
        {ticks.map((t) => {
          const y = T + (H - T - B) * (1 - t / top);
          return <g key={t}><line x1={L} x2={W - R} y1={y} y2={y} stroke="#e6eef1" /><text x={L - 6} y={y + 4} textAnchor="end">{Number.isInteger(t) ? t : t.toFixed(1)}</text></g>;
        })}
        {data.map((d, i) => {
          const x = L + i * step + (step - bw) / 2;
          const h = d.value == null ? 0 : (H - T - B) * (d.value / top);
          const y = H - B - h;
          return (
            <g key={`${d.label}-${i}`} className="sa-bar-hit">
              <rect x={x} y={y} width={bw} height={Math.max(h, d.value == null ? 0 : 2)} rx="5" fill={d.color || colorFor?.(d, i) || PALETTE[i % PALETTE.length]}><title>{d.label}: {d.value ?? 'no data'}{d.value != null ? unit : ''}</title></rect>
              {d.value != null ? <text x={x + bw / 2} y={y - 5} textAnchor="middle" style={{ fill: '#153e67' }}>{d.value}{unit}</text> : <text x={x + bw / 2} y={H - B - 6} textAnchor="middle">–</text>}
              <text x={x + bw / 2} y={H - B + 16} textAnchor="middle">{shorten(d.label, Math.max(6, Math.floor(70 / data.length) + 6))}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/** Lines over time. series: [{key, label, color?}], rows: [{x, [key]: number|null}] */
export function LineChart({ rows, series, title, unit = '', height = 230, xLabel = (x) => x }) {
  const id = useId();
  const values = (rows || []).flatMap((r) => series.map((s) => r[s.key])).filter((v) => v != null);
  if (!rows?.length || !values.length) return <ChartEmpty />;
  const W = 560, H = height, L = 38, B = 34, T = 12, R = 10;
  const top = niceMax(Math.max(...values));
  const x = (i) => (rows.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (rows.length - 1));
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const tickIdx = rows.length <= 6 ? rows.map((_, i) => i) : [0, Math.floor(rows.length / 3), Math.floor((2 * rows.length) / 3), rows.length - 1];
  return (
    <figure style={{ margin: 0 }}>
      <svg className="sa-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id}>
        <title id={id}>{title}. {series.map((s) => `${s.label}: ${rows.map((r) => r[s.key] ?? '–').join(', ')}`).join('. ')}</title>
        {[0, 0.5, 1].map((f) => <g key={f}><line x1={L} x2={W - R} y1={y(f * top)} y2={y(f * top)} stroke="#e6eef1" /><text x={L - 6} y={y(f * top) + 4} textAnchor="end">{Number.isInteger(f * top) ? f * top : (f * top).toFixed(1)}</text></g>)}
        {series.map((s, si) => {
          const color = s.color || PALETTE[si % PALETTE.length];
          const pts = rows.map((r, i) => (r[s.key] == null ? null : [x(i), y(r[s.key])]));
          const path = pts.reduce((d, p, i) => (p ? `${d}${pts[i - 1] ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)} ` : d), '');
          return <g key={s.key}><path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => p && <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill={color}><title>{s.label} · {xLabel(rows[i].x)}: {rows[i][s.key]}{unit}</title></circle>)}</g>;
        })}
        {tickIdx.map((i) => <text key={i} x={x(i)} y={H - 10} textAnchor={i === 0 ? 'start' : i === rows.length - 1 ? 'end' : 'middle'}>{xLabel(rows[i].x)}</text>)}
      </svg>
      {series.length > 1 && <figcaption className="sa-legend">{series.map((s, i) => <span key={s.key}><i style={{ background: s.color || PALETTE[i % PALETTE.length] }} />{s.label}</span>)}</figcaption>}
    </figure>
  );
}

/** Donut. data: [{label, value, color?}] */
export function DonutChart({ data, title, centerLabel, size = 170 }) {
  const id = useId();
  const total = (data || []).reduce((n, d) => n + (d.value || 0), 0);
  if (!total) return <ChartEmpty message="Nothing to show yet." />;
  const R = 62, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <figure style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg viewBox="0 0 170 170" width={size} height={size} role="img" aria-labelledby={id} style={{ maxWidth: '100%' }}>
        <title id={id}>{title}. {data.map((d) => `${d.label}: ${d.value}`).join('; ')}</title>
        <g transform="rotate(-90 85 85)">
          {data.map((d, i) => {
            const len = (d.value / total) * C;
            const el = <circle key={d.label} cx="85" cy="85" r={R} fill="none" stroke={d.color || PALETTE[i % PALETTE.length]} strokeWidth="22" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}><title>{d.label}: {d.value}</title></circle>;
            offset += len;
            return el;
          })}
        </g>
        <text x="85" y="84" textAnchor="middle" style={{ fontSize: 24, fontWeight: 900, fill: '#153e67' }}>{total}</text>
        <text x="85" y="102" textAnchor="middle">{centerLabel}</text>
      </svg>
      <figcaption className="sa-legend" style={{ flexDirection: 'column', margin: 0 }}>
        {data.map((d, i) => <span key={d.label}><i style={{ background: d.color || PALETTE[i % PALETTE.length] }} />{d.label}: <b>{d.value}</b></span>)}
      </figcaption>
    </figure>
  );
}

/** Horizontal stacked bars, one row per item: assigned / attempted / completed / pending. */
export function HorizontalBars({ rows, keys, title }) {
  const id = useId();
  if (!rows?.length) return <ChartEmpty />;
  const max = Math.max(...rows.flatMap((r) => keys.map((k) => r[k.key] || 0)), 1);
  const rowH = 20 + keys.length * 14;
  return (
    <figure style={{ margin: 0 }}>
      <svg className="sa-chart" viewBox={`0 0 560 ${rows.length * rowH + 8}`} role="img" aria-labelledby={id}>
        <title id={id}>{title}. {rows.map((r) => `${r.label}: ${keys.map((k) => `${k.label} ${r[k.key] || 0}`).join(', ')}`).join('; ')}</title>
        {rows.map((r, ri) => (
          <g key={r.label + ri} transform={`translate(0 ${ri * rowH})`}>
            <text x="0" y="12" style={{ fill: '#153e67' }}>{shorten(r.label, 40)}</text>
            {keys.map((k, ki) => {
              const w = ((r[k.key] || 0) / max) * 400;
              return <g key={k.key}><rect x="0" y={18 + ki * 14} width={Math.max(w, r[k.key] ? 2 : 0)} height="10" rx="3" fill={k.color}><title>{k.label}: {r[k.key] || 0}</title></rect><text x={Math.max(w, 2) + 6} y={27 + ki * 14}>{r[k.key] || 0}</text></g>;
            })}
          </g>
        ))}
      </svg>
      <figcaption className="sa-legend">{keys.map((k) => <span key={k.key}><i style={{ background: k.color }} />{k.label}</span>)}</figcaption>
    </figure>
  );
}
