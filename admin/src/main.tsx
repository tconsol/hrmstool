import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { shouldBustCache, bustCache } from './utils/cacheManager';

// Check for new deployment and bust cache if needed
(async () => {
  if (shouldBustCache()) {
    console.log('📦 New deployment detected - busting cache');
    await bustCache();
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA support (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('✓ Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.error('✗ Service Worker registration failed:', err);
      });
  });
}
