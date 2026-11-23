import StatisticsCard from './StatisticsCard';

export default function StatisticsGrid({ statistics = [] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '16px',
      width: '100%',
      '@media (max-width: 1200px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr',
      },
    }}>
      {statistics.length === 0 ? (
        <div style={{
          gridColumn: '1 / -1',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#688097',
          fontSize: '14px',
        }}>
          No statistics data available
        </div>
      ) : (
        statistics.map((stat, index) => (
          <StatisticsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            color={stat.color}
          />
        ))
      )}
    </div>
  );
}
