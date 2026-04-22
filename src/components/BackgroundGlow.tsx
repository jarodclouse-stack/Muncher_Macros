import React from 'react';

export const BackgroundGlow: React.FC = () => {
  return (
    <div className="bg-glow-container">
      {/* High-Fidelity Silk Base Layer */}
      <div className="luminous-silk-base" />
      {/* Dynamic Aura Flow - Tints the silk with theme colors */}
      <div className="luminous-silk-aura" />
      {/* Overlay Grain for High-End finish */}
      <div className="luminous-noise" />
    </div>
  );
};
