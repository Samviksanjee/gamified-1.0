export default function Modal({
  isOpen, title, children, onClose, onSave,
  primaryButtonText = 'Save', isDanger = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',   /* keeps the card away from screen edges on mobile */
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: 500,
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          /* On tiny screens the card should not exceed viewport */
          flex: '0 1 auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0eaed',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#153e67', minWidth: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none', border: 'none', fontSize: 24,
              cursor: 'pointer', color: '#688097', padding: 0,
              width: 36, height: 36, minWidth: 36,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>

        {/* Footer */}
        {(onClose || onSave) && (
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid #e0eaed',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 18px', borderRadius: 999,
                background: 'white', color: '#153e67',
                border: '1px solid #dce8ed', fontWeight: 900,
                cursor: 'pointer', fontSize: 14,
                minHeight: 44,
              }}
            >
              Cancel
            </button>
            {onSave && (
              <button
                onClick={onSave}
                style={{
                  padding: '10px 18px', borderRadius: 999,
                  background: isDanger
                    ? '#ff6b6b'
                    : 'linear-gradient(100deg,#19b7a7,#079c98)',
                  color: 'white', border: 'none',
                  fontWeight: 900, cursor: 'pointer', fontSize: 14,
                  boxShadow: isDanger ? 'none' : '0 5px 12px #14a99f25',
                  minHeight: 44,
                }}
              >
                {primaryButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
