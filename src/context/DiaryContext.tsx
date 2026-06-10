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
  currentDate: string;
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
  isPro: boolean;
  setIsPro: (val: boolean) => void;
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
  const [isPro, setIsPro] = useState(false);

  // Per-domain debounce refs (no more single big blob debounce)
  const settingsDebounceRef = useRef<number | null>(null);
  const goalsDebounceRef = useRef<number | null>(null);
  const trayDebounceRef = useRef<number | null>(null);
  const diaryDebounceMap = useRef<Map<string, number>>(new Map());
  const pendingDiaryMap = useRef<Map<string, any>>(new Map());

  // ── Load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    // Guest (mock) mode
    if (isGuest && user.id === 'guest') {
      try {
        const stored = JSON.parse(localStorage.getItem('ft_guest') || '{}');
        setLocalCache(stored);
        if (stored.stagingTray) setStagingTray(stored.stagingTray);
        setIsPro(false);
      } catch {}
      setDataReady(true);
      return;
    }

    // Restore localStorage backup immediately for instant render
    let localBackup: LocalCache = {};
    try {
      const stored = localStorage.getItem(`ft_user_${user.id}`);
      if (stored) {
        localBackup = JSON.parse(stored);
        setLocalCache(localBackup);
        if (localBackup.stagingTray) setStagingTray(localBackup.stagingTray as StagedFood[]);
      }
    } catch (e) {
      console.warn('Failed to load local backup:', e);
    }

    const loadCloudData = async () => {
      setSyncStatus('syncing');
      try {
        // Parallel fetch from all normalized tables
        const [profileRes, goalsRes, foodsRes, trayRes] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('user_goals').select('*').eq('user_id', user.id).single(),
          supabase.from('custom_foods').select('*').eq('user_id', user.id).order('sort_order'),
          supabase.from('staging_tray').select('*').eq('user_id', user.id).single(),
        ]);

        const cache: LocalCache = { ...localBackup };

        // Settings from user_profiles
        if (profileRes.data) {
          const p = profileRes.data;
          cache.settings = {
            displayName: p.display_name || '',
            units: { weight: p.weight_unit || 'kg', height: p.height_unit || 'cm' },
            purchasedThemes: p.purchased_themes || ['obsidian', 'cybermancer'],
            notifications: p.notifications || {},
          };
          // TODO (REVERT BEFORE LAUNCH): remove `|| true`
          setIsPro(!!p.is_pro || true);
        } else {
          // New user — seed defaults
          if (!cache.settings) {
            cache.settings = {
              units: { weight: 'kg', height: 'cm' },
              notifications: {
                reminders: true, goals: true, morningNudge: true,
                afternoonCheck: true, eveningSummary: true,
                waterReminders: true, streakAlert: true,
              },
              purchasedThemes: ['obsidian', 'cybermancer'],
            };
          }
          setIsPro(true); // TODO: remove before launch
        }

        // Goals from user_goals
        if (goalsRes.data) {
          const g = goalsRes.data;
          cache.goals = {
            calories: g.calories,
            protein: g.protein,
            carbs: g.carbs,
            fat: g.fat,
            fiber: g.fiber,
            weight: g.target_weight,
            weightUnit: g.weight_unit,
            activityLevel: g.activity_level,
            goalType: g.goal_type,
            onboardingComplete: g.onboarding_complete,
          };
        }

        // Custom foods (include _id for targeted updates/deletes)
        if (foodsRes.data && foodsRes.data.length > 0) {
          cache.customFoods = foodsRes.data.map((row: any) => ({
            _id: row.id,
            name: row.name,
            brand: row.brand || '',
            cal: Number(row.cal) || 0,
            p: Number(row.protein) || 0,
            c: Number(row.carbs) || 0,
            f: Number(row.fat) || 0,
            fiber: Number(row.fiber) || 0,
            serving: row.serving || '1 serving',
            sUnit: row.serving_unit || '',
            barcode: row.barcode || '',
            favorite: row.favorite || false,
          }));
        }

        // Staging tray
        if (trayRes.data?.items?.length) {
          cache.stagingTray = trayRes.data.items;
          setStagingTray(trayRes.data.items);
        }

        // Diary entries — last 90 days
        const today = getLocalDateStr();
        const startDate = getLocalDateStr(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
        const { data: diaryData } = await supabase
          .from('diary_entries')
          .select('entry_date, food_log, weight_log, water_ml, notes')
          .eq('user_id', user.id)
          .gte('entry_date', startDate)
          .lte('entry_date', today);

        if (diaryData) {
          diaryData.forEach((row: any) => {
            cache[row.entry_date] = {
              foodLog: row.food_log || [],
              ...(row.weight_log != null && { weightLog: row.weight_log }),
              ...(row.water_ml != null && { waterMl: row.water_ml }),
              ...(row.notes && { notes: row.notes }),
            };
          });
        }

        setLocalCache(cache);

        // Persist backup
        try { localStorage.setItem(`ft_user_${user.id}`, JSON.stringify(cache)); } catch {}

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

  // ── Targeted save functions ─────────────────────────────────────────────

  const saveLocalBackup = useCallback((data: LocalCache) => {
    if (!user || (isGuest && user.id === 'guest')) return;
    try { localStorage.setItem(`ft_user_${user.id}`, JSON.stringify(data)); } catch {}
  }, [user, isGuest]);

  const saveGuestData = useCallback((data: LocalCache) => {
    try { localStorage.setItem('ft_guest', JSON.stringify(data)); } catch {}
  }, []);

  const saveProfile = useCallback(async (settings: LocalCache['settings']) => {
    if (!user || (isGuest && user.id === 'guest')) return;
    try {
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        display_name: settings?.displayName || null,
        weight_unit: settings?.units?.weight || 'kg',
        height_unit: settings?.units?.height || 'cm',
        purchased_themes: settings?.purchasedThemes || ['obsidian'],
        notifications: settings?.notifications || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err) { console.error('Failed to save profile:', err); }
  }, [user, isGuest]);

  const saveGoalsToDb = useCallback(async (goals: Record<string, any>) => {
    if (!user || (isGuest && user.id === 'guest')) return;
    try {
      await supabase.from('user_goals').upsert({
        user_id: user.id,
        calories: goals.calories ?? 2000,
        protein: goals.protein ?? 150,
        carbs: goals.carbs ?? 250,
        fat: goals.fat ?? 65,
        fiber: goals.fiber ?? 25,
        target_weight: goals.weight ?? null,
        weight_unit: goals.weightUnit || 'kg',
        activity_level: goals.activityLevel || null,
        goal_type: goals.goalType || null,
        onboarding_complete: goals.onboardingComplete ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err) { console.error('Failed to save goals:', err); }
  }, [user, isGuest]);

  const saveDiaryEntry = useCallback(async (date: string, dayData: any) => {
    if (!user || (isGuest && user.id === 'guest')) return;
    try {
      await supabase.from('diary_entries').upsert({
        user_id: user.id,
        entry_date: date,
        food_log: dayData.foodLog || [],
        weight_log: dayData.weightLog ?? null,
        water_ml: dayData.waterMl ?? null,
        notes: dayData.notes ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,entry_date' });
    } catch (err) { console.error('Failed to save diary entry:', err); }
  }, [user, isGuest]);

  const saveTrayToDb = useCallback(async (items: StagedFood[]) => {
    if (!user || (isGuest && user.id === 'guest')) return;
    try {
      await supabase.from('staging_tray').upsert({
        user_id: user.id,
        items,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err) { console.error('Failed to save staging tray:', err); }
  }, [user, isGuest]);

  // Per-date debounced diary save
  const scheduleDiarySave = useCallback((date: string, dayData: any) => {
    if (!user || (isGuest && user.id === 'guest')) return;
    const existing = diaryDebounceMap.current.get(date);
    if (existing) clearTimeout(existing);
    pendingDiaryMap.current.set(date, dayData);
    const t = setTimeout(() => {
      const pending = pendingDiaryMap.current.get(date);
      if (pending) { saveDiaryEntry(date, pending); pendingDiaryMap.current.delete(date); }
      diaryDebounceMap.current.delete(date);
    }, 1500) as any;
    diaryDebounceMap.current.set(date, t);
  }, [user, isGuest, saveDiaryEntry]);

  // Flush on tab hide / page close
  useEffect(() => {
    const flush = () => {
      diaryDebounceMap.current.forEach((t, date) => {
        clearTimeout(t);
        const pending = pendingDiaryMap.current.get(date);
        if (pending) saveDiaryEntry(date, pending);
      });
      diaryDebounceMap.current.clear();
      pendingDiaryMap.current.clear();
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [saveDiaryEntry]);

  // Re-sync when reconnecting
  useEffect(() => {
    const handleOnline = () => {
      if (syncStatus === 'offline' || syncStatus === 'error') {
        pendingDiaryMap.current.forEach((data, date) => saveDiaryEntry(date, data));
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncStatus, saveDiaryEntry]);

  // ── Day operations ──────────────────────────────────────────────────────

  const changeDate = (delta: number) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setCurrentDate(getLocalDateStr(d));
  };

  const goToDate = (date: string) => setCurrentDate(date);

  const updateDayData = useCallback((date: string, partialData: any) => {
    setLocalCache(prev => {
      const updated = { ...prev, [date]: { ...(prev[date] || {}), ...partialData } };
      if (isGuest && user?.id === 'guest') { saveGuestData(updated); return updated; }
      saveLocalBackup(updated);
      scheduleDiarySave(date, updated[date]);
      return updated;
    });
  }, [isGuest, user, saveGuestData, saveLocalBackup, scheduleDiarySave]);

  const addFoodLog = (meal: string, food: Food) => {
    setLocalCache(prev => {
      const day = prev[currentDate] || {};
      const newLog = [...(day.foodLog || []), { meal, f: food }];
      const updated = { ...prev, [currentDate]: { ...day, foodLog: newLog } };
      if (isGuest && user?.id === 'guest') { saveGuestData(updated); return updated; }
      saveLocalBackup(updated);
      scheduleDiarySave(currentDate, updated[currentDate]);
      return updated;
    });
  };

  const removeFoodLog = (meal: string, idx: number) => {
    setLocalCache(prev => {
      const day = prev[currentDate] || {};
      const log = [...(day.foodLog || [])];
      let localIdx = 0;
      const globalIdx = log.findIndex(item => {
        if (item.meal === meal) { if (localIdx === idx) return true; localIdx++; }
        return false;
      });
      if (globalIdx === -1) return prev;
      log.splice(globalIdx, 1);
      const updated = { ...prev, [currentDate]: { ...day, foodLog: log } };
      if (isGuest && user?.id === 'guest') { saveGuestData(updated); return updated; }
      saveLocalBackup(updated);
      scheduleDiarySave(currentDate, updated[currentDate]);
      return updated;
    });
  };

  const updateFoodLog = (meal: string, idx: number, updatedFood: Food) => {
    setLocalCache(prev => {
      const day = prev[currentDate] || {};
      const log = [...(day.foodLog || [])];
      let localIdx = 0;
      const globalIdx = log.findIndex(item => {
        if (item.meal === meal) { if (localIdx === idx) return true; localIdx++; }
        return false;
      });
      if (globalIdx === -1) return prev;
      log[globalIdx] = { ...log[globalIdx], f: updatedFood };
      const updated = { ...prev, [currentDate]: { ...day, foodLog: log } };
      if (isGuest && user?.id === 'guest') { saveGuestData(updated); return updated; }
      saveLocalBackup(updated);
      scheduleDiarySave(currentDate, updated[currentDate]);
      return updated;
    });
  };

  const moveFoodLog = (oldMeal: string, idx: number, newMeal: string) => {
    setLocalCache(prev => {
      const day = prev[currentDate] || {};
      const log = [...(day.foodLog || [])];
      let localIdx = 0;
      const globalIdx = log.findIndex(item => {
        if (item.meal === oldMeal) { if (localIdx === idx) return true; localIdx++; }
        return false;
      });
      if (globalIdx === -1) return prev;
      const item = { ...log[globalIdx], meal: newMeal };
      log.splice(globalIdx, 1);
      log.push(item);
      const updated = { ...prev, [currentDate]: { ...day, foodLog: log } };
      if (isGuest && user?.id === 'guest') { saveGuestData(updated); return updated; }
      saveLocalBackup(updated);
      scheduleDiarySave(currentDate, updated[currentDate]);
      return updated;
    });
  };

  // ── Goals ───────────────────────────────────────────────────────────────

  const updateGoals = useCallback((partialGoals: Record<string, any>) => {
    setLocalCache(prev => {
      const updated = { ...prev, goals: { ...(prev.goals || {}), ...partialGoals } };
      if (isGuest && user?.id === 'guest') { saveGuestData(updated); return updated; }
      saveLocalBackup(updated);
      if (goalsDebounceRef.current) clearTimeout(goalsDebounceRef.current);
      goalsDebounceRef.current = setTimeout(() => saveGoalsToDb(updated.goals || {}), 1500) as any;
      return updated;
    });
  }, [isGuest, user, saveGuestData, saveLocalBackup, saveGoalsToDb]);

  // ── Settings ────────────────────────────────────────────────────────────

  const updateSettings = useCallback((partialSettings: any) => {
    setLocalCache(prev => {
      const updated = { ...prev, settings: { ...(prev.settings || {}), ...partialSettings } };
      if (isGuest && user?.id === 'guest') { saveGuestData(updated); return updated; }
      saveLocalBackup(updated);
      if (settingsDebounceRef.current) clearTimeout(settingsDebounceRef.current);
      settingsDebounceRef.current = setTimeout(() => saveProfile(updated.settings), 1500) as any;
      return updated;
    });
  }, [isGuest, user, saveGuestData, saveLocalBackup, saveProfile]);

  // ── Custom Foods ────────────────────────────────────────────────────────

  const saveCustomFood = useCallback(async (food: Food) => {
    // Optimistic local update first
    let insertIdx = 0;
    setLocalCache(prev => {
      const foods = [...(prev.customFoods || [])];
      if ((food as any).barcode) {
        if (!foods.find((f: any) => f.barcode === (food as any).barcode)) foods.push(food);
      } else {
        foods.push(food);
      }
      insertIdx = foods.length - 1;
      const updated = { ...prev, customFoods: foods };
      saveLocalBackup(updated);
      if (isGuest && user?.id === 'guest') saveGuestData(updated);
      return updated;
    });

    if (!user || (isGuest && user.id === 'guest')) return;

    try {
      const { data } = await supabase.from('custom_foods').insert({
        user_id: user.id,
        name: food.name,
        brand: (food as any).brand || null,
        cal: (food as any).cal || 0,
        protein: (food as any).p || 0,
        carbs: (food as any).c || 0,
        fat: (food as any).f || 0,
        fiber: (food as any).fiber || 0,
        serving: food.serving || '1 serving',
        serving_unit: (food as any).sUnit || null,
        barcode: (food as any).barcode || null,
        favorite: (food as any).favorite || false,
        sort_order: insertIdx,
      }).select('id').single();

      // Patch the DB id back onto the in-memory food
      if (data?.id) {
        setLocalCache(prev => {
          const foods = [...(prev.customFoods || [])];
          const target = foods.findIndex(f => f.name === food.name && !(f as any)._id);
          if (target !== -1) foods[target] = { ...foods[target], _id: data.id } as any;
          return { ...prev, customFoods: foods };
        });
      }
    } catch (err) { console.error('Failed to save custom food:', err); }
  }, [user, isGuest, saveLocalBackup, saveGuestData]);

  const updateCustomFood = useCallback(async (idx: number, food: Food) => {
    let dbId: string | undefined;
    setLocalCache(prev => {
      dbId = (prev.customFoods?.[idx] as any)?._id;
      const foods = [...(prev.customFoods || [])];
      if (idx >= 0 && idx < foods.length) foods[idx] = { ...food, _id: dbId } as any;
      const updated = { ...prev, customFoods: foods };
      saveLocalBackup(updated);
      if (isGuest && user?.id === 'guest') saveGuestData(updated);
      return updated;
    });

    if (!user || (isGuest && user.id === 'guest') || !dbId) return;
    try {
      await supabase.from('custom_foods').update({
        name: food.name, brand: (food as any).brand || null,
        cal: (food as any).cal || 0, protein: (food as any).p || 0,
        carbs: (food as any).c || 0, fat: (food as any).f || 0,
        fiber: (food as any).fiber || 0, serving: food.serving || '1 serving',
        serving_unit: (food as any).sUnit || null, barcode: (food as any).barcode || null,
        favorite: (food as any).favorite || false, updated_at: new Date().toISOString(),
      }).eq('id', dbId).eq('user_id', user.id);
    } catch (err) { console.error('Failed to update custom food:', err); }
  }, [user, isGuest, saveLocalBackup, saveGuestData]);

  const deleteCustomFood = useCallback(async (idx: number) => {
    let dbId: string | undefined;
    setLocalCache(prev => {
      dbId = (prev.customFoods?.[idx] as any)?._id;
      const foods = [...(prev.customFoods || [])];
      if (idx >= 0 && idx < foods.length) foods.splice(idx, 1);
      const updated = { ...prev, customFoods: foods };
      saveLocalBackup(updated);
      if (isGuest && user?.id === 'guest') saveGuestData(updated);
      return updated;
    });

    if (!user || (isGuest && user.id === 'guest') || !dbId) return;
    try {
      await supabase.from('custom_foods').delete().eq('id', dbId).eq('user_id', user.id);
    } catch (err) { console.error('Failed to delete custom food:', err); }
  }, [user, isGuest, saveLocalBackup, saveGuestData]);

  const toggleFavorite = useCallback(async (idx: number) => {
    let dbId: string | undefined;
    let newFavorite = false;
    setLocalCache(prev => {
      const foods = [...(prev.customFoods || [])];
      if (!foods[idx]) return prev;
      dbId = (foods[idx] as any)._id;
      newFavorite = !(foods[idx] as any).favorite;
      foods[idx] = { ...foods[idx], favorite: newFavorite } as any;
      const updated = { ...prev, customFoods: foods };
      saveLocalBackup(updated);
      if (isGuest && user?.id === 'guest') saveGuestData(updated);
      return updated;
    });

    if (!user || (isGuest && user.id === 'guest') || !dbId) return;
    try {
      await supabase.from('custom_foods').update({ favorite: newFavorite, updated_at: new Date().toISOString() })
        .eq('id', dbId).eq('user_id', user.id);
    } catch (err) { console.error('Failed to toggle favorite:', err); }
  }, [user, isGuest, saveLocalBackup, saveGuestData]);

  const duplicateCustomFood = useCallback(async (idx: number) => {
    setLocalCache(prev => {
      const original = prev.customFoods?.[idx];
      if (!original) return prev;
      const copy = { ...original, name: `${original.name} (Copy)`, favorite: false } as any;
      delete copy._id;
      const foods = [...(prev.customFoods || [])];
      foods.splice(idx + 1, 0, copy);
      const updated = { ...prev, customFoods: foods };
      saveLocalBackup(updated);
      if (isGuest && user?.id === 'guest') saveGuestData(updated);
      // Async DB insert for the copy
      if (user && !(isGuest && user.id === 'guest')) {
        Promise.resolve(
          supabase.from('custom_foods').insert({
            user_id: user.id, name: copy.name, brand: copy.brand || null,
            cal: copy.cal || 0, protein: copy.p || 0, carbs: copy.c || 0,
            fat: copy.f || 0, fiber: copy.fiber || 0, serving: copy.serving || '1 serving',
            serving_unit: copy.sUnit || null, barcode: copy.barcode || null,
            favorite: false, sort_order: idx + 1,
          }).select('id').single()
        ).then(({ data }) => {
          if (data?.id) {
            setLocalCache(p => {
              const fs = [...(p.customFoods || [])];
              const ti = fs.findIndex(f => f.name === copy.name && !(f as any)._id);
              if (ti !== -1) fs[ti] = { ...fs[ti], _id: data.id } as any;
              return { ...p, customFoods: fs };
            });
          }
        }).catch((err: any) => console.error('Failed to duplicate custom food:', err));
      }
      return updated;
    });
  }, [user, isGuest, saveLocalBackup, saveGuestData]);

  const purchaseTheme = (themeId: string) => {
    const current = localCache.settings?.purchasedThemes || ['obsidian', 'cybermancer'];
    if (!current.includes(themeId)) updateSettings({ purchasedThemes: [...current, themeId] });
  };

  // ── Staging Tray ────────────────────────────────────────────────────────

  const updateStagingTray = useCallback((newTray: StagedFood[]) => {
    setStagingTray(newTray);
    setLocalCache(prev => {
      const updated = { ...prev, stagingTray: newTray };
      saveLocalBackup(updated);
      if (isGuest && user?.id === 'guest') { saveGuestData(updated); return updated; }
      if (trayDebounceRef.current) clearTimeout(trayDebounceRef.current);
      trayDebounceRef.current = setTimeout(() => saveTrayToDb(newTray), 1500) as any;
      return updated;
    });
  }, [isGuest, user, saveLocalBackup, saveGuestData, saveTrayToDb]);

  const addToTray = (food: Food) => {
    const exists = stagingTray.find(f => (f.id && f.id === (food as any).id) || (f.name === food.name && f.serving === food.serving));
    if (!exists) updateStagingTray([...stagingTray, { ...food, qty: 1, unit: (food as any).sUnit || 'serving' }]);
  };

  const removeFromTray = (idx: number) => updateStagingTray(stagingTray.filter((_, i) => i !== idx));

  const updateTrayItem = (idx: number, updates: Partial<StagedFood>) => {
    const next = [...stagingTray];
    next[idx] = { ...next[idx], ...updates };
    updateStagingTray(next);
  };

  const clearTray = () => updateStagingTray([]);

  const updateLocalCache = useCallback((newCache: LocalCache) => {
    setLocalCache(newCache);
    saveLocalBackup(newCache);
  }, [saveLocalBackup]);

  return (
    <DiaryContext.Provider value={{
      localCache, currentDate, syncStatus, changeDate, updateDayData,
      addFoodLog, removeFoodLog, updateFoodLog, updateGoals,
      saveCustomFood, updateCustomFood, deleteCustomFood, goToDate,
      updateSettings, purchaseTheme,
      stagingTray, addToTray, removeFromTray, updateTrayItem, clearTray,
      toggleFavorite, duplicateCustomFood, moveFoodLog,
      isScannerActive, setIsScannerActive,
      updateLocalCache,
      dataReady, isPro, setIsPro,
    }}>
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => useContext(DiaryContext);
