export default function ActivityCard({ activity, onAction }) {
  const getGameIcon = (type) => {
    switch (type) {
      case 'quiz': return '🎯';
      case 'matching': return '🔀';
      case 'sequencing': return '📝';
      default: return '🎮';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return { bg: '#e5f8eb', color: '#238650' };
      case 'Draft': return { bg: '#fff3d4', color: '#a77818' };
      case 'Approved': return { bg: '#eaf6ff', color: '#267ca8' };
      default: return { bg: '#f0f0f0', color: '#666' };
    }
  };

  const statusColor = getStatusColor(activity.status);

  return (
    <article style={{
      background: 'white',
      border: '1px solid #e0eaed',
      borderRadius: '16px',
      padding: '19px',
      boxShadow: '0 3px 12px #183f5d05',
      minWidth: '0'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>{getGameIcon(activity.type)}</span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          borderRadius: '999px',
          padding: '5px 9px',
          fontSize: '10px',
          fontWeight: '900',
          background: statusColor.bg,
          color: statusColor.color
        }}>
          {activity.status}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ margin: '13px 0 5px', fontSize: '14px', fontWeight: '900', color: '#153e67' }}>
        {activity.title}
      </h3>

      {/* Details */}
      <p style={{ fontSize: '11px', color: '#688097', margin: '0 0 12px' }}>
        Class {activity.grade} · {activity.subject} · {activity.questions} questions
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '12px' }}>
        <span style={{ color: '#688097' }}>{activity.plays || 0} attempts</span>
        <strong style={{ color: '#153e67' }}>{activity.avg || 0}% avg. score</strong>
      </div>

      {/* Progress Meter */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          height: '7px',
          borderRadius: '20px',
          background: '#eaf0f2',
          overflow: 'hidden',
          flex: '1',
          minWidth: '65px'
        }}>
          <span style={{
            display: 'block',
            height: '100%',
            borderRadius: '20px',
            background: 'linear-gradient(90deg, #19b7a7, #42b7d9)',
            width: `${activity.avg || 0}%`
          }} />
        </div>
      </div>

      {/* Action Button */}
      {onAction && (
        <button
          onClick={() => onAction(activity.id)}
          style={{
            width: '100%',
            padding: '11px 17px',
            borderRadius: '999px',
            background: '#eaf7f7',
            color: '#147d81',
            border: '1px solid #cde9e7',
            fontWeight: '900',
            cursor: 'pointer',
            fontSize: '12px',
            transition: '0.15s'
          }}
        >
          View details
        </button>
      )}
    </article>
  );
}
