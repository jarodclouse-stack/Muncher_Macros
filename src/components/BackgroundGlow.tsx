import React from 'react';

/**
 * BackgroundGlow - Minimalist Static Auras (Inspiration: Ref 2)
 * Provides organic, non-moving color accents that perfectly match the active theme.
 */
export const BackgroundGlow: React.FC = () => {
  return (
    <div className="bg-glow-container">
      {/* Static Organic Blobs - Matching Theme Accent */}
      <div className="static-blob blob-top-right" />
      <div className="static-blob blob-bottom-left" />
      <div className="static-blob blob-center" />
      
      {/* Minimalist Contour Lines (Ref 2 Style) */}
      <svg className="contour-lines" viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid slice">
        <path d="M-100,200 Q200,100 400,300 T900,200" fill="none" stroke="var(--theme-accent)" strokeWidth="0.5" opacity="0.1" />
        <path d="M-100,500 Q300,400 500,600 T900,500" fill="none" stroke="var(--theme-accent)" strokeWidth="0.5" opacity="0.1" />
        <path d="M-100,800 Q200,900 600,700 T900,800" fill="none" stroke="var(--theme-accent)" strokeWidth="0.5" opacity="0.1" />
      </svg>

      <div className="luminous-noise" />
    </div>
  );
};
