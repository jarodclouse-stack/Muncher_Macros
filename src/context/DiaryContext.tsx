import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface DiaryContextState {
  localCache: any;
  currentDate: string; // YYYY-MM-DD
  syncStatus: 'ok' | 'syncing' | 'error' | 'offline';
  changeDate: (delta: number) => void;
  updateDayData: (date: string, partialData: any) => void;
  addFoodLog: (meal: string, food: any) => void;
  removeFoodLog: (meal: string, idx: number) => void;
  updateFoodLog: (meal: string, idx: number, updatedFood: any) => void;
  updateGoals: (partialGoals: any) => void;
  saveCustomFood: (food: any) => void;
  updateCustomFood: (idx: number, food: any) => void;
  deleteCustomFood: (idx: number) => void;
  goToDate: (date: string) => void;
  updateSettings: (partialSettings: any) => void;
  purchaseTheme: (themeId: string) => void;
}

const DiaryContext = createContext<DiaryContextState>({} as DiaryContextState);

const getLocalDateStr = (d = new Date()) => {
  const tzo = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzo).toISOString().split('T')[0];
};

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const [localCache, setLocalCache] = useState<any>({});
  const [currentDate, setCurrentDate] = useState(getLocalDateStr());
  const [syncStatus, setSyncStatus] = useState<'ok' | 'syncing' | 'error' | 'offline'>('ok');
  
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
        setSyncStatus('ok');
      } catch (err) {
        console.warn('Sync failed:', err);
        setSyncStatus('offline');
      }
    };
    
    loadCloudData();
  }, [user, isGuest]);

  // Save Data
  const saveCloudData = useCallback(async (dataToSave: any) => {
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

  const updateCacheDebounced = useCallback((newCache: any) => {
    setLocalCache(newCache);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => saveCloudData(newCache), 1500) as any;
  }, [saveCloudData]);

  const changeDate = (delta: number) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setCurrentDate(getLocalDateStr(d));
  };

  const goToDate = (date: string) => {
    setCurrentDate(date);
  };

  const updateDayData = (date: string, partialData: any) => {
    const updated = { ...localCache };
    updated[date] = { ...(updated[date] || {}), ...partialData };
    updateCacheDebounced(updated);
  };

  const addFoodLog = (meal: string, food: any) => {
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

  const updateFoodLog = (meal: string, idx: number, updatedFood: any) => {
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

  const updateGoals = (partialGoals: any) => {
    const updated = { ...localCache, goals: { ...(localCache.goals || {}), ...partialGoals } };
    updateCacheDebounced(updated);
  };

  const updateSettings = (partialSettings: any) => {
    const updated = { ...localCache, settings: { ...(localCache.settings || {}), ...partialSettings } };
    updateCacheDebounced(updated);
  };

  const saveCustomFood = (food: any) => {
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

  const updateCustomFood = (idx: number, food: any) => {
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

  return (
    <DiaryContext.Provider value={{ localCache, currentDate, syncStatus, changeDate, updateDayData, addFoodLog, removeFoodLog, updateFoodLog, updateGoals, saveCustomFood, updateCustomFood, deleteCustomFood, goToDate, updateSettings, purchaseTheme }}>
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => useContext(DiaryContext);
