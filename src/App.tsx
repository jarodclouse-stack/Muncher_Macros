import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DiaryProvider } from './context/DiaryContext';
import { LoginScreen } from './pages/LoginScreen';
import { MainDashboard } from './pages/MainDashboard';
import { ThemeProvider } from './context/ThemeProvider';
import { BackgroundGlow } from './components/BackgroundGlow';
import './index.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--theme-bg, #080A0F)', color: 'var(--theme-text, white)' }}>
        <BackgroundGlow />
        <div style={{ animation: 'spin 1.5s linear infinite', borderTop: '2px solid var(--theme-accent, #00C9FF)', borderRight: '2px solid transparent', borderRadius: '50%', width: '40px', height: '40px' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <BackgroundGlow />
      {user ? <MainDashboard /> : <LoginScreen />}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DiaryProvider>
          <AppContent />
        </DiaryProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
