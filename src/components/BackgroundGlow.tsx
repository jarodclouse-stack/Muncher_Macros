import React from 'react';

export const BackgroundGlow: React.FC = () => {
  return (
    <div className="bg-glow-container">
      {/* The Silk Filter - Warps regular shapes into fluid waves */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="silk-warp">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="120" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="silk-ribbon silk-1" />
      <div className="silk-ribbon silk-2" />
      <div className="silk-ribbon silk-3" />
      <div className="silk-ribbon silk-4" />
      
      {/* Texture Layer - Adds the fine silk lines */}
      <div className="silk-texture" />
      
      <div className="luminous-noise" />
    </div>
  );
};
