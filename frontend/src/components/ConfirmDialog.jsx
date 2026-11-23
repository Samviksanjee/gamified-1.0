import { useEffect } from 'react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false
}) {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '1000'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '450px',
          width: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid #e0eaed',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2
            style={{
              margin: '0',
              fontSize: '18px',
              fontWeight: '900',
              color: '#153e67'
            }}
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#688097',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '24px 28px',
            color: '#688097',
            lineHeight: '1.6'
          }}
        >
          {message}
        </div>

        {/* Footer with Buttons */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #e0eaed',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '11px 17px',
              borderRadius: '999px',
              background: 'white',
              color: '#153e67',
              border: '1px solid #dce8ed',
              fontWeight: '900',
              cursor: 'pointer',
              fontSize: '14px',
              transition: '0.15s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fbfc';
              e.target.style.borderColor = '#bdd4dd';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#dce8ed';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '11px 17px',
              borderRadius: '999px',
              background: danger
                ? '#f07878'
                : 'linear-gradient(100deg, #19b7a7, #079c98)',
              color: 'white',
              border: 'none',
              fontWeight: '900',
              cursor: 'pointer',
              fontSize: '14px',
              transition: '0.15s',
              boxShadow: danger ? 'none' : '0 5px 12px #14a99f25'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
