export default function ClassCard({ classData, onDetails, onProgress, onCopyCode, onDelete, publishedCount }) {
  const joinPercentage = Math.round((classData.joined / classData.students) * 100);

  return (
    <article style={{
      background: 'white',
      border: '1px solid #e0eaed',
      borderRadius: '16px',
      padding: '19px',
      boxShadow: '0 3px 12px #183f5d05'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          display: 'grid', placeItems: 'center', background: '#eef8ff', fontSize: '20px', flexShrink: '0',
        }}>
          🏫
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          borderRadius: '999px', padding: '5px 9px', fontSize: '10px', fontWeight: '900',
          background: '#e5f8eb', color: '#238650', flex: 1,
        }}>
          Active
        </span>
        {/* Direct delete button — always accessible without opening detail modal */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(classData.id); }}
            title="Delete this classroom"
            aria-label={`Delete classroom ${classData.name}`}
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              border: '1px solid #f5c1be', background: '#fff0ef',
              color: '#c85a59', cursor: 'pointer', fontSize: 14,
              display: 'grid', placeItems: 'center',
              lineHeight: 1,
            }}
          >
            🗑
          </button>
        )}
      </div>

      {/* Title */}
      <h3 style={{ margin: '13px 0 5px', color: '#153e67', fontWeight: '900', fontSize: '16px' }}>
        {classData.name}
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#688097' }}>
        Grade {classData.grade} · {classData.subject}
      </p>

      {/* Students Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong style={{ color: '#153e67', fontSize: '14px' }}>
          {classData.joined}
          <span style={{ color: '#688097', fontSize: '11px', fontWeight: '700', marginLeft: '4px' }}>/ {classData.students} students</span>
        </strong>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          borderRadius: '999px',
          padding: '5px 9px',
          fontSize: '10px',
          fontWeight: '900',
          background: '#eaf6ff',
          color: '#267ca8'
        }}>
          {joinPercentage}% joined
        </span>
      </div>

      {/* Progress Meter */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '15px' }}>
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
            width: `${joinPercentage}%`
          }} />
        </div>
        <b style={{ fontSize: '11px', color: '#153e67' }}>{joinPercentage}%</b>
      </div>

      {/* Join Code */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: '#effaf7',
        border: '1px dashed #80cec3',
        borderRadius: '13px',
        padding: '15px',
        marginBottom: '15px'
      }}>
        <div>
          <small style={{ color: '#688097', fontSize: '10px', fontWeight: '900' }}>STUDENT JOIN CODE</small>
          <div style={{
            fontSize: '25px',
            letterSpacing: '4px',
            color: '#153e67',
            fontWeight: '900',
            marginTop: '4px'
          }}>
            {classData.code}
          </div>
        </div>
        <button
          onClick={() => onCopyCode(classData.code)}
          style={{
            padding: '9px 13px',
            borderRadius: '10px',
            border: '1px solid #dce7ea',
            background: 'white',
            color: '#153e67',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            transition: '0.15s'
          }}
        >
          Copy
        </button>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onDetails(classData.id)}
          style={{
            flex: '1',
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
          Class details
        </button>
        <button
          onClick={() => onProgress(classData.id)}
          style={{
            flex: '1',
            padding: '11px 17px',
            borderRadius: '999px',
            background: 'white',
            color: '#153e67',
            border: '1px solid #dce8ed',
            fontWeight: '900',
            cursor: 'pointer',
            fontSize: '12px',
            transition: '0.15s'
          }}
        >
          Progress ↗
        </button>
      </div>
    </article>
  );
}
