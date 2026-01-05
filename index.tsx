
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const APP_VERSION_TAG = "V11_RESILIENT_FINAL";
const savedVersion = localStorage.getItem('meup_app_version_tag');

if (savedVersion !== APP_VERSION_TAG) {
  const room = localStorage.getItem('meup_sync_room');
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('meup_app_version_tag', APP_VERSION_TAG);
  if (room) localStorage.setItem('meup_sync_room', room);
  
  setTimeout(() => {
    window.location.href = window.location.pathname + '?v11=' + Date.now();
  }, 200);
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
