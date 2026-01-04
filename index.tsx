
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// VERSÃO V3 - Mudar isso força o navegador a deletar TUDO que é velho
const APP_VERSION_TAG = "V3_FINAL_STABLE";
const savedVersion = localStorage.getItem('meup_app_version_tag');

if (savedVersion !== APP_VERSION_TAG) {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('meup_app_version_tag', APP_VERSION_TAG);
  // Força o navegador a esquecer o cache do site
  setTimeout(() => {
    window.location.href = window.location.pathname + '?v=' + Date.now();
  }, 500);
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
