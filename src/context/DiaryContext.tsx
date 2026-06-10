import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { Food, StagedFood } from '../types/food';

interface LocalCache {
  customFoods?: Food[];
  stagingTray?: StagedFood[];
  goals?: Record<string, any>;
  settings?: {
    units: { weight: string; height: string };
    notifications: Record<string, boolean>;
    purchasedThemes: string[];
    displayName?: string;
  };
  [date: string]: any; 
}

interface DiaryContextState {
  localCache: LocalCache;
  stagingTray: StagedFood[];
  currentDate: string; // YYYY-MM-DD
  syncStatus: 'ok' | 'syncing' | 'error' | 'offline';
  changeDate: (delta: number) => void;
  updateDayData: (date: string, partialData: any) => void;
  addFoodLog: (meal: string, food: Food) => void;
  removeFoodLog: (meal: string, idx: number) => void;
  updateFoodLog: (meal: string, idx: number, updatedFood: Food) => void;
  moveFoodLog: (oldMeal: string, idx: number, newMeal: string) => void;
  updateGoals: (partialGoals: Record<string, any>) => void;
  saveCustomFood: (food: Food) => void;
  updateCustomFood: (idx: number, food: Food) => void;
  deleteCustomFood: (idx: number) => void;
  goToDate: (date: string) => void;
  updateSettings: (partialSettings: any) => void;
  purchaseTheme: (themeId: string) => void;
  addToTray: (food: Food) => void;
  removeFromTray: (idx: number) => void;
  updateTrayItem: (idx: number, updates: Partial<StagedFood>) => void;
  clearTray: () => void;
  toggleFavorite: (idx: number) => void;
  duplicateCustomFood: (idx: number) => void;
  isScannerActive: boolean;
  setIsScannerActive: (val: boolean) => void;
  updateLocalCache: (newCache: LocalCache) => void;
  dataReady: boolean;
}

const DiaryContext = createContext<DiaryContextState>({} as DiaryContextState);

const getLocalDateStr = (d = new Date()) => {
  const tzo = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzo).toISOString().split('T')[0];
};

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const [localCache, setLocalCache] = useState<LocalCache>({});
  const [currentDate, setCurrentDate] = useState(getLocalDateStr());
  const [syncStatus, setSyncStatus] = useState<'ok' | 'syncing' | 'error' | 'offline'>('ok');
  const [stagingTray, setStagingTray] = useState<StagedFood[]>([]);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const pendingSaveRef = useRef<LocalCache | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  // Load Initial Data
  useEffect(() => {
    if (!user) return;
    
    if (isGuest) {
      try {
        const stored = JSON.parse(localStorage.getItem('ft_guest') || '{}');
        setLocalCache(stored);
      } catch {}
      setDataReady(true);
      return;
    }

    // Load instantly from localStorage backup if it exists
    let localBackup: LocalCache = {};
    try {
      const stored = localStorage.getItem(`ft_user_${user.id}`);
      if (stored) {
        localBackup = JSON.parse(stored);
        setLocalCache(localBackup);
        if (localBackup.stagingTray) setStagingTray(localBackup.stagingTray);
      }
    } catch (e) {
      console.warn('Failed to load local backup:', e);
    }

    const loadCloudData = async () => {
      setSyncStatus('syncing');
      try {
        const { data, error } = await supabase.from('user_data').select('data').eq('user_id', user.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        
        const loaded = data?.data || {};
        
        // Structure Validator for Legacy Data
        if (!loaded.settings) {
          loaded.settings = {
            units: { weight: 'kg', height: 'cm' },
            notifications: { 
              reminders: true, 
              goals: true,
              morningNudge: true,
              afternoonCheck: true,
              eveningSummary: true,
              waterReminders: true,
              streakAlert: true
            }
          };
        }
        
        setLocalCache(loaded);
        if (loaded.stagingTray) setStagingTray(loaded.stagingTray);
        
        // Cache backup locally
        try {
          localStorage.setItem(`ft_user_${user.id}`, JSON.stringify(loaded));
        } catch {}
        
        setSyncStatus('ok');
        setDataReady(true);
      } catch (err) {
        console.warn('Sync failed:', err);
        setSyncStatus('offline');
        setDataReady(true);
      }
    };
    
    loadCloudData();
  }, [user, isGuest]);

  // Save Data
  const saveCloudData = useCallback(async (dataToSave: LocalCache) => {
    if (!user) return;
    if (isGuest) {
      localStorage.setItem('ft_guest', JSON.stringify(dataToSave));
      if (pendingSaveRef.current === dataToSave) pendingSaveRef.current = null;
      return;
    }
    
    // Always write backup locally immediately
    try {
      localStorage.setItem(`ft_user_${user.id}`, JSON.stringify(dataToSave));
    } catch {}
    
    setSyncStatus('syncing');
    try {
      const { error } = await supabase.from('user_data').upsert(
        { user_id: user.id, data: dataToSave, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
      setSyncStatus('ok');
      if (pendingSaveRef.current === dataToSave) pendingSaveRef.current = null;
    } catch (err) {
      console.error('Diary save failed:', err);
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
    }
  }, [user, isGuest]);

  // Automatically sync when browser connection is restored
  useEffect(() => {
    const handleOnline = () => {
      if (syncStatus === 'offline' || syncStatus === 'error') {
        saveCloudData(localCache);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncStatus, localCache, saveCloudData]);

  // Flush pending saves when the tab is hidden or closing so the 1.5s debounce
  // can't drop a just-logged entry.
  useEffect(() => {
    const flush = () => {
      if (pendingSaveRef.current) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        saveCloudData(pendingSaveRef.current);
      }
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [saveCloudData]);

  const updateCacheDebounced = useCallback((newCache: LocalCache) => {
    setLocalCache(newCache);
    pendingSaveRef.current = newCache;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => saveCloudData(newCache), 1500) as any;
  }, [saveCloudData]);

  const updateStagingTray = useCallback((newTray: StagedFood[]) => {
    setStagingTray(newTray);
    setLocalCache(prev => {
      const updated = { ...prev, stagingTray: newTray };
      pendingSaveRef.current = updated;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
      }, 1500) as any;
      return updated;
    });
  }, [saveCloudData]);

  const changeDate = (delta: number) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setCurrentDate(getLocalDateStr(d));
  };

  const goToDate = (date: string) => {
    setCurrentDate(date);
  };

  const updateDayData = useCallback((date: string, partialData: any) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      updated[date] = { ...(updated[date] || {}), ...partialData };
      pendingSaveRef.current = updated; // stage latest state for the debounce
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
      }, 1500) as any;
      return updated;
    });
  }, [saveCloudData]);

  const addFoodLog = (meal: string, food: Food) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const currentDay = updated[currentDate] || {};
      const newLog = [...(currentDay.foodLog || [])];
      newLog.push({ meal, f: food });
      updated[currentDate] = { ...currentDay, foodLog: newLog };
      
      pendingSaveRef.current = updated;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => saveCloudData(updated), 1500) as any;
      return updated;
    });
  };

  const removeFoodLog = (meal: string, idx: number) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const currentDay = updated[currentDate] || {};
      const log = [...(currentDay.foodLog || [])];
      
      let localIdx = 0;
      const globalIdx = log.findIndex(item => {
        if (item.meal === meal) {
          if (localIdx === idx) return true;
          localIdx++;
        }
        return false;
      });
      
      if (globalIdx !== -1) {
        log.splice(globalIdx, 1);
        updated[currentDate] = { ...currentDay, foodLog: log };
        pendingSaveRef.current = updated;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => saveCloudData(updated), 1500) as any;
      }
      return updated;
    });
  };

  const updateFoodLog = (meal: string, idx: number, updatedFood: Food) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const currentDay = updated[currentDate] || {};
      const log = [...(currentDay.foodLog || [])];
      
      let localIdx = 0;
      const globalIdx = log.findIndex(item => {
        if (item.meal === meal) {
          if (localIdx === idx) return true;
          localIdx++;
        }
        return false;
      });
      
      if (globalIdx !== -1) {
        log[globalIdx] = { ...log[globalIdx], f: updatedFood };
        updated[currentDate] = { ...currentDay, foodLog: log };
        pendingSaveRef.current = updated;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => saveCloudData(updated), 1500) as any;
      }
      return updated;
    });
  };

  const moveFoodLog = (oldMeal: string, idx: number, newMeal: string) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const currentDay = updated[currentDate] || {};
      const log = [...(currentDay.foodLog || [])];
      
      let localIdx = 0;
      const globalIdx = log.findIndex(item => {
        if (item.meal === oldMeal) {
          if (localIdx === idx) return true;
          localIdx++;
        }
        return false;
      });
  
      if (globalIdx !== -1) {
        const item = { ...log[globalIdx], meal: newMeal };
        log.splice(globalIdx, 1);
        log.push(item);
        updated[currentDate] = { ...currentDay, foodLog: log };
        pendingSaveRef.current = updated;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => saveCloudData(updated), 1500) as any;
      }
      return updated;
    });
  };

  const updateGoals = useCallback((partialGoals: Record<string, any>) => {
    setLocalCache(prev => {
      const updated = { ...prev, goals: { ...(prev.goals || {}), ...partialGoals } };
      pendingSaveRef.current = updated;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
      }, 1500) as any;
      return updated;
    });
  }, [saveCloudData]);

  const updateSettings = useCallback((partialSettings: any) => {
    setLocalCache(prev => {
      const updated = { ...prev, settings: { ...(prev.settings || {}), ...partialSettings } };
      pendingSaveRef.current = updated;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
      }, 1500) as any;
      return updated;
    });
  }, [saveCloudData]);

  const saveCustomFood = useCallback((food: Food) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const foods = [...(prev.customFoods || [])];
      if (food.barcode) {
        if (!foods.find((f: any) => f.barcode === food.barcode)) foods.push(food);
      } else {
        foods.push(food);
      }
      updated.customFoods = foods;
      pendingSaveRef.current = updated;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
      }, 1500) as any;
      return updated;
    });
  }, [saveCloudData]);

  const updateCustomFood = useCallback((idx: number, food: Food) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const foods = [...(prev.customFoods || [])];
      if (idx >= 0 && idx < foods.length) {
        foods[idx] = food;
      }
      updated.customFoods = foods;
      pendingSaveRef.current = updated;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
      }, 1500) as any;
      return updated;
    });
  }, [saveCloudData]);

  const deleteCustomFood = useCallback((idx: number) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const foods = [...(prev.customFoods || [])];
      if (idx >= 0 && idx < foods.length) {
        foods.splice(idx, 1);
      }
      updated.customFoods = foods;
      pendingSaveRef.current = updated;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
      }, 1500) as any;
      return updated;
    });
  }, [saveCloudData]);

  const toggleFavorite = useCallback((idx: number) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const foods = [...(prev.customFoods || [])];
      if (foods[idx]) {
        foods[idx] = { ...foods[idx], favorite: !foods[idx].favorite };
        updated.customFoods = foods;
        pendingSaveRef.current = updated;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
        }, 1500) as any;
      }
      return updated;
    });
  }, [saveCloudData]);

  const duplicateCustomFood = useCallback((idx: number) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      const foods = [...(prev.customFoods || [])];
      if (foods[idx]) {
        const copy = { ...foods[idx], name: `${foods[idx].name} (Copy)`, favorite: false };
        foods.splice(idx + 1, 0, copy);
        updated.customFoods = foods;
        pendingSaveRef.current = updated;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          if (pendingSaveRef.current) saveCloudData(pendingSaveRef.current);
        }, 1500) as any;
      }
      return updated;
    });
  }, [saveCloudData]);

  const purchaseTheme = (themeId: string) => {
    const currentPurchased = localCache.settings?.purchasedThemes || [
      'obsidian', 'cybermancer', 'gold-reserve', 
      'forest-phantom', 'sunset-horizon', 
      'quantum-violet'
    ];
    if (!currentPurchased.includes(themeId)) {
      updateSettings({ purchasedThemes: [...currentPurchased, themeId] });
    }
  };

  const addToTray = (food: Food) => {
    const exists = stagingTray.find(f => (f.id && f.id === food.id) || (f.name === food.name && f.serving === food.serving));
    if (!exists) {
      updateStagingTray([...stagingTray, { ...food, qty: 1, unit: food.sUnit || 'serving' }]);
    }
  };

  const removeFromTray = (idx: number) => {
    updateStagingTray(stagingTray.filter((_, i) => i !== idx));
  };

  const updateTrayItem = (idx: number, updates: Partial<StagedFood>) => {
    const next = [...stagingTray];
    next[idx] = { ...next[idx], ...updates };
    updateStagingTray(next);
  };

  const clearTray = () => {
    updateStagingTray([]);
  };



  return (
    <DiaryContext.Provider value={{ 
      localCache, currentDate, syncStatus, changeDate, updateDayData, 
      addFoodLog, removeFoodLog, updateFoodLog, updateGoals, 
      saveCustomFood, updateCustomFood, deleteCustomFood, goToDate, 
      updateSettings, purchaseTheme,
      stagingTray, addToTray, removeFromTray, updateTrayItem, clearTray,
      toggleFavorite, duplicateCustomFood, moveFoodLog,
      isScannerActive, setIsScannerActive,
      updateLocalCache: updateCacheDebounced,
      dataReady
    }}>
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => useContext(DiaryContext);
