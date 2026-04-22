import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';
import legacyLogo from '../assets/logo_legacy.png';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { loginAsGuest } = useAuth();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (email === 'guest' && password === 'password') {
      loginAsGuest();
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      setError(signInError.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (googleError) setError(googleError.message);
  };

  return (
    <div className="login-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '40px', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        
        {/* Legacy Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '110px', height: '110px', margin: '0 auto 16px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.1)' }}>
            <img src={legacyLogo} alt="Macro Munchers" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', background: 'linear-gradient(90deg, #fff 0%, #a0a0b0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Macro Munchers</h1>
          <p style={{ color: '#8b8b9b', fontSize: '13px', margin: 0 }}>Sign in to continue</p>
        </div>
        
        {error && <div style={{ background: 'rgba(255, 50, 50, 0.1)', color: '#ff6b6b', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', border: '1px solid rgba(255, 50, 50, 0.2)', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#8b8b9b', fontWeight: '600', marginLeft: '4px' }}>Email Address</label>
            <input 
              type="text" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="login-input"
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', transition: 'all 0.2s', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#8b8b9b', fontWeight: '600', marginLeft: '4px' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="login-input"
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', transition: 'all 0.2s', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', cursor: 'pointer', userSelect: 'none' }} onClick={() => setRememberMe(!rememberMe)}>
            <div style={{ width: '18px', height: '18px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: rememberMe ? 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)' : 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {rememberMe && <span style={{ color: '#000', fontSize: '12px', fontWeight: '900' }}>✓</span>}
            </div>
            <span style={{ fontSize: '13px', color: '#c0c0d0' }}>Stay logged in</span>
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: '16px', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)', color: '#000', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'transform 0.2s', opacity: loading ? 0.7 : 1, fontSize: '15px' }}>
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ fontSize: '11px', color: '#5b5b6b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        {/* Google Login Button */}
        <button 
          onClick={handleGoogleLogin}
          style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: 'all 0.2s', fontSize: '14px' }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Sign in with Google
        </button>
        
      </div>
      <style>{`
        body.theme-light-surface .login-input,
        body .login-input { 
          color: white !important; 
        }
        body.theme-light-surface .login-input::placeholder,
        body .login-input::placeholder { 
          color: rgba(255,255,255,0.4) !important; 
        }
      `}</style>
    </div>
  );
};

