import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { User, Mail, Lock, ShieldCheck, AlertCircle, Loader2, Settings as SettingsIcon, Trash2, Palette, RotateCcw, Check, X, BookmarkCheck } from 'lucide-react';
import { useTheme, type ThemeName } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { supabase } from '../lib/supabase';

export const SettingsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, isGuest, updateEmail, updatePassword } = useAuth();
  const { localCache, updateSettings, purchaseTheme, updateLocalCache } = useDiary();
  const { theme: currentThemeName, setTheme } = useTheme();

  const rewards = getRewardBreakdown(localCache);
  const currentGems = rewards.totalGems;

  const defaultSettings = {
    units: { weight: 'kg', height: 'cm' },
    notifications: { 
      reminders: true, 
      goals: true,
      morningNudge: true,
      afternoonCheck: true,
      eveningSummary: true,
      waterReminders: true,
      streakAlert: true
    },
    purchasedThemes: [
      'obsidian', 'cybermancer', 'gold-reserve', 'glacier-peak', 
      'forest-phantom', 'midnight-crimson', 'sunset-horizon', 
      'quantum-violet', 'matcha-zen', 'sandstone'
    ]
  };

  const settings = {
    ...defaultSettings,
    ...(localCache.settings || {}),
    units: { ...defaultSettings.units, ...(localCache.settings?.units || {}) },
    notifications: { ...defaultSettings.notifications, ...(localCache.settings?.notifications || {}) }
  };

  const purchasedThemes = settings.purchasedThemes;

  const themes: { id: ThemeName; name: string; emoji: string; price: number; colors: string[] }[] = [
    { id: 'obsidian', name: 'Obsidian', emoji: '🌑', price: 0, colors: ['#080A0F', '#00F5D4'] },
    { id: 'olympian-gold', name: 'Olympian Gold', emoji: '⚡', price: 0, colors: ['#0F0D08', '#D4AF37'] },
    { id: 'neon-wasteland', name: 'Neon Wasteland', emoji: '⚡', price: 0, colors: ['#0D0221', '#39FF14'] },
    { id: 'cybermancer', name: 'Cybermancer', emoji: '🔮', price: 0, colors: ['#0D0221', '#FF00E5'] },
    { id: 'aegean-mist', name: 'Aegean Mist', emoji: '🌊', price: 0, colors: ['#F0FBFF', '#0088CC'] },
    { id: 'solar-flare', name: 'Solar Flare', emoji: '☀️', price: 0, colors: ['#1A0700', '#FF9F1C'] },
    { id: 'midnight-crimson', name: 'Midnight Crimson', emoji: '🩸', price: 0, colors: ['#050000', '#E63946'] },
    { id: 'hades-ember', name: 'Hades\' Ember', emoji: '🔥', price: 0, colors: ['#0A0202', '#FF4500'] },
    { id: 'deep-sea', name: 'Deep Sea', emoji: '🌊', price: 0, colors: ['#001219', '#0077B6'] },
    { id: 'glacier-peak', name: 'Glacier Peak', emoji: '🏔️', price: 0, colors: ['#F0F4F8', '#0077B6'] },
    { id: 'athenas-wisdom', name: 'Athena\'s Wisdom', emoji: '🦉', price: 0, colors: ['#F5F5DC', '#6B8E23'] },
    { id: 'sakura-spring', name: 'Sakura Spring', emoji: '🌸', price: 0, colors: ['#FFF0F3', '#FF4D6D'] },
    { id: 'forest-phantom', name: 'Forest Phantom', emoji: '🌿', price: 0, colors: ['#0A1410', '#92FE9D'] },
    { id: 'dionysus-vineyard', name: 'Dionysus\' Vineyard', emoji: '🍇', price: 0, colors: ['#1A0A1F', '#9D4EDD'] },
    { id: 'emerald-city', name: 'Emerald City', emoji: '🏰', price: 0, colors: ['#012E1B', '#50C878'] },
    { id: 'sunset-horizon', name: 'Sunset Horizon', emoji: '🌅', price: 0, colors: ['#1A0F0F', '#FF9F1C'] },
    { id: 'poseidons-depths', name: 'Poseidon\'s Depths', emoji: '🔱', price: 0, colors: ['#051923', '#00A6FB'] },
    { id: 'carbon-fiber', name: 'Carbon Fiber', emoji: '🏎️', price: 0, colors: ['#111111', '#E63946'] },
    { id: 'quantum-violet', name: 'Quantum Violet', emoji: '🌌', price: 0, colors: ['#0F0014', '#9A48D0'] },
    { id: 'artemis-moonlight', name: 'Artemis\' Moonlight', emoji: '🌙', price: 0, colors: ['#0B0E14', '#A5B4FC'] },
    { id: 'sahara-gold', name: 'Sahara Gold', emoji: '🏜️', price: 0, colors: ['#F5E6BE', '#D4AF37'] },
    { id: 'gold-reserve', name: 'Gold Reserve', emoji: '🔱', price: 0, colors: ['#111111', '#D4AF37'] },
    { id: 'hermes-swiftness', name: 'Hermes\' Swiftness', emoji: '👟', price: 0, colors: ['#1F1D1A', '#F97316'] },
    { id: 'midnight-galaxy', name: 'Midnight Galaxy', emoji: '🌌', price: 0, colors: ['#10002B', '#E0AAFF'] },
    { id: 'matcha-zen', name: 'Matcha Zen', emoji: '🍵', price: 0, colors: ['#E6E9E1', '#7A9B76'] },
    { id: 'spartan-grit', name: 'Spartan Grit', emoji: '🛡️', price: 0, colors: ['#0F0A0A', '#991B1B'] },
    { id: 'nordic-frost', name: 'Nordic Frost', emoji: '🧊', price: 0, colors: ['#F0F8FF', '#4682B4'] },
    { id: 'sandstone', name: 'Sandstone', emoji: '🏜️', price: 0, colors: ['#F4E8D1', '#A67C52'] },
    { id: 'oracles-vision', name: 'Oracle\'s Vision', emoji: '🔮', price: 0, colors: ['#0D0B12', '#C084FC'] },
    { id: 'ember-forge', name: 'Ember Forge', emoji: '⚒️', price: 0, colors: ['#1B0B04', '#FF4500'] },
    // Tropical Escape Collection 🏝️
    { id: 'island-palm', name: 'Island Palm', emoji: '🌴', price: 0, colors: ['#F0FDF4', '#10B981'] },
    { id: 'azure-tide', name: 'Azure Tide', emoji: '🌊', price: 0, colors: ['#F0F9FF', '#06B6D4'] },
    { id: 'mango-salsa', name: 'Mango Salsa', emoji: '🥭', price: 0, colors: ['#FFF7ED', '#F97316'] },
    { id: 'hibiscus-bloom', name: 'Hibiscus Bloom', emoji: '🌺', price: 0, colors: ['#FFF1F2', '#E11D48'] },
    { id: 'blue-hawaiian', name: 'Blue Hawaiian', emoji: '🍹', price: 0, colors: ['#EFF6FF', '#3B82F6'] },
    { id: 'solar-breeze', name: 'Solar Breeze', emoji: '☀️', price: 0, colors: ['#FEFCE8', '#F59E0B'] },
    { id: 'coconut-milk', name: 'Coconut Milk', emoji: '🥥', price: 0, colors: ['#FAFAFA', '#71717A'] },
    { id: 'golden-pine', name: 'Golden Pine', emoji: '🍍', price: 0, colors: ['#FEFCE8', '#84CC16'] },
    { id: 'lava-orchid', name: 'Lava Orchid', emoji: '🌋', price: 0, colors: ['#FDF2F8', '#DB2777'] },
    { id: 'surf-neon', name: 'Surf Neon', emoji: '🏄', price: 0, colors: ['#ECFEFF', '#D946EF'] },
  ];

  const handleSelectTheme = (t: any) => {
    if (purchasedThemes.includes(t.id)) {
      setTheme(t.id);
    } else {
      if (currentGems >= t.price) {
        purchaseTheme(t.id);
        setTheme(t.id);
      } else {
        alert("Not enough gems!");
      }
    }
  };

  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [passInput, setPassInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });


  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;
    setLoading(true);
    try {
      await updateEmail(emailInput);
      setMessage({ text: 'Email update initiated. Check your inbox to confirm.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;
    if (passInput.length < 6) return setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
    setLoading(true);
    try {
      await updatePassword(passInput);
      setMessage({ text: 'Password successfully updated!', type: 'success' });
      setPassInput('');
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    const isActuallyGuest = isGuest || !user;
    
    if (isActuallyGuest) {
      if (window.confirm("Are you sure? This will permanently delete your guest data on this browser.")) {
        localStorage.removeItem('ft_guest');
        window.location.reload();
      }
      return;
    }
    
    const confirm1 = window.confirm("CRITICAL WARNING: This will permanently delete your diet history, food logs, and account settings. This action is irreversible. Proceed?");
    if (!confirm1) return;
    
    const confirm2 = window.prompt("Final confirmation: type 'DELETE' (all caps) to purge your account data:");
    if (confirm2 !== 'DELETE') return;

    setLoading(true);
    try {
      // Delete user_data row
      const { error } = await supabase.from('user_data').delete().eq('user_id', user.id);
      if (error) throw error;
      
      // Sign out
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
    setLoading(false);
  };

  const toggleWeightUnit = (toUnit: 'lb' | 'kg') => {
    const currentUnit = settings.units.weight;
    if (currentUnit === toUnit) return;

    const mult = toUnit === 'kg' ? 1 / 2.20462 : 2.20462;
    const newCache = { ...localCache };

    // 1. Convert historical weights in entries
    Object.keys(newCache).forEach(k => {
      if (k.match(/^\d{4}-\d{2}-\d{2}$/) && newCache[k].weight) {
        newCache[k] = { ...newCache[k], weight: Number((newCache[k].weight * mult).toFixed(1)) };
      }
    });

    // 2. Convert goals
    if (newCache.goals) {
      const g = { ...newCache.goals };
      if (g.weight) g.weight = Number((g.weight * mult).toFixed(1));
      if (g.targetWeight) g.targetWeight = Number((g.targetWeight * mult).toFixed(1));
      if (g.rate) {
        g.rate = Number((g.rate * mult).toFixed(2));
      }
      newCache.goals = g;
    }

    // 3. Update settings
    newCache.settings = {
      ...newCache.settings,
      units: { ...(newCache.settings?.units || { height: 'cm' }), weight: toUnit }
    };

    updateLocalCache(newCache);
    setMessage({ text: `Converted history and goals to ${toUnit.toUpperCase()}!`, type: 'success' });
  };


  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div 
        style={{ 
          background: 'var(--theme-bg, var(--theme-panel, #0a1e21))', 
          border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', 
          borderRadius: '28px', 
          width: '100%', 
          maxWidth: '800px', 
          maxHeight: '85vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--theme-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--theme-panel, rgba(0,0,0,0.2))' }}>
           <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-text)' }}>
             <SettingsIcon size={22} color="var(--theme-accent)" /> App Settings
           </h2>
           <button 
             onClick={onClose} 
             style={{ 
               background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', 
               border: '1px solid var(--theme-border)', 
               color: 'var(--theme-text)', 
               cursor: 'pointer', 
               padding: '8px', 
               borderRadius: '12px', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               transition: 'all 0.2s' 
             }} 
           >
             <X size={20} />
           </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* existing content goes here */}
          
          <div className="section" style={{ background: 'linear-gradient(145deg, var(--theme-panel) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-text)' }}>
              <User size={22} color="var(--theme-accent)" /> Settings & Profile
            </h2>
            <p style={{ color: 'var(--theme-text-dim)', fontSize: '14px', margin: 0 }}>Manage your account security and personalize your experience.</p>
          </div>

          {message.text && (
            <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', background: message.type === 'success' ? 'var(--theme-success-dim)' : 'var(--theme-error-dim)', color: message.type === 'success' ? 'var(--theme-success)' : 'var(--theme-error)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', border: `1px solid var(--theme-border)` }}>
              {message.type === 'success' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* Account Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
            
            {/* Email Settings */}
            <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', fontWeight: '700', color: 'var(--theme-text)' }}><Mail size={18} color="var(--theme-accent)" /> Account Email</div>
              <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="lbl">Email Address</label>
                <input 
                  type="email" 
                  className="inp" 
                  value={emailInput} 
                  onChange={e => setEmailInput(e.target.value)} 
                  disabled={isGuest || loading}
                />
                <button type="submit" disabled={isGuest || loading} className="btn" style={{ marginTop: '8px', background: 'var(--theme-accent)', color: '#000' }}>
                  {loading ? <Loader2 className="spin" size={16} /> : 'Update Email'}
                </button>
                {isGuest && <p style={{ fontSize: '11px', color: 'var(--theme-text-dim)', textAlign: 'center', margin: 0 }}>Log in to change account details.</p>}
              </form>
            </div>

            {/* Password Settings */}
            <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', fontWeight: '700', color: 'var(--theme-text)' }}><Lock size={18} color="var(--theme-error)" /> Security Password</div>
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="lbl">New Password</label>
                <input 
                  type="password" 
                  className="inp"
                  value={passInput} 
                  onChange={e => setPassInput(e.target.value)} 
                  placeholder="••••••••"
                  disabled={isGuest || loading}
                />
                <button type="submit" disabled={isGuest || loading} className="btn" style={{ marginTop: '8px', background: 'var(--theme-error-dim)', color: 'var(--theme-error)' }}>
                  {loading ? <Loader2 className="spin" size={16} /> : 'Change Password'}
                </button>
              </form>
            </div>

          </div>

          {/* Theme Section */}
          <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)' }}>
                <Palette size={20} color="var(--theme-accent)" /> Visual Identity
              </div>
              <button 
                onClick={() => setTheme('obsidian')}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, padding: '6px 12px', fontSize: '12px' }}
              >
                <RotateCcw size={14} /> Reset to Stock
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-md)' }}>
              {themes.map(t => {
                const isSelected = currentThemeName === t.id;
                const isPurchased = purchasedThemes.includes(t.id);
                return (
                  <div 
                    key={t.id}
                    onClick={() => handleSelectTheme(t)}
                    style={{ 
                      padding: 'var(--space-lg) var(--space-md)', 
                      borderRadius: 'var(--radius-lg)', 
                      background: isSelected ? 'var(--theme-accent-dim)' : 'var(--theme-panel-dim)',
                      border: isSelected ? '2px solid var(--theme-accent)' : '2px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      opacity: isPurchased ? 1 : 0.6,
                      boxShadow: isSelected 
                        ? `0 12px 30px var(--theme-accent-dim), 0 0 15px var(--theme-accent-dim)` 
                        : '0 4px 12px rgba(0, 0, 0, 0.12)',
                      transform: isSelected ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
                    }}
                  >
                    {!isPurchased && (
                      <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--theme-accent)', color: '#000', fontSize: '8px', fontWeight: '900', padding: '2px 4px', borderRadius: '4px' }}>
                        BUY
                      </div>
                    )}
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{t.emoji}</div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: '900', 
                      color: isSelected ? 'var(--theme-text)' : 'var(--theme-text-dim)', 
                      marginBottom: '6px',
                      textShadow: isSelected ? '0 0 10px var(--theme-accent, #00C9FF), 0 0 20px var(--theme-accent, #00C9FF)' : 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>{t.name}</div>
                    {!isPurchased && <div style={{ fontSize: '9px', color: 'var(--theme-accent)', fontWeight: '700', marginBottom: '8px' }}>{t.price} GEMS</div>}
                    
                    <div style={{ display: 'flex', gap: '4px', width: '50px', height: '10px', margin: '0 auto', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', boxShadow: isSelected ? '0 0 12px var(--theme-accent)' : 'none' }}>
                      <div style={{ flex: 1, background: t.colors[0] }} />
                      <div style={{ flex: 1, background: t.colors[1] }} />
                    </div>
                    
                    {isSelected && (
                      <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', background: 'var(--theme-accent)', color: '#000', borderRadius: '50%', padding: '2px', boxShadow: '0 4px 12px var(--theme-accent-dim)' }}>
                        <Check size={10} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferences Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
            
            {/* Unit Preferences */}
            <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', fontWeight: '700', color: 'var(--theme-text)' }}><SettingsIcon size={18} color="var(--theme-accent)" /> Unit Preferences</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)' }}>Weight Unit</div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>Kilograms vs Pounds</div>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--theme-panel-dim)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                    <button 
                      onClick={() => toggleWeightUnit('kg')}
                      style={{ padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-sm)', background: settings.units.weight === 'kg' ? 'var(--theme-accent)' : 'transparent', color: settings.units.weight === 'kg' ? '#000' : 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>KG</button>
                    <button 
                      onClick={() => toggleWeightUnit('lb')}
                      style={{ padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-sm)', background: settings.units.weight === 'lb' ? 'var(--theme-accent)' : 'transparent', color: settings.units.weight === 'lb' ? '#000' : 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>LB</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)' }}>Height Unit</div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>Metric vs Imperial</div>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--theme-panel-dim)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                    <button 
                      onClick={() => updateSettings({ units: { ...settings.units, height: 'cm' } })}
                      style={{ padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-sm)', background: settings.units.height === 'cm' ? 'var(--theme-accent)' : 'transparent', color: settings.units.height === 'cm' ? '#000' : 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>CM</button>
                    <button 
                      onClick={() => updateSettings({ units: { ...settings.units, height: 'ft' } })}
                      style={{ padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-sm)', background: settings.units.height === 'ft' ? 'var(--theme-accent)' : 'transparent', color: settings.units.height === 'ft' ? '#000' : 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>FT/IN</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', fontWeight: '700', color: 'var(--theme-text)' }}><AlertCircle size={18} color="var(--theme-warning)" /> Notifications</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <NotificationToggle 
                  label="General Reminders" 
                  desc="Morning and evening nudges" 
                  checked={settings.notifications.reminders} 
                  onChange={val => updateSettings({ notifications: { ...settings.notifications, reminders: val } })} 
                />
                <NotificationToggle 
                  label="Goal Progress" 
                  desc="Alerts for reaching targets" 
                  checked={settings.notifications.goals} 
                  onChange={val => updateSettings({ notifications: { ...settings.notifications, goals: val } })} 
                />
                <NotificationToggle 
                  label="Morning Nudge" 
                  desc="Daily motivation at 8:00 AM" 
                  checked={settings.notifications.morningNudge} 
                  onChange={val => updateSettings({ notifications: { ...settings.notifications, morningNudge: val } })} 
                />
                <NotificationToggle 
                  label="Afternoon Check" 
                  desc="Lunch tracking reminder" 
                  checked={settings.notifications.afternoonCheck} 
                  onChange={val => updateSettings({ notifications: { ...settings.notifications, afternoonCheck: val } })} 
                />
                <NotificationToggle 
                  label="Evening Summary" 
                  desc="Daily macro report" 
                  checked={settings.notifications.eveningSummary} 
                  onChange={val => updateSettings({ notifications: { ...settings.notifications, eveningSummary: val } })} 
                />
                <NotificationToggle 
                  label="Water Reminders" 
                  desc="Hourly hydration nudges" 
                  checked={settings.notifications.waterReminders} 
                  onChange={val => updateSettings({ notifications: { ...settings.notifications, waterReminders: val } })} 
                />
                <NotificationToggle 
                  label="Streak Alert" 
                  desc="Warning when your streak is at risk" 
                  checked={settings.notifications.streakAlert} 
                  onChange={val => updateSettings({ notifications: { ...settings.notifications, streakAlert: val } })} 
                />
              </div>
            </div>

          </div>

          {/* Danger Zone */}
          <div className="section" style={{ background: 'var(--theme-error-dim)', border: '1px solid var(--theme-error)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--theme-error)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)' }}>
              <Trash2 size={18} /> Danger Zone
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-dim)', marginBottom: 'var(--space-lg)', lineHeight: '1.5' }}>
              Deleting your account will remove all logs, custom foods, and progress from our cloud database. This process is immediate and can never be reversed.
            </p>
            <button 
              onClick={handleDeleteAccount}
              disabled={loading}
              className="btn"
              style={{ background: 'transparent', border: '1px solid var(--theme-error)', color: 'var(--theme-error)', marginTop: 0 }}
            >
              {loading ? <Loader2 className="spin" size={16} /> : 'Delete Account & Data'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .lbl { font-size: 11px; color: var(--theme-text-dim); text-transform: uppercase; fontWeight: 700; margin-bottom: 4px; }
        .inp { background: var(--theme-input-bg); border: 1px solid var(--theme-border); border-radius: var(--radius-md); padding: 12px; color: var(--theme-text); outline: none; width: 100%; box-sizing: border-box; }
        .inp:focus { border-color: var(--theme-accent); }
        .btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--theme-panel-dim); border: none; padding: 12px; border-radius: var(--radius-md); color: var(--theme-text); font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 12px; font-family: inherit; }
        .btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
};

export default SettingsView;

const NotificationToggle = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)' }}>{label}</div>
      <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>{desc}</div>
    </div>
    <input 
      type="checkbox" 
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ width: '18px', height: '18px', accentColor: 'var(--theme-accent)', cursor: 'pointer' }}
    />
  </div>
);
