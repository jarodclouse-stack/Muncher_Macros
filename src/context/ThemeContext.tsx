import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 
  | 'obsidian' 
  | 'cybermancer' 
  | 'gold-reserve' 
  | 'glacier-peak' 
  | 'forest-phantom' 
  | 'midnight-crimson' 
  | 'sunset-horizon' 
  | 'quantum-violet' 
  | 'matcha-zen' 
  | 'sandstone'
  | 'olympian-gold'
  | 'aegean-mist'
  | 'hades-ember'
  | 'athenas-wisdom'
  | 'dionysus-vineyard'
  | 'poseidons-depths'
  | 'artemis-moonlight'
  | 'hermes-swiftness'
  | 'spartan-grit'
  | 'oracles-vision';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('mm_theme') as ThemeName) || 'obsidian';
  });

  const setTheme = (name: ThemeName) => {
    setThemeState(name);
    localStorage.setItem('mm_theme', name);
  };

  useEffect(() => {
    const body = document.body;
    // Clean up any existing theme classes
    const classes = Array.from(body.classList);
    classes.forEach(c => {
      if (c.startsWith('theme-')) {
        body.classList.remove(c);
      }
    });
    // Add new theme class
    body.classList.add(`theme-${theme}`);
    
    // Add light-surface class for specific themes
    const isLight = ['glacier-peak', 'matcha-zen', 'sandstone', 'aegean-mist', 'athenas-wisdom'].includes(theme);
    if (isLight) {
      body.classList.add('theme-light-surface');
    } else {
      body.classList.remove('theme-light-surface');
    }
    
    // Set color-scheme meta for mobile browser chrome
    body.style.colorScheme = isLight ? 'light' : 'dark';

    // Update theme-meta to match background for Dynamic Island blending
    const themeMeta = document.getElementById('theme-meta');
    if (themeMeta) {
      const bgColor = getComputedStyle(body).getPropertyValue('--theme-bg').trim() || '#080A0F';
      themeMeta.setAttribute('content', bgColor);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
