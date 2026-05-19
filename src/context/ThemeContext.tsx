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
  | 'oracles-vision'
  | 'solar-flare'
  | 'deep-sea'
  | 'sakura-spring'
  | 'neon-wasteland'
  | 'emerald-city'
  | 'carbon-fiber'
  | 'sahara-gold'
  | 'midnight-galaxy'
  | 'nordic-frost' 
  | 'ember-forge'
  | 'island-palm'
  | 'azure-tide'
  | 'mango-salsa'
  | 'hibiscus-bloom'
  | 'blue-hawaiian'
  | 'surf-neon';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getThemeSolidColor = (theme: ThemeName): string => {
  const isLight = ['glacier-peak', 'matcha-zen', 'sandstone', 'aegean-mist', 'athenas-wisdom', 'sakura-spring', 'sahara-gold', 'nordic-frost', 'island-palm', 'azure-tide', 'mango-salsa', 'hibiscus-bloom', 'blue-hawaiian', 'surf-neon'].includes(theme);
  
  if (isLight) {
    switch (theme) {
      case 'glacier-peak': return '#E6F0FA';
      case 'matcha-zen': return '#E6E9E1';
      case 'sandstone': return '#FEF3C7';
      case 'aegean-mist': return '#E0F2FE';
      case 'athenas-wisdom': return '#F4F6F0';
      case 'sakura-spring': return '#FFF1F2';
      case 'sahara-gold': return '#FFFDEB';
      case 'nordic-frost': return '#F0F8FF';
      case 'island-palm': return '#F0FFF4';
      case 'azure-tide': return '#E0F7FA';
      case 'mango-salsa': return '#FFF8E1';
      case 'hibiscus-bloom': return '#FFF0F3';
      case 'blue-hawaiian': return '#E0F7FA';
      case 'surf-neon': return '#E0F7FA';
      default: return '#FFFFFF';
    }
  } else {
    switch (theme) {
      case 'obsidian': return '#080A0F';
      case 'cybermancer': return '#0B0816';
      case 'gold-reserve': return '#1C1A14';
      case 'forest-phantom': return '#0F1411';
      case 'midnight-crimson': return '#160505';
      case 'sunset-horizon': return '#251010';
      case 'quantum-violet': return '#1E002B';
      case 'olympian-gold': return '#1C1A14';
      case 'hades-ember': return '#1A0808';
      case 'dionysus-vineyard': return '#1A0F2B';
      case 'poseidons-depths': return '#002030';
      case 'artemis-moonlight': return '#1C1F2B';
      case 'hermes-swiftness': return '#1A1D20';
      case 'spartan-grit': return '#1E1010';
      case 'oracles-vision': return '#141026';
      case 'solar-flare': return '#2B150A';
      case 'deep-sea': return '#001F35';
      case 'neon-wasteland': return '#0A0815';
      case 'emerald-city': return '#012518';
      case 'carbon-fiber': return '#121212';
      case 'midnight-galaxy': return '#0A0A16';
      case 'ember-forge': return '#2D1005';
      default: return '#080A0F';
    }
  }
};

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
    const isLight = ['glacier-peak', 'matcha-zen', 'sandstone', 'aegean-mist', 'athenas-wisdom', 'sakura-spring', 'sahara-gold', 'nordic-frost', 'island-palm', 'azure-tide', 'mango-salsa', 'hibiscus-bloom', 'blue-hawaiian', 'surf-neon'].includes(theme);
    if (isLight) {
      body.classList.add('theme-light-surface');
    } else {
      body.classList.remove('theme-light-surface');
    }
    
    // Set color-scheme meta for mobile browser chrome
    body.style.colorScheme = isLight ? 'light' : 'dark';

    // Update theme-meta to match background for Dynamic Island blending using solid colors
    const themeMeta = document.getElementById('theme-meta');
    if (themeMeta) {
      themeMeta.setAttribute('content', getThemeSolidColor(theme));
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
