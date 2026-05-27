import React from 'react';
import ReactDOM from 'react-dom';
import { ThemesView } from './ThemesView';
import { Palette, X } from 'lucide-react';

interface VaultViewProps {
  onClose: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({ onClose }) => {
  return ReactDOM.createPortal(
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'rgba(0,0,0,0.6)', 
        backdropFilter: 'blur(10px)', 
        padding: '20px' 
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'var(--theme-bg, var(--theme-panel, #0a1e21))', 
          border: '1px solid var(--theme-border, rgba(255,255,255,0.15))', 
          borderRadius: '28px', 
          width: '100%', 
          maxWidth: '500px', 
          maxHeight: '85vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--theme-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--theme-panel, rgba(0,0,0,0.2))' }}>
           <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-text)' }}>
             <Palette size={20} color="var(--theme-accent)" /> THE THEME VAULT
           </h2>
           <button 
             onClick={onClose} 
             style={{ 
               background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', 
               border: '1px solid var(--theme-border)', 
               color: 'var(--theme-text)', 
               cursor: 'pointer', 
               padding: '6px', 
               borderRadius: '10px', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               transition: 'all 0.2s' 
             }} 
           >
             <X size={18} />
           </button>
        </div>

        {/* Modal Content - Themes Switcher */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ThemesView />
        </div>
      </div>
    </div>,
    document.body
  );
};
