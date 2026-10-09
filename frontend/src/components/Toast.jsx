import React, { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';

export const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Set());

  const showToast = useCallback((message, type = 'info') => {
    const id = ++nextId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
    timers.current.add(timer);
  }, []);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-label="Notifications">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ message, type }) => {
  const colors = {
    success: '#4ad7a8',
    error: '#fc8181',
    warning: '#ecc94b',
    info: '#4299e1'
  };

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      style={{
        padding: '15px 20px',
        borderRadius: '12px',
        color: '#03110c',
        fontWeight: '500',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.3s ease',
        background: colors[type] || colors.info,
        pointerEvents: 'auto',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {message}
    </div>
  );
};

export default ToastProvider;
