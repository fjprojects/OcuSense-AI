import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { playReminderSound, showReminderNotification } from '../services/notifications';
import { useToast } from './Toast';

const MedicineContext = createContext(null);

export const useMedicines = () => {
  const context = useContext(MedicineContext);
  if (!context) throw new Error('useMedicines requires MedicineProvider');
  return context;
};

export const MedicineProvider = ({ children }) => {
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const sequence = useRef(0);
  const pendingAlerts = useRef(new Set());
  const retryAfter = useRef(new Map());
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    try {
      const result = await api.getMedicines();
      if (mounted.current && current === sequence.current) {
        setMedicines(result.medicines);
        setError('');
      }
    } catch (problem) {
      if (mounted.current && current === sequence.current) setError(problem.message);
    } finally {
      if (mounted.current && current === sequence.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const poll = setInterval(refresh, 30000);
    const checkOnReturn = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', checkOnReturn);
    return () => {
      mounted.current = false;
      clearInterval(poll);
      document.removeEventListener('visibilitychange', checkOnReturn);
    };
  }, [refresh]);

  const replace = useCallback(medicine => {
    setMedicines(previous => previous.map(item => item.id === medicine.id ? medicine : item));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      medicines.forEach(medicine => {
        const due = Date.parse(medicine.next_reminder_time);
        const key = medicine.id + ':' + medicine.next_reminder_time;
        if (!medicine.active || medicine.paused || medicine.status !== 'Pending' ||
            !Number.isFinite(due) || due > now ||
            (medicine.last_alerted_at && Date.parse(medicine.last_alerted_at) >= due) ||
            pendingAlerts.current.has(key) || (retryAfter.current.get(key) || 0) > now) return;
        pendingAlerts.current.add(key);
        api.claimMedicineAlert(medicine).then(result => {
          if (!mounted.current) return;
          replace(result.medicine);
          if (result.notify) {
            const message = medicine.medicine_name + (medicine.dosage ? ': ' + medicine.dosage : '');
            showToast('Medicine reminder — ' + message, 'warning');
            playReminderSound();
            showReminderNotification('Medicine reminder', message);
          }
        }).catch(() => {
          retryAfter.current.set(key, Date.now() + 30000);
        }).finally(() => pendingAlerts.current.delete(key));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [medicines, replace, showToast]);

  const add = async data => {
    const medicine = await api.saveMedicine(data);
    sequence.current++;
    setMedicines(previous => [medicine, ...previous]);
    setError('');
  };
  const remove = async id => {
    await api.deleteMedicine(id);
    sequence.current++;
    setMedicines(previous => previous.filter(medicine => medicine.id !== id));
  };
  const toggle = async medicine => {
    const updated = await api.updateMedicine(medicine.id, !medicine.paused);
    sequence.current++;
    replace(updated);
  };
  const taken = async id => {
    const updated = await api.markMedicineTaken(id);
    sequence.current++;
    if (updated.active) replace(updated);
    else setMedicines(previous => previous.filter(medicine => medicine.id !== id));
  };

  return (
    <MedicineContext.Provider value={{ medicines, isLoading, error, refresh, add, remove, toggle, taken }}>
      {children}
    </MedicineContext.Provider>
  );
};
