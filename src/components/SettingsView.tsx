import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  User, Mail, Lock, ShieldCheck, AlertCircle, Loader2, Settings as SettingsIcon, 
  Trash2, Palette, RotateCcw, Check, X, Download, Moon, Zap, Sun, Waves, Leaf, 
  Castle, Sunset, Anchor, Gauge, Atom, Crown, Wind, Shield, Eye, Hammer, Sparkles,
  Target, Flame, Dumbbell
} from 'lucide-react';

const getThemeIcon = (id: ThemeName, color: string, size = 16) => {
  switch (id) {
    case 'obsidian': return <Moon size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'olympian-gold': return <Zap size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'neon-wasteland': return <Zap size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'cybermancer': return <Sparkles size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'solar-flare': return <Sun size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'deep-sea': return <Waves size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'forest-phantom': return <Leaf size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'dionysus-vineyard': return <Sparkles size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'emerald-city': return <Castle size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'sunset-horizon': return <Sunset size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'poseidons-depths': return <Anchor size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'carbon-fiber': return <Gauge size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'quantum-violet': return <Atom size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'artemis-moonlight': return <Moon size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'gold-reserve': return <Crown size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'hermes-swiftness': return <Wind size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'midnight-galaxy': return <Atom size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'spartan-grit': return <Shield size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'oracles-vision': return <Eye size={size} color={color} style={{ flexShrink: 0 }} />;
    case 'ember-forge': return <Hammer size={size} color={color} style={{ flexShrink: 0 }} />;
    default: return <Sparkles size={size} color={color} style={{ flexShrink: 0 }} />;
  }
};
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { PromptDialog } from './PromptDialog';
import { useTheme, type ThemeName } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDiary } from '../context/DiaryContext';
import { getRewardBreakdown } from '../lib/reward-utils';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';

export const SettingsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, isGuest, updateEmail, updatePassword, convertGuestToPermanent } = useAuth();
  const { localCache, updateSettings, purchaseTheme, updateLocalCache, isPro } = useDiary();
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
      'obsidian', 'cybermancer', 'gold-reserve', 
      'forest-phantom', 'sunset-horizon', 
      'quantum-violet'
    ]
  };

  const settings = {
    ...defaultSettings,
    ...(localCache.settings || {}),
    units: { ...defaultSettings.units, ...(localCache.settings?.units || {}) },
    notifications: { ...defaultSettings.notifications, ...(localCache.settings?.notifications || {}) }
  };

  const purchasedThemes = settings.purchasedThemes;

  const themes: { id: ThemeName; name: string; price: number; colors: string[] }[] = [
    { id: 'obsidian', name: 'Obsidian', price: 0, colors: ['#080A0F', '#00F5D4'] },
    { id: 'olympian-gold', name: 'Olympian Gold', price: 0, colors: ['#0F0D08', '#D4AF37'] },
    { id: 'neon-wasteland', name: 'Neon Wasteland', price: 0, colors: ['#0D0221', '#39FF14'] },
    { id: 'cybermancer', name: 'Cybermancer', price: 0, colors: ['#0D0221', '#FF00E5'] },
    { id: 'solar-flare', name: 'Solar Flare', price: 0, colors: ['#1A0700', '#FF9F1C'] },
    { id: 'deep-sea', name: 'Deep Sea', price: 0, colors: ['#001219', '#0077B6'] },
    { id: 'forest-phantom', name: 'Forest Phantom', price: 0, colors: ['#0A1410', '#92FE9D'] },
    { id: 'dionysus-vineyard', name: 'Dionysus\' Vineyard', price: 0, colors: ['#1A0A1F', '#9D4EDD'] },
    { id: 'emerald-city', name: 'Emerald City', price: 0, colors: ['#012E1B', '#50C878'] },
    { id: 'sunset-horizon', name: 'Sunset Horizon', price: 0, colors: ['#1A0F0F', '#FF9F1C'] },
    { id: 'poseidons-depths', name: 'Poseidon\'s Depths', price: 0, colors: ['#051923', '#00A6FB'] },
    { id: 'carbon-fiber', name: 'Carbon Fiber', price: 0, colors: ['#111111', '#E63946'] },
    { id: 'quantum-violet', name: 'Quantum Violet', price: 0, colors: ['#0F0014', '#9A48D0'] },
    { id: 'artemis-moonlight', name: 'Artemis\' Moonlight', price: 0, colors: ['#0B0E14', '#A5B4FC'] },
    { id: 'gold-reserve', name: 'Gold Reserve', price: 0, colors: ['#111111', '#D4AF37'] },
    { id: 'hermes-swiftness', name: 'Hermes\' Swiftness', price: 0, colors: ['#1F1D1A', '#F97316'] },
    { id: 'midnight-galaxy', name: 'Midnight Galaxy', price: 0, colors: ['#10002B', '#E0AAFF'] },
    { id: 'spartan-grit', name: 'Spartan Grit', price: 0, colors: ['#0F0A0A', '#991B1B'] },
    { id: 'oracles-vision', name: 'Oracle\'s Vision', price: 0, colors: ['#0D0B12', '#C084FC'] },
    { id: 'ember-forge', name: 'Ember Forge', price: 0, colors: ['#1B0B04', '#FF4500'] }
  ];

  const handleSelectTheme = (t: any) => {
    if (purchasedThemes.includes(t.id)) {
      setTheme(t.id);
    } else {
      if (currentGems >= t.price) {
        purchaseTheme(t.id);
        setTheme(t.id);
      } else {
        setToastMsg('Not enough gems!');
      }
    }
  };

  const [displayNameInput, setDisplayNameInput] = useState(() => {
    return localCache.settings?.displayName || user?.email?.split('@')[0] || 'Guest';
  });
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [passInput, setPassInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [toastMsg, setToastMsg] = useState('');
  const [deleteStep, setDeleteStep] = useState<'none' | 'confirm' | 'type'>('none');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');

  const handleLinkGuestAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail || !guestPassword) {
      setMessage({ text: 'Please fill in both email and password.', type: 'error' });
      return;
    }
    if (guestPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await convertGuestToPermanent(guestEmail, guestPassword);
      setMessage({ text: 'Guest account successfully secured! You are now logged in with your new credentials.', type: 'success' });
      setGuestEmail('');
      setGuestPassword('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to convert account.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    setStripeLoading(true);
    try {
      const res = await apiFetch('/api/create-checkout-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start Stripe Checkout');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setToastMsg(err.message || 'An error occurred starting checkout');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setStripeLoading(true);
    try {
      const res = await apiFetch('/api/create-portal-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start billing portal');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err: any) {
      setToastMsg(err.message || 'An error occurred loading billing portal');
    } finally {
      setStripeLoading(false);
    }
  };


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

  const handleDeleteAccount = () => {
    setDeleteStep('confirm');
  };

  const executeDelete = async () => {
    const isActuallyGuest = isGuest || !user;
    if (isActuallyGuest) {
      localStorage.removeItem('ft_guest');
      window.location.reload();
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('user_data').delete().eq('user_id', user.id);
      if (error) throw error;
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
      notifications: {},
      purchasedThemes: [],
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
          
          {/* Premium Membership Tier card */}
          <div className="section" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)', 
            border: '1px solid var(--theme-border)', 
            borderRadius: 'var(--radius-lg)', 
            padding: 'var(--space-xl)',
            position: 'relative',
            overflow: 'hidden',
            marginTop: 0
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '-50px', 
              right: '-50px', 
              width: '150px', 
              height: '150px', 
              background: isPro ? 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0,245,212,0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {isPro ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', fontSize: '11px', fontWeight: '900', padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                      <Crown size={12} /> PRO MEMBER
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--theme-text-dim)', fontSize: '11px', fontWeight: '900', padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      FREE MEMBER
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--theme-text)' }}>
                  {isPro ? 'Thank you for supporting Macro Munchers!' : 'Unlock Premium Features'}
                </h3>
                <p style={{ color: 'var(--theme-text-dim)', fontSize: '13px', margin: 0, maxWidth: '480px', lineHeight: 1.5 }}>
                  {isPro 
                    ? 'Your account has active Pro benefits. Manage your subscription, view invoices, or update payment methods.' 
                    : 'Get access to unlimited AI barcode scans, automatic cloud backups, and all 22 custom visual themes.'}
                </p>
              </div>

              <div>
                {isPro ? (
                  <button 
                    onClick={handleManageSubscription}
                    disabled={stripeLoading}
                    className="btn"
                    style={{ margin: 0, padding: '12px 20px', background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}
                  >
                    {stripeLoading ? <Loader2 className="spin" size={16} /> : <SettingsIcon size={16} />}
                    Manage Subscription
                  </button>
                ) : (
                  <button 
                    onClick={handleUpgradeToPro}
                    disabled={stripeLoading}
                    className="btn"
                    style={{ margin: 0, padding: '12px 24px', background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)', color: '#000', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 20px rgba(0, 201, 255, 0.2)' }}
                  >
                    {stripeLoading ? <Loader2 className="spin" size={16} /> : <Zap size={16} />}
                    Upgrade to Pro — $9.99/mo
                  </button>
                )}
              </div>
            </div>
          </div>
          
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
            
            {isGuest ? (
              /* Link/Upgrade Guest Account */
              <div className="section" style={{ background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.08) 0%, rgba(0,0,0,0.4) 100%)', border: '1px solid var(--theme-accent)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)', fontWeight: '800', color: 'var(--theme-text)', fontSize: '15px' }}><ShieldCheck size={20} color="var(--theme-accent)" /> Secure Your Data & Convert Account</div>
                <p style={{ color: 'var(--theme-text-dim)', fontSize: '13px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  You are currently using a **Guest Session**. To access your data from other devices and prevent data loss, register an email and password below. All your custom foods, logs, and settings will transfer automatically!
                </p>
                <form onSubmit={handleLinkGuestAccount} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className="lbl">Email Address</label>
                    <input 
                      type="email" 
                      className="inp" 
                      value={guestEmail} 
                      onChange={e => setGuestEmail(e.target.value)} 
                      placeholder="e.g. name@domain.com"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className="lbl">Password</label>
                    <input 
                      type="password" 
                      className="inp" 
                      value={guestPassword} 
                      onChange={e => setGuestPassword(e.target.value)} 
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn" style={{ margin: 0, padding: '12px 24px', background: 'var(--theme-accent)', color: '#000', fontWeight: '800' }}>
                    {loading ? <Loader2 className="spin" size={16} /> : 'Save Account'}
                  </button>
                </form>
              </div>
            ) : (
              <>
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
                      disabled={loading}
                    />
                    <button type="submit" disabled={loading} className="btn" style={{ marginTop: '8px', background: 'var(--theme-accent)', color: '#000' }}>
                      {loading ? <Loader2 className="spin" size={16} /> : 'Update Email'}
                    </button>
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
                      disabled={loading}
                    />
                    <button type="submit" disabled={loading} className="btn" style={{ marginTop: '8px', background: 'var(--theme-error-dim)', color: 'var(--theme-error)' }}>
                      {loading ? <Loader2 className="spin" size={16} /> : 'Change Password'}
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Display Name Personalization Settings */}
            <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', fontWeight: '700', color: 'var(--theme-text)' }}><User size={18} color="var(--theme-accent)" /> Display Name</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="lbl">Custom Screen Name</label>
                <input 
                  type="text" 
                  className="inp" 
                  value={displayNameInput} 
                  onChange={e => setDisplayNameInput(e.target.value)} 
                  maxLength={20}
                  placeholder="Guest"
                />
                <button 
                  onClick={() => {
                    updateSettings({ displayName: displayNameInput });
                    setMessage({ text: 'Display name successfully updated!', type: 'success' });
                  }} 
                  className="btn" 
                  style={{ marginTop: '8px', background: 'var(--theme-accent)', color: '#000', width: '100%' }}
                >
                  Save Display Name
                </button>
              </div>
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
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: '38px', 
                      height: '38px', 
                      margin: '0 auto 12px auto', 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1.5px solid rgba(255,255,255,0.12)', 
                      boxShadow: isSelected ? `0 0 15px ${t.colors[1]}55` : 'none',
                      color: t.colors[1]
                    }}>
                      {getThemeIcon(t.id, t.colors[1], 18)}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: '900', 
                      color: isSelected ? 'var(--theme-text)' : 'var(--theme-text-dim)', 
                      marginBottom: '6px',
                      textShadow: isSelected ? '0 0 10px var(--theme-accent, #00C9FF), 0 0 20px var(--theme-accent, #00C9FF)' : 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>{t.name}</div>
                    {!isPurchased && <div style={{ fontSize: '9px', color: 'var(--theme-accent)', fontWeight: '700', marginBottom: '4px' }}>{t.price} GEMS</div>}
                    
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
                  <div style={{ display: 'flex', background: 'var(--theme-panel-dim)', padding: '4px', borderRadius: '999px', border: '1px solid var(--theme-border)' }}>
                    <button 
                      onClick={() => toggleWeightUnit('kg')}
                      style={{ padding: '6px 16px', border: 'none', borderRadius: '999px', background: settings.units.weight === 'kg' ? 'var(--theme-accent)' : 'transparent', color: settings.units.weight === 'kg' ? '#000' : 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>KG</button>
                    <button 
                      onClick={() => toggleWeightUnit('lb')}
                      style={{ padding: '6px 16px', border: 'none', borderRadius: '999px', background: settings.units.weight === 'lb' ? 'var(--theme-accent)' : 'transparent', color: settings.units.weight === 'lb' ? '#000' : 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>LB</button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)' }}>Height Unit</div>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)' }}>Metric vs Imperial</div>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--theme-panel-dim)', padding: '4px', borderRadius: '999px', border: '1px solid var(--theme-border)' }}>
                    <button 
                      onClick={() => updateSettings({ units: { ...settings.units, height: 'cm' } })}
                      style={{ padding: '6px 16px', border: 'none', borderRadius: '999px', background: settings.units.height === 'cm' ? 'var(--theme-accent)' : 'transparent', color: settings.units.height === 'cm' ? '#000' : 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>CM</button>
                    <button 
                      onClick={() => updateSettings({ units: { ...settings.units, height: 'ft' } })}
                      style={{ padding: '6px 16px', border: 'none', borderRadius: '999px', background: settings.units.height === 'ft' ? 'var(--theme-accent)' : 'transparent', color: settings.units.height === 'ft' ? '#000' : 'var(--theme-text-dim)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>FT/IN</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals & Macros Preferences */}
            <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)', fontWeight: '700', color: 'var(--theme-text)' }}><Target size={18} color="var(--theme-accent)" /> Goals & Macros</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Dumbbell size={14} color="var(--theme-accent)"/> Protein Strategy</label>
                  <select 
                    value={localCache.goals?.proteinLevelId || 'moderate'} 
                    onChange={e => updateGoals({ proteinLevelId: e.target.value })}
                    className="inp"
                    style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', border: '1px solid var(--theme-border)', borderRadius: '10px', color: '#fff', fontSize: '14px', fontFamily: 'inherit' }}
                  >
                    <option value="sedentary">Basic Maintenance (Low Protein)</option>
                    <option value="light">Standard (Moderate Protein)</option>
                    <option value="moderate">Athletic (High Protein)</option>
                    <option value="active">Very High Protein</option>
                    <option value="athlete">Elite Performance</option>
                    <option value="bodybuilder">Maximum Bodybuilding Limit</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={14} color="var(--theme-accent)"/> Dietary Style (Macro Split)</label>
                  <select 
                    value={
                      localCache.goals?.macroC === 5 ? 'keto' :
                      localCache.goals?.macroC === 25 ? 'low-carb' :
                      localCache.goals?.macroC === 55 ? 'high-carb' :
                      'balanced'
                    } 
                    onChange={e => {
                      const style = e.target.value;
                      let c = 45; let f = 25;
                      if (style === 'keto') { c = 5; f = 65; }
                      else if (style === 'low-carb') { c = 25; f = 45; }
                      else if (style === 'high-carb') { c = 55; f = 15; }
                      updateGoals({ macroC: c, macroF: f });
                    }}
                    className="inp"
                    style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', border: '1px solid var(--theme-border)', borderRadius: '10px', color: '#fff', fontSize: '14px', fontFamily: 'inherit' }}
                  >
                    <option value="balanced">Balanced (45% C / 25% F)</option>
                    <option value="low-carb">Low Carb (25% C / 45% F)</option>
                    <option value="keto">Keto (5% C / 65% F)</option>
                    <option value="high-carb">High Carb (55% C / 15% F)</option>
                  </select>
                </div>

                {localCache.goals?.goalType !== 'maintain' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Flame size={14} color="var(--theme-accent)"/> Weight Velocity</label>
                    <select 
                      value={localCache.goals?.rate || 0.5} 
                      onChange={e => updateGoals({ rate: Number(e.target.value) })}
                      className="inp"
                      style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', border: '1px solid var(--theme-border)', borderRadius: '10px', color: '#fff', fontSize: '14px', fontFamily: 'inherit' }}
                    >
                      <option value="0.5">0.5 lbs / week</option>
                      <option value="1">1.0 lbs / week</option>
                      <option value="1.5">1.5 lbs / week</option>
                      <option value="2">2.0 lbs / week</option>
                    </select>
                  </div>
                )}

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

          {/* Data Export */}
          <div className="section" style={{ background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)' }}>
              <Download size={18} /> Export My Data
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-dim)', marginBottom: 'var(--space-lg)', lineHeight: '1.5' }}>
              Download all your logs, custom foods, goals, and settings as a JSON file.
            </p>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(localCache, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `muncher-macros-export-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn"
              style={{ background: 'var(--theme-accent)', color: '#000', fontWeight: 700, marginTop: 0 }}
            >
              Download JSON
            </button>
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
      {toastMsg && <Toast message={toastMsg} type="error" onClose={() => setToastMsg('')} />}
      {deleteStep === 'confirm' && (
        <ConfirmDialog
          title="Delete Account"
          message={isGuest || !user
            ? "Are you sure? This will permanently delete your guest data on this browser."
            : "This will permanently delete your diet history, food logs, and account settings. This action is irreversible."}
          confirmLabel={isGuest || !user ? "Delete" : "Continue"}
          danger
          onCancel={() => setDeleteStep('none')}
          onConfirm={() => {
            if (isGuest || !user) { executeDelete(); }
            else { setDeleteStep('type'); }
          }}
        />
      )}
      {deleteStep === 'type' && (
        <PromptDialog
          title="Final Confirmation"
          message="Type DELETE (all caps) to permanently purge your account data."
          placeholder="DELETE"
          confirmLabel="Permanently Delete"
          onCancel={() => setDeleteStep('none')}
          onConfirm={(val) => { if (val === 'DELETE') { setDeleteStep('none'); executeDelete(); } }}
        />
      )}
    </div>,
    document.body
  );
};

export default SettingsView;

const NotificationToggle = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <div 
    onClick={() => onChange(!checked)}
    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
  >
    <div style={{ flex: 1, paddingRight: '12px' }}>
      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)' }}>{label}</div>
      <div style={{ fontSize: '11px', color: 'var(--theme-text-dim)', marginTop: '2px' }}>{desc}</div>
    </div>
    <div 
      style={{ 
        width: '42px', 
        height: '24px', 
        borderRadius: '12px', 
        background: checked ? 'var(--theme-accent)' : 'rgba(255,255,255,0.1)', 
        border: `1px solid ${checked ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: checked ? '0 0 15px var(--theme-accent-dim)' : 'none',
        flexShrink: 0
      }}
    >
      <div 
        style={{ 
          width: '18px', 
          height: '18px', 
          borderRadius: '50%', 
          background: checked ? '#000' : '#fff', 
          position: 'absolute', 
          top: '2px', 
          left: checked ? '20px' : '2px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} 
      />
    </div>
  </div>
);
