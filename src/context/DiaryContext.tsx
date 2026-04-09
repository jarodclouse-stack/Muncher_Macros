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
  
  const syncTimeoutRef = useRef<number | null>(null);

  // Load Initial Data
  useEffect(() => {
    if (!user) return;
    
    if (isGuest) {
      try {
        const stored = JSON.parse(localStorage.getItem('ft_guest') || '{}');
        setLocalCache(stored);
      } catch (e) {}
      return;
    }

    const loadCloudData = async () => {
      setSyncStatus('syncing');
      try {
        const { data, error } = await supabase.from('user_data').select('data').eq('user_id', user.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        
        let loaded = data?.data || {};
        
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
        setSyncStatus('ok');
      } catch (err) {
        console.warn('Sync failed:', err);
        setSyncStatus('offline');
      }
    };
    
    loadCloudData();
  }, [user, isGuest]);

  // Save Data
  const saveCloudData = useCallback(async (dataToSave: LocalCache) => {
    if (!user) return;
    if (isGuest) {
      localStorage.setItem('ft_guest', JSON.stringify(dataToSave));
      return;
    }
    
    setSyncStatus('syncing');
    try {
      const { error } = await supabase.from('user_data').upsert(
        { user_id: user.id, data: dataToSave, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
      setSyncStatus('ok');
    } catch (err) {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
    }
  }, [user, isGuest]);

  const updateCacheDebounced = useCallback((newCache: LocalCache) => {
    setLocalCache(newCache);
    if (syncStatus === 'syncing') return; // Don't interrupt
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => saveCloudData(newCache), 1500) as any;
  }, [saveCloudData, syncStatus]);

  const updateStagingTray = useCallback((newTray: StagedFood[]) => {
    setStagingTray(newTray);
    const updated = { ...localCache, stagingTray: newTray };
    updateCacheDebounced(updated);
  }, [localCache, updateCacheDebounced]);

  const changeDate = (delta: number) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setCurrentDate(getLocalDateStr(d));
  };

  const goToDate = (date: string) => {
    setCurrentDate(date);
  };

  const updateDayData = (date: string, partialData: any) => {
    setLocalCache(prev => {
      const updated = { ...prev };
      updated[date] = { ...(updated[date] || {}), ...partialData };
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => saveCloudData(updated), 1500) as any;
      return updated;
    });
  };

  const addFoodLog = (meal: string, food: Food) => {
    const updated = { ...localCache };
    const day = updated[currentDate] || {};
    const log = [...(day.foodLog || [])];
    log.push({ meal, f: food });
    day.foodLog = log;
    updated[currentDate] = day;
    updateCacheDebounced(updated);
  };

  const removeFoodLog = (meal: string, idx: number) => {
    const updated = { ...localCache };
    const day = updated[currentDate] || {};
    const log = [...(day.foodLog || [])];
    // filter carefully: find the matching relative index within the particular meal slice
    let localIdx = 0;
    const globalIdx = log.findIndex(item => {
      if (item.meal === meal) {
        if (localIdx === idx) return true;
        localIdx++;
      }
      return false;
    });
    
    if (globalIdx !== -1) log.splice(globalIdx, 1);
    
    day.foodLog = log;
    updated[currentDate] = day;
    updateCacheDebounced(updated);
  };

  const updateFoodLog = (meal: string, idx: number, updatedFood: Food) => {
    const updated = { ...localCache };
    const day = updated[currentDate] || {};
    const log = [...(day.foodLog || [])];
    
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
    }
    
    day.foodLog = log;
    updated[currentDate] = day;
    updateCacheDebounced(updated);
  };

  const updateGoals = (partialGoals: Record<string, any>) => {
    const updated = { ...localCache, goals: { ...(localCache.goals || {}), ...partialGoals } };
    updateCacheDebounced(updated);
  };

  const updateSettings = (partialSettings: any) => {
    const updated = { ...localCache, settings: { ...(localCache.settings || {}), ...partialSettings } };
    updateCacheDebounced(updated);
  };

  const saveCustomFood = (food: Food) => {
    const updated = { ...localCache };
    const foods = [...(updated.customFoods || [])];
    if (food.barcode) {
      if (!foods.find((f: any) => f.barcode === food.barcode)) foods.push(food);
    } else {
      foods.push(food);
    }
    updated.customFoods = foods;
    updateCacheDebounced(updated);
  };

  const updateCustomFood = (idx: number, food: Food) => {
    const updated = { ...localCache };
    const foods = [...(updated.customFoods || [])];
    foods[idx] = food;
    updated.customFoods = foods;
    updateCacheDebounced(updated);
  };

  const deleteCustomFood = (idx: number) => {
    const updated = { ...localCache };
    const foods = [...(updated.customFoods || [])];
    foods.splice(idx, 1);
    updated.customFoods = foods;
    updateCacheDebounced(updated);
  };

  const toggleFavorite = (idx: number) => {
    const updated = { ...localCache };
    const foods = [...(updated.customFoods || [])];
    if (foods[idx]) {
      foods[idx] = { ...foods[idx], favorite: !foods[idx].favorite };
      updated.customFoods = foods;
      updateCacheDebounced(updated);
    }
  };

  const duplicateCustomFood = (idx: number) => {
    const updated = { ...localCache };
    const foods = [...(updated.customFoods || [])];
    if (foods[idx]) {
      const copy = { ...foods[idx], name: `${foods[idx].name} (Copy)`, favorite: false };
      foods.splice(idx + 1, 0, copy);
      updated.customFoods = foods;
      updateCacheDebounced(updated);
    }
  };

  const purchaseTheme = (themeId: string) => {
    const currentPurchased = localCache.settings?.purchasedThemes || [
      'obsidian', 'cybermancer', 'gold-reserve', 'glacier-peak', 
      'forest-phantom', 'midnight-crimson', 'sunset-horizon', 
      'quantum-violet', 'matcha-zen', 'sandstone'
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
      toggleFavorite, duplicateCustomFood,
      isScannerActive, setIsScannerActive
    }}>
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => useContext(DiaryContext);
