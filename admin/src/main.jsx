import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Admin Root Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#030712', color: '#fff', fontFamily: 'sans-serif', padding: 24, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: '#f87171' }}>Admin Panel Error</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px', maxWidth: 450, wordBreak: 'break-word', background: '#111827', padding: '12px 16px', borderRadius: 12, border: '1px solid #1f2937' }}>
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)' }}
          >
            🔄 Reload Admin Panel
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
