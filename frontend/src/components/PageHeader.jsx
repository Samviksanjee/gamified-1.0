export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '22px' }}>
      <div>
        <div style={{ color: '#078b84', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.3px', marginBottom: '6px' }}>
          {eyebrow}
        </div>
        <h1 style={{ fontSize: '29px', lineHeight: '1.18', color: '#153e67', fontWeight: '900', margin: '5px 0 7px', letterSpacing: '-0.7px' }}>
          {title}
        </h1>
        <p style={{ color: '#688097', margin: '0', lineHeight: '1.6' }}>
          {subtitle}
        </p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
