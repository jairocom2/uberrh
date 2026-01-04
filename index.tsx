
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// VERSÃO V5 - A mais estável para cross-device
const APP_VERSION_TAG = "V5_PRO_SYNC_FINAL";
const savedVersion = localStorage.getItem('meup_app_version_tag');

if (savedVersion !== APP_VERSION_TAG) {
  // Limpeza profunda mantendo apenas a sala de sincronia
  const room = localStorage.getItem('meup_sync_room');
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('meup_app_version_tag', APP_VERSION_TAG);
  if (room) localStorage.setItem('meup_sync_room', room);
  
  // Reload limpo
  setTimeout(() => {
    window.location.href = window.location.pathname + '?v5=' + Date.now();
  }, 200);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
