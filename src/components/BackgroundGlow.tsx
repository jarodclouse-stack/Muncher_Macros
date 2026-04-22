import React from 'react';

export const BackgroundGlow: React.FC = () => {
  return (
    <div className="bg-glow-container">
      {/* 1. Base Theme Color Layer (Deepest) */}
      <div className="luminous-silk-aura" />
      
      {/* 2. High-Fidelity Silk Texture (Middle) */}
      <div className="luminous-silk-base" />
      
      {/* 3. Accent Glow & Texture (Top of background stack) */}
      <div className="silk-texture-wrap" />
      
      {/* 4. Micro-Noise Finish */}
      <div className="luminous-noise" />
    </div>
  );
};
