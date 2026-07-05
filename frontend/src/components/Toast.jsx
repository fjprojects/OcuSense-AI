import React, { useState, createContext, useContext } from 'react';

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

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
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
      style={{
        padding: '15px 20px',
        borderRadius: '12px',
        color: type === 'warning' ? '#744210' : '#ffffff',
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