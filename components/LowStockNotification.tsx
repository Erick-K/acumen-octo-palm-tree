import React, { useEffect, useRef, useState } from 'react';
import type { Product } from '../types';
import { WarningIcon } from './icons';

function readLowStockThreshold() {
  try {
    const saved = localStorage.getItem('lowStockThreshold');
    return saved ? Math.max(0, parseInt(saved, 10)) : 50;
  } catch {
    return 50;
  }
}

interface LowStockNotificationProps {
  products: Product[];
  enabled: boolean;
}

export const LowStockNotification: React.FC<LowStockNotificationProps> = ({ products, enabled }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const lastAlertKeyRef = useRef('');
  const [threshold, setThreshold] = useState(readLowStockThreshold);

  useEffect(() => {
    const refreshThreshold = () => setThreshold(readLowStockThreshold());
    window.addEventListener('storage', refreshThreshold);
    window.addEventListener('acumen:lowStockThresholdChanged', refreshThreshold);
    return () => {
      window.removeEventListener('storage', refreshThreshold);
      window.removeEventListener('acumen:lowStockThresholdChanged', refreshThreshold);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const lowStockProducts = products.filter(product => product.stock <= threshold);
    if (lowStockProducts.length === 0) {
      setVisible(false);
      lastAlertKeyRef.current = '';
      return;
    }

    const alertKey = `${threshold}:${lowStockProducts.map(product => `${product.id}:${product.stock}`).sort().join('|')}`;
    if (alertKey === lastAlertKeyRef.current) return;

    lastAlertKeyRef.current = alertKey;
    const count = lowStockProducts.length;
    const nextMessage = `${count} product${count === 1 ? '' : 's'} at or below ${threshold} units. Check Products for details.`;
    setMessage(nextMessage);
    setVisible(true);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Low Stock Alert', { body: nextMessage });
    }

    const timer = window.setTimeout(() => setVisible(false), 10000);
    return () => window.clearTimeout(timer);
  }, [products, threshold, enabled]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] w-full max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="mx-4 flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 shadow-lg dark:border-yellow-700 dark:bg-yellow-900/90">
        <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Low Stock Alert</p>
          <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-1 text-yellow-800 hover:bg-yellow-100 dark:text-yellow-100 dark:hover:bg-yellow-800"
          aria-label="Dismiss low stock alert"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
