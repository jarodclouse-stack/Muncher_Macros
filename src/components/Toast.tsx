import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const bg = type === 'error' ? 'var(--theme-error, #ff4444)' : type === 'info' ? 'var(--theme-accent, #00C9FF)' : '#22c55e';

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
      background: bg, color: type === 'info' ? '#000' : '#fff',
      padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
      zIndex: 9999, animation: 'toastIn 0.3s ease-out',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxWidth: '90vw', textAlign: 'center',
    }}>
      {message}
      <style>{`@keyframes toastIn { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>
    </div>,
    document.body
  );
};
