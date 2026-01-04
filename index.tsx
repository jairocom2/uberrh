
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// VERSÃO V4 - Limpeza total e profunda
const APP_VERSION_TAG = "V4_ULTRA_SYNC";
const savedVersion = localStorage.getItem('meup_app_version_tag');

if (savedVersion !== APP_VERSION_TAG) {
  // Limpa tudo para garantir que não haja conflito de esquemas de dados
  const room = localStorage.getItem('meup_sync_room');
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('meup_app_version_tag', APP_VERSION_TAG);
  // Preserva a sala para facilitar o teste do usuário
  if (room) localStorage.setItem('meup_sync_room', room);
  
  // Bust de cache via URL
  setTimeout(() => {
    window.location.href = window.location.pathname + '?refresh=' + Date.now();
  }, 300);
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
