import { useContext, useCallback } from 'react';
import { ToastContext } from '../context/ToastContext';

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast } = context;

  const showSuccess = useCallback(
    (message) => addToast(message, 'success', 3000),
    [addToast]
  );

  const showError = useCallback(
    (message) => addToast(message, 'error', 3000),
    [addToast]
  );

  const showWarning = useCallback(
    (message) => addToast(message, 'warning', 3000),
    [addToast]
  );

  const showInfo = useCallback(
    (message) => addToast(message, 'info', 3000),
    [addToast]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
