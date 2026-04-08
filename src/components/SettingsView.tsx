import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDiary } from '../context/DiaryContext';
import { User, Mail, Lock, ShieldCheck, AlertCircle, Loader2, Settings as SettingsIcon, Trash2, Palette, RotateCcw, Check } from 'lucide-react';
import { useTheme, type ThemeName } from '../context/ThemeContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { supabase } from '../lib/supabase';

export const SettingsView: React.FC = () => {
  const { user, isGuest, updateEmail, updatePassword } = useAuth();
  const { localCache, updateSettings, purchaseTheme } = useDiary();
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

  const themes: { id: ThemeName; name: string; emoji: string; price: number; color: string }[] = [
    { id: 'obsidian', name: 'Obsidian 🌑', emoji: '🌑', price: 0, color: '#00F5D4' },
    { id: 'cybermancer', name: 'Cybermancer 🔮', emoji: '🔮', price: 0, color: '#FF00E5' },
    { id: 'gold-reserve', name: 'Gold Reserve 🔱', emoji: '🔱', price: 0, color: '#D4AF37' },
    { id: 'glacier-peak', name: 'Glacier Peak 🏔️', emoji: '🏔️', price: 0, color: '#0077B6' },
    { id: 'forest-phantom', name: 'Forest Phantom 🌿', emoji: '🌿', price: 0, color: '#92FE9D' },
    { id: 'midnight-crimson', name: 'Midnight Crimson 🩸', emoji: '🩸', price: 0, color: '#E63946' },
    { id: 'sunset-horizon', name: 'Sunset Horizon 🌅', emoji: '🌅', price: 0, color: '#FF9F1C' },
    { id: 'quantum-violet', name: 'Quantum Violet 🌌', emoji: '🌌', price: 0, color: '#9A48D0' },
    { id: 'matcha-zen', name: 'Matcha Zen 🍵', emoji: '🍵', price: 0, color: '#7A9B76' },
    { id: 'sandstone', name: 'Sandstone 🏜️', emoji: '🏜️', price: 0, color: '#A67C52' },
    // Greek Themes
    { id: 'olympian-gold', name: 'Olympian Gold ⚡', emoji: '⚡', price: 0, color: '#D4AF37' },
    { id: 'aegean-mist', name: 'Aegean Mist 🌊', emoji: '🌊', price: 0, color: '#00C9FF' },
    { id: 'hades-ember', name: 'Hades\' Ember 🔥', emoji: '🔥', price: 0, color: '#FF4500' },
    { id: 'athenas-wisdom', name: 'Athena\'s Wisdom 🦉', emoji: '🦉', price: 0, color: '#8B9A67' },
    { id: 'dionysus-vineyard', name: 'Dionysus\' Vineyard 🍇', emoji: '🍇', price: 0, color: '#7B2CBF' },
    { id: 'poseidons-depths', name: 'Poseidon\'s Depths 🔱', emoji: '🔱', price: 0, color: '#00A6FB' },
    { id: 'artemis-moonlight', name: 'Artemis\' Moonlight 🌙', emoji: '🌙', price: 0, color: '#A5B4FC' },
    { id: 'hermes-swiftness', name: 'Hermes\' Swiftness 👟', emoji: '👟', price: 0, color: '#F97316' },
    { id: 'spartan-grit', name: 'Spartan Grit 🛡️', emoji: '🛡️', price: 0, color: '#991B1B' },
    { id: 'oracles-vision', name: 'Oracle\'s Vision 🔮', emoji: '🔮', price: 0, color: '#C084FC' },
    // New Themes
    { id: 'solar-flare', name: 'Solar Flare ☀️', emoji: '☀️', price: 500, color: '#FF9F1C' },
    { id: 'deep-sea', name: 'Deep Sea 🌊', emoji: '🌊', price: 500, color: '#0077B6' },
    { id: 'sakura-spring', name: 'Sakura Spring 🌸', emoji: '🌸', price: 500, color: '#FFB7C5' },
    { id: 'neon-wasteland', name: 'Neon Wasteland ⚡', emoji: '⚡', price: 500, color: '#39FF14' },
    { id: 'emerald-city', name: 'Emerald City 🏰', emoji: '🏰', price: 500, color: '#50C878' },
    { id: 'carbon-fiber', name: 'Carbon Fiber 🏎️', emoji: '🏎️', price: 500, color: '#333333' },
    { id: 'sahara-gold', name: 'Sahara Gold 🏜️', emoji: '🏜️', price: 500, color: '#E1AD01' },
    { id: 'midnight-galaxy', name: 'Midnight Galaxy 🌌', emoji: '🌌', price: 500, color: '#7B2CBF' },
    { id: 'nordic-frost', name: 'Nordic Frost 🧊', emoji: '🧊', price: 500, color: '#A5D8FF' },
    { id: 'ember-forge', name: 'Ember Forge ⚒️', emoji: '⚒️', price: 500, color: '#B22222' },
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


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Info */}
      <div style={{ background: 'linear-gradient(145deg, var(--theme-panel, rgba(255,255,255,0.05)) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--theme-text, #fff)' }}>
          <User size={22} color="var(--theme-accent, #00C9FF)" /> Settings & Profile
        </h2>
        <p style={{ color: 'var(--theme-text-dim, #8b8b9b)', fontSize: '14px', margin: 0 }}>Manage your account security and personalize your experience.</p>
      </div>

      {message.text && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: message.type === 'success' ? 'var(--theme-success-dim, rgba(146,254,157,0.1))' : 'var(--theme-error-dim, rgba(255,107,107,0.1))', color: message.type === 'success' ? 'var(--theme-success, #92FE9D)' : 'var(--theme-error, #FF6B6B)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${message.type === 'success' ? 'var(--theme-success-dim, rgba(146,254,157,0.2))' : 'var(--theme-error-dim, rgba(255,107,107,0.2))'}` }}>
          {message.type === 'success' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Account Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Email Settings */}
        <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: '700', color: 'var(--theme-text, #fff)' }}><Mail size={18} color="var(--theme-accent, #4DABF7)" /> Account Email</div>
          <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', fontWeight: '700' }}>Electronic Mail Address</label>
            <input 
              type="email" 
              style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '10px', padding: '12px', color: 'var(--theme-text, #fff)', outline: 'none' }}
              className="inp" 
              value={emailInput} 
              onChange={e => setEmailInput(e.target.value)} 
              disabled={isGuest || loading}
            />
            <button type="submit" disabled={isGuest || loading} className="btn" style={{ marginTop: '8px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', fontWeight: '800', borderRadius: '10px', padding: '12px', border: 'none', cursor: 'pointer' }}>
              {loading ? <Loader2 className="spin" size={16} /> : 'Update Email'}
            </button>
            {isGuest && <p style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', textAlign: 'center', margin: 0 }}>Log in to change account details.</p>}
          </form>
        </div>

        {/* Password Settings */}
        <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: '700', color: 'var(--theme-text, #fff)' }}><Lock size={18} color="var(--theme-error, #FF6B6B)" /> Security Password</div>
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)', textTransform: 'uppercase', fontWeight: '700' }}>New Password</label>
            <input 
              type="password" 
              style={{ background: 'var(--theme-panel-dim, rgba(0,0,0,0.2))', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '10px', padding: '12px', color: 'var(--theme-text, #fff)', outline: 'none' }}
              value={passInput} 
              onChange={e => setPassInput(e.target.value)} 
              placeholder="••••••••"
              disabled={isGuest || loading}
            />
            <button type="submit" disabled={isGuest || loading} style={{ marginTop: '8px', background: 'var(--theme-error-dim, rgba(255,107,107,0.2))', color: 'var(--theme-error, #FF6B6B)', fontWeight: '800', borderRadius: '10px', padding: '12px', border: 'none', cursor: 'pointer' }}>
              {loading ? <Loader2 className="spin" size={16} /> : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
      {/* Theme Section */}
      <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: 'var(--theme-text, #fff)' }}>
            <Palette size={20} color="var(--theme-accent, #00C9FF)" /> Visual Identity
          </div>
          <button 
            onClick={() => setTheme('obsidian')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--theme-panel-dim, rgba(255,255,255,0.05))', border: 'none', color: 'var(--theme-text-dim, #8b8b9b)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            <RotateCcw size={14} /> Reset to Stock
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
          {themes.map(t => {
            const isSelected = currentThemeName === t.id;
            const isPurchased = purchasedThemes.includes(t.id);
            return (
              <div 
                key={t.id}
                onClick={() => handleSelectTheme(t)}
                style={{ 
                  padding: '16px 12px', 
                  borderRadius: '20px', 
                  background: isSelected ? 'var(--theme-accent-dim, rgba(0,201,255,0.1))' : 'var(--theme-panel-dim, rgba(0,0,0,0.2))',
                  border: isSelected ? '2px solid var(--theme-accent, #00C9FF)' : '2px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  opacity: isPurchased ? 1 : 0.6
                }}
              >
                {!isPurchased && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', fontSize: '8px', fontWeight: '900', padding: '2px 4px', borderRadius: '4px' }}>
                    BUY
                  </div>
                )}
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{t.emoji}</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: isSelected ? 'var(--theme-text, #fff)' : 'var(--theme-text-dim, #8b8b9b)', marginBottom: '2px' }}>{t.name}</div>
                <div style={{ fontSize: '9px', color: 'var(--theme-accent, #00C9FF)', fontWeight: '700', marginBottom: '6px' }}>{t.price} GEMS</div>
                <div style={{ width: '30px', height: '4px', borderRadius: '2px', background: t.color, margin: '0 auto' }} />
                
                {isSelected && (
                  <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', background: 'var(--theme-accent, #00C9FF)', color: 'var(--theme-panel-base, #000)', borderRadius: '50%', padding: '2px' }}>
                    <Check size={10} strokeWidth={4} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preferences Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Unit Preferences */}
        <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: '700', color: 'var(--theme-text, #fff)' }}><SettingsIcon size={18} color="var(--theme-accent, #00C9FF)" /> Unit Preferences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text, #fff)' }}>Weight Unit</div>
                <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)' }}>Kilograms vs Pounds</div>
              </div>
              <div style={{ display: 'flex', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '4px', borderRadius: '10px' }}>
                <button 
                  onClick={() => updateSettings({ units: { ...settings.units, weight: 'kg' } })}
                  style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: settings.units.weight === 'kg' ? 'var(--theme-accent, #00C9FF)' : 'transparent', color: settings.units.weight === 'kg' ? 'var(--theme-panel-base, #000)' : 'var(--theme-text-dim, #8b8b9b)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>KG</button>
                <button 
                  onClick={() => updateSettings({ units: { ...settings.units, weight: 'lb' } })}
                  style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: settings.units.weight === 'lb' ? 'var(--theme-accent, #00C9FF)' : 'transparent', color: settings.units.weight === 'lb' ? 'var(--theme-panel-base, #000)' : 'var(--theme-text-dim, #8b8b9b)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>LB</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text, #fff)' }}>Height Unit</div>
                <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)' }}>Metric vs Imperial</div>
              </div>
              <div style={{ display: 'flex', background: 'var(--theme-panel-dim, rgba(0,0,0,0.3))', padding: '4px', borderRadius: '10px' }}>
                <button 
                  onClick={() => updateSettings({ units: { ...settings.units, height: 'cm' } })}
                  style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: settings.units.height === 'cm' ? 'var(--theme-accent, #00C9FF)' : 'transparent', color: settings.units.height === 'cm' ? 'var(--theme-panel-base, #000)' : 'var(--theme-text-dim, #8b8b9b)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>CM</button>
                <button 
                  onClick={() => updateSettings({ units: { ...settings.units, height: 'ft' } })}
                  style={{ padding: '6px 12px', border: 'none', borderRadius: '8px', background: settings.units.height === 'ft' ? 'var(--theme-accent, #00C9FF)' : 'transparent', color: settings.units.height === 'ft' ? 'var(--theme-panel-base, #000)' : 'var(--theme-text-dim, #8b8b9b)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>FT/IN</button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div style={{ background: 'var(--theme-panel, rgba(255,255,255,0.03))', border: '1px solid var(--theme-border, rgba(255,255,255,0.05))', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: '700', color: 'var(--theme-text, #fff)' }}><AlertCircle size={18} color="#FFD700" /> Notifications</div>
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
      <div style={{ marginTop: '20px', padding: '24px', borderRadius: '24px', background: 'var(--theme-error-dim, rgba(255, 107, 107, 0.05))', border: '1px solid var(--theme-border, rgba(255, 107, 107, 0.2))' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--theme-error, #FF6B6B)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Trash2 size={18} /> Danger Zone
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-dim, #8b8b9b)', marginBottom: '16px', lineHeight: '1.5' }}>
          Deleting your account will remove all logs, custom foods, and progress from our cloud database. This process is immediate and can never be reversed.
        </p>
        <button 
          onClick={handleDeleteAccount}
          disabled={loading}
          style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--theme-error, #FF6B6B)', background: 'transparent', color: 'var(--theme-error, #FF6B6B)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          {loading ? <Loader2 className="spin" size={16} /> : 'Delete Account & Data'}
        </button>
      </div>

    </div>
  );
};

const NotificationToggle = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text, #fff)' }}>{label}</div>
      <div style={{ fontSize: '11px', color: 'var(--theme-text-dim, #8b8b9b)' }}>{desc}</div>
    </div>
    <input 
      type="checkbox" 
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ width: '18px', height: '18px', accentColor: 'var(--theme-accent, #00C9FF)', cursor: 'pointer' }}
    />
  </div>
);
