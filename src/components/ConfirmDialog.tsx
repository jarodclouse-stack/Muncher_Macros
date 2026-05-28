import React from 'react';
import ReactDOM from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, onConfirm, onCancel }) => {
  return ReactDOM.createPortal(
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--theme-panel, #141420)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))',
        borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '100%',
        animation: 'cdIn 0.2s ease-out',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: danger ? 'var(--theme-error, #ff4444)' : 'var(--theme-text, #fff)', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-dim, #aaa)', lineHeight: 1.6, margin: '0 0 20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))',
            background: 'transparent', color: 'var(--theme-text-dim, #aaa)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: danger ? 'var(--theme-error, #ff4444)' : 'var(--theme-accent, #00C9FF)',
            color: danger ? '#fff' : '#000', fontWeight: 700, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
          }}>{confirmLabel}</button>
        </div>
      </div>
      <style>{`@keyframes cdIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>,
    document.body
  );
};
