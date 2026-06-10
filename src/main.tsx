import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { seedDatabase } from './lib/db';
import './styles.css';

const clearDevServiceWorker = async () => {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  if ('caches' in window) {
    await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  }
};

seedDatabase().finally(() => {
  clearDevServiceWorker().finally(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
});

registerSW({ immediate: true });
