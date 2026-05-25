import React from 'react';
import ReactDOM from 'react-dom';
import { PantryView } from './PantryView';

interface AddFoodModalProps {
  meal: string;
  onClose: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ meal, onClose }) => {
  return ReactDOM.createPortal(
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(8px)', 
      zIndex: 1000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div className="card luminous-breath" style={{ 
        width: '100%', 
        height: '100%', 
        maxWidth: '480px', 
        maxHeight: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--theme-bg)', 
        borderRadius: 0, 
        overflowY: 'auto', 
        WebkitOverflowScrolling: 'touch' 
      }}>
        <PantryView initialMeal={meal} onClose={onClose} isModal={true} />
      </div>
    </div>,
    document.body
  );
};
