export default function StatisticsCard({
  title,
  value,
  icon,
  trend,
  color = '#e7f8f3',
}) {
  // Determine trend display
  const getTrendDisplay = () => {
    if (!trend) return null;
    const isPositive = trend >= 0;
    const arrow = isPositive ? '↑' : '↓';
    const textColor = isPositive ? '#10a981' : '#f25959';
    return (
      <div style={{ fontSize: '12px', color: textColor, fontWeight: '700', marginTop: '6px' }}>
        {arrow} {Math.abs(trend)}%
      </div>
    );
  };

  return (
    <article style={{
      background: 'white',
      border: '1px solid #e0eaed',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 3px 12px #183f5d05',
      minWidth: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all 0.2s ease',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 6px 20px #183f5d12';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 3px 12px #183f5d05';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      {/* Header with icon and title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {icon && (
          <div style={{
            width: '44px',
            height: '44px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '14px',
            background: color,
            fontSize: '21px',
            flexShrink: '0',
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <small style={{ color: '#688097', fontSize: '11px', fontWeight: '700', display: 'block' }}>
            {title}
          </small>
        </div>
      </div>

      {/* Value display */}
      <div>
        <strong style={{
          display: 'block',
          fontSize: '28px',
          lineHeight: '1.2',
          color: '#153e67',
          fontWeight: '900',
        }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </strong>
      </div>

      {/* Trend indicator */}
      {getTrendDisplay()}
    </article>
  );
}
