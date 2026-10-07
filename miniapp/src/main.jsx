import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import WebApp from '@twa-dev/sdk';

try {
    if (WebApp && WebApp.ready) {
        WebApp.ready();
        WebApp.expand();
    }
} catch (e) {
    console.log("Not in Telegram environment");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
