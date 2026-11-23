import { useContext } from 'react';
import Toast from './Toast';
import { ToastContext } from '../context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}
