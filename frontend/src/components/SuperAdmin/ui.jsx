import { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/superadmin-ui.css';

/* ── formatting: a missing value is shown as an em dash, never as a made-up 0 ───────────────────────── */
export const fmtNum = (v) => (v === null || v === undefined ? '—' : Number(v).toLocaleString());
export const fmtPct = (v) => (v === null || v === undefined ? '—' : `${v}%`);
export const fmtDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); };
export const fmtDateTime = (iso) => { if (!iso) return '—'; const d = new Date(iso); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
export const fmtDuration = (s) => (s == null ? '—' : s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`);
export const GAME_NAMES = { quiz: 'Quiz', matching: 'Matching', sequencing: 'Sequencing', crossword: 'Crossword', puzzle: 'Puzzle' };

/** Load data from the API. Stale responses are ignored; errors are surfaced (never replaced with sample data). */
export function useAdminData(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const ticket = useRef(0);
  const run = useCallback(async () => {
    const mine = ++ticket.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await loader();
      if (mine === ticket.current) setState({ data, loading: false, error: '' });
    } catch (err) {
      if (mine === ticket.current) setState((s) => ({ data: s.data, loading: false, error: err.message || 'Something went wrong while loading this data.' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); return () => { ticket.current += 1; }; }, [run]);
  return { ...state, reload: run };
}

export function Skeleton({ height = 18, width = '100%', style }) {
  return <div className="sa-skel" aria-hidden="true" style={{ height, width, ...style }} />;
}
export function PanelSkeleton({ rows = 4 }) {
  return <div role="status" aria-label="Loading" style={{ display: 'grid', gap: 10 }}>{Array.from({ length: rows }, (_, i) => <Skeleton key={i} height={i === 0 ? 24 : 16} width={i === 0 ? '40%' : `${90 - i * 8}%`} />)}</div>;
}
export function EmptyState({ title = 'Nothing here yet', children }) {
  return <div className="sa-state" role="status"><strong>{title}</strong>{children}</div>;
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="sa-alert" role="alert" style={{ marginBottom: 14 }}>
      <span aria-hidden="true">⚠️</span>
      <div><strong>We could not load this data</strong><p>{message}</p>{onRetry && <button type="button" className="sa-btn sa-btn-ghost sm" style={{ marginTop: 8 }} onClick={onRetry}>Try again</button>}</div>
    </div>
  );
}
/** Wraps a data hook result: skeleton first load, error state, then children(data). */
export function Async({ result, rows = 4, children }) {
  if (result.error && !result.data) return <ErrorState message={result.error} onRetry={result.reload} />;
  if (!result.data) return <PanelSkeleton rows={rows} />;
  return <>{result.error && <ErrorState message={result.error} onRetry={result.reload} />}{children(result.data)}</>;
}

export function Panel({ title, subtitle, actions, children, info, style }) {
  return (
    <section className="sa-panel" style={style} aria-label={title}>
      {(title || actions) && <header><div>{title && <h3>{title}{info && <span className="sa-info" title={info} role="img" aria-label={info}>?</span>}</h3>}{subtitle && <p className="sa-sub">{subtitle}</p>}</div>{actions}</header>}
      {children}
    </section>
  );
}

export function KpiCard({ icon: Icon, label, value, note, trend, loading, info }) {
  const up = typeof trend === 'number' && trend >= 0;
  return (
    <article className="sa-panel sa-kpi" aria-busy={loading || undefined}>
      <div className="sa-kpi-top"><span className="ico" aria-hidden="true">{Icon && <Icon size={18} />}</span><span>{label}{info && <span className="sa-info" title={info} role="img" aria-label={info}>?</span>}</span></div>
      {loading ? <Skeleton height={32} width="55%" /> : (
        <div className="sa-kpi-value">{value}{typeof trend === 'number' && <span className={`sa-trend ${up ? 'up' : 'down'}`} title="Compared with the previous period of the same length">{up ? '▲' : '▼'} {Math.abs(trend)}%</span>}</div>
      )}
      {note && <div className="sa-kpi-note">{note}</div>}
    </article>
  );
}

export function StatusBadge({ status }) {
  return <span className={`sa-badge ${String(status).toLowerCase()}`}>{String(status).replace(/_/g, ' ')}</span>;
}

export function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  return (
    <div className="sa-tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => <button key={t.key} type="button" role="tab" className="sa-tab" aria-selected={value === t.key} onClick={() => onChange(t.key)}>{t.label}{t.count != null ? ` (${t.count})` : ''}</button>)}
    </div>
  );
}

/* ── filters ─────────────────────────────────────────────────────────────── */
export const PRESETS = [['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['3m', 'Last 3 months'], ['6m', 'Last 6 months'], ['ytd', 'This year'], ['custom', 'Custom']];

/** Date range control. value = {range, start, end}. A custom range is only applied once both dates are valid. */
export function DateRangeFilter({ value, onChange }) {
  const invalid = value.range === 'custom' && value.start && value.end && value.end < value.start;
  return (
    <div className="sa-filters" style={{ marginBottom: 0 }} role="group" aria-label="Date range">
      <span className="sa-chips">{PRESETS.map(([key, label]) => <button key={key} type="button" className="sa-chip" aria-pressed={value.range === key} onClick={() => onChange({ ...value, range: key })}>{label}</button>)}</span>
      {value.range === 'custom' && (
        <>
          <label className="sa-field sm">From<input type="date" value={value.start || ''} max={value.end || undefined} onChange={(e) => onChange({ ...value, start: e.target.value })} /></label>
          <label className={`sa-field sm${invalid ? ' invalid' : ''}`}>To<input type="date" value={value.end || ''} min={value.start || undefined} onChange={(e) => onChange({ ...value, end: e.target.value })} />
            {invalid && <span className="sa-err" role="alert">End date must be after the start date.</span>}</label>
        </>
      )}
    </div>
  );
}
/** Query params for the API; an incomplete/invalid custom range falls back to the last 30 days instead of sending bad input. */
export const rangeParams = (v) => (v.range === 'custom' ? (v.start && v.end && v.end >= v.start ? { range: 'custom', start: v.start, end: v.end } : { range: '30d' }) : { range: v.range });
export const DEFAULT_RANGE = { range: '30d', start: '', end: '' };

export function Select({ label, value, onChange, options, placeholder = 'All', className = 'sm' }) {
  return (
    <label className={`sa-field ${className}`}>{label}
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </label>
  );
}
export function SearchBox({ value, onChange, placeholder = 'Search…', label = 'Search' }) {
  const [text, setText] = useState(value || '');
  useEffect(() => { const t = setTimeout(() => text !== (value || '') && onChange(text), 350); return () => clearTimeout(t); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return <label className="sa-field grow">{label}<input type="search" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} /></label>;
}

/* ── table ───────────────────────────────────────────────────────────────── */
export function DataTable({ columns, rows, sort, onSort, meta, onPage, loading, empty, rowKey = 'id', caption }) {
  return (
    <>
      <div className="sa-table-wrap" tabIndex={0} aria-label={caption} role="region" aria-busy={loading || undefined}>
        <table className="sa-table">
          {caption && <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{caption}</caption>}
          <thead><tr>{columns.map((c) => (
            <th key={c.key} className={c.align === 'right' ? 'num' : undefined} aria-sort={c.sortKey && sort?.key === c.sortKey ? (sort.order === 'asc' ? 'ascending' : 'descending') : undefined}>
              {c.sortKey && onSort ? <button type="button" onClick={() => onSort(c.sortKey)}>{c.label}{sort?.key === c.sortKey ? (sort.order === 'asc' ? ' ▲' : ' ▼') : ''}</button> : c.label}
            </th>))}</tr></thead>
          <tbody>
            {loading && !rows?.length ? Array.from({ length: 5 }, (_, i) => <tr key={i}>{columns.map((c) => <td key={c.key}><Skeleton height={14} /></td>)}</tr>)
              : (rows || []).map((r) => <tr key={r[rowKey]}>{columns.map((c) => <td key={c.key} className={c.align === 'right' ? 'num' : undefined}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}</tr>)}
          </tbody>
        </table>
        {!loading && !rows?.length && <EmptyState title={empty || 'No results'}>Nothing matches the current filters.</EmptyState>}
      </div>
      {meta && onPage && (
        <nav className="sa-pager" aria-label="Pagination">
          <span>{meta.total ? `Showing ${(meta.page - 1) * meta.page_size + 1}–${Math.min(meta.page * meta.page_size, meta.total)} of ${meta.total}` : '0 results'}</span>
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="sa-btn sa-btn-ghost sm" disabled={meta.page <= 1 || loading} onClick={() => onPage(meta.page - 1)}>Previous</button>
            <span>Page {meta.page} of {meta.pages}</span>
            <button type="button" className="sa-btn sa-btn-ghost sm" disabled={meta.page >= meta.pages || loading} onClick={() => onPage(meta.page + 1)}>Next</button>
          </span>
        </nav>
      )}
    </>
  );
}

/** Sort + paging state for a server-side table. */
export function useTableState(initial = {}) {
  const [state, setState] = useState({ page: 1, sort: initial.sort || null, order: initial.order || 'desc', filters: initial.filters || {} });
  const setFilter = (patch) => setState((s) => ({ ...s, page: 1, filters: { ...s.filters, ...patch } }));
  const setPage = (page) => setState((s) => ({ ...s, page }));
  const toggleSort = (key) => setState((s) => ({ ...s, page: 1, sort: key, order: s.sort === key && s.order === 'asc' ? 'desc' : 'asc' }));
  return { ...state, setFilter, setPage, toggleSort, params: { ...state.filters, sort: state.sort || undefined, order: state.order, page: state.page } };
}

export function Modal({ title, onClose, children, labelledBy = 'sa-modal-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector('input, button, select')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [onClose]);
  return (
    <div className="sa-modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sa-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 id={labelledBy} style={{ margin: 0, fontSize: 18, color: 'var(--sa-navy)' }}>{title}</h2>
          <button type="button" className="sa-icon-btn" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
