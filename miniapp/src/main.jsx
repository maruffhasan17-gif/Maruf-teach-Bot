import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import WebApp from '@twa-dev/sdk';

import brandLogo from './assets/trustpaylogo.png';

try {
    if (WebApp && WebApp.ready) {
        WebApp.ready();
        WebApp.expand();
    }
} catch (e) {
    console.log("Not in Telegram environment");
}

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Root Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <img src={brandLogo} style={{ width: '60px', height: '60px', objectFit: 'contain' }} alt="Trust Pay" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>সাময়িক সমস্যা দেখা দিয়েছে</h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px', maxWidth: '280px' }}>
            দয়া করে অ্যাপটি পুনরায় রিলোড করুন।
          </p>
          <button 
            onClick={() => window.location.reload(true)} 
            style={{ padding: '12px 24px', borderRadius: '12px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}
          >
            🔄 রিলোড করুন (Reload)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
