
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Força recarregamento se a versão do app mudar (Cache Buster)
// Mudando para V2 para garantir que todos os dispositivos atualizem
const CURRENT_VERSION = "GOLD_V2_GREEN";
const savedVersion = localStorage.getItem('meup_app_version');

if (savedVersion !== CURRENT_VERSION) {
  localStorage.clear();
  localStorage.setItem('meup_app_version', CURRENT_VERSION);
  // Pequeno delay para garantir limpeza antes do reload
  setTimeout(() => window.location.reload(), 200);
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
