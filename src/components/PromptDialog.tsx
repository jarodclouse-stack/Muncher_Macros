import React, { useState } from 'react';
import ReactDOM from 'react-dom';

interface PromptDialogProps {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({ title, message, defaultValue = '', placeholder, confirmLabel = 'OK', onConfirm, onCancel }) => {
  const [value, setValue] = useState(defaultValue);

  return ReactDOM.createPortal(
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--theme-panel, #141420)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))',
        borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '100%',
        animation: 'pdIn 0.2s ease-out',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--theme-text, #fff)', margin: '0 0 8px' }}>{title}</h3>
        {message && <p style={{ fontSize: '13px', color: 'var(--theme-text-dim, #aaa)', lineHeight: 1.6, margin: '0 0 12px' }}>{message}</p>}
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onConfirm(value.trim()); if (e.key === 'Escape') onCancel(); }}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--theme-border, rgba(255,255,255,0.15))',
            background: 'rgba(0,0,0,0.3)', color: 'var(--theme-text, #fff)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onCancel} style={{
            padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))',
            background: 'transparent', color: 'var(--theme-text-dim, #aaa)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={() => { if (value.trim()) onConfirm(value.trim()); }} style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: 'var(--theme-accent, #00C9FF)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
          }}>{confirmLabel}</button>
        </div>
      </div>
      <style>{`@keyframes pdIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>,
    document.body
  );
};
