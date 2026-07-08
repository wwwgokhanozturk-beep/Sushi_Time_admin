import { useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import React from 'react';
import PrintReceipt from '@/components/print/PrintReceipt';

/**
 * Рендерит чек в #receipt-root (body > #receipt-root, вне #root приложения).
 * createRoot вызывается только ОДИН раз — последующие вызовы используют root.render().
 * После закрытия диалога печати чек очищается из DOM через событие afterprint.
 */

let _root = null;

function getRoot() {
  const container = document.getElementById('receipt-root');
  if (!container) return null;
  if (!_root) {
    _root = ReactDOM.createRoot(container);
  }
  return _root;
}

export function usePrintReceipt() {
  return useCallback((order, contactNumber) => {
    const root = getRoot();
    if (!root) return;

    root.render(React.createElement(PrintReceipt, { order, contactNumber }));

    // Ждём рендер React, затем открываем диалог печати
    setTimeout(() => {
      const cleanup = () => {
        root.render(null);
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    }, 150);
  }, []);
}
