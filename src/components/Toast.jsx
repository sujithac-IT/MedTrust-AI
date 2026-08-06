import { useState, useEffect } from 'react';

const toasts = { list: [], listeners: [] };
export function showToast(message, type = 'info') {
  const id = Date.now();
  toasts.list = [...toasts.list, { id, message, type }];
  toasts.listeners.forEach(fn => fn([...toasts.list]));
  setTimeout(() => {
    toasts.list = toasts.list.filter(t => t.id !== id);
    toasts.listeners.forEach(fn => fn([...toasts.list]));
  }, 4000);
}

export function ToastContainer() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    toasts.listeners.push(setItems);
    return () => { toasts.listeners = toasts.listeners.filter(fn => fn !== setItems); };
  }, []);

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  return (
    <div className="toast" style={{ bottom: 24, right: 24, position: 'fixed', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
      {items.map(t => (
        <div key={t.id} className={`toast-item ${t.type} animate-slide`}>
          <span>{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
