export default function StatCard({ icon, value, label, extra, trend }) {
  return (
    <article style={{
      background: 'white',
      border: '1px solid #e0eaed',
      borderRadius: '16px',
      padding: '19px',
      boxShadow: '0 3px 12px #183f5d05',
      minWidth: '0',
      display: 'flex',
      alignItems: 'center',
      gap: '13px'
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '14px',
        background: '#e7f8f3',
        fontSize: '21px',
        flexShrink: '0'
      }}>
        {icon}
      </div>
      <div>
        <strong style={{ display: 'block', fontSize: '25px', lineHeight: '1.2', color: '#153e67', fontWeight: '900' }}>
          {value}
        </strong>
        <small style={{ color: '#688097', fontSize: '11px', fontWeight: '700' }}>
          {label}
        </small>
        {trend && (
          <div style={{ fontSize: '11px', color: '#688097', lineHeight: '1.5', marginTop: '4px' }}>
            {trend}
          </div>
        )}
        {extra && (
          <div style={{ fontSize: '11px', color: '#688097', lineHeight: '1.5', marginTop: '4px' }}>
            {extra}
          </div>
        )}
      </div>
    </article>
  );
}
