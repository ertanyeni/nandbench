import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { useAppStore } from './model/store.js';
import './styles/animations.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.env.DEV) {
  (window as unknown as { __store: typeof useAppStore }).__store = useAppStore;
}
