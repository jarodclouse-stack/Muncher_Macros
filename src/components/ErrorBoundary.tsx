import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080A0F',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>:(</div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '14px', color: '#888', maxWidth: '360px', lineHeight: 1.5, marginBottom: '24px' }}>
          The app hit an unexpected error. Your data is safe — try reloading.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#00C9FF',
            color: '#000',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 32px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reload App
        </button>
        {this.state.error && (
          <pre style={{
            marginTop: '24px',
            fontSize: '11px',
            color: '#555',
            maxWidth: '400px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
