import React, { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';

const FocusTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [nextBreak, setNextBreak] = useState(20 * 60);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [strainLevel, setStrainLevel] = useState({ 
    level: 'ðŸŸ¢ Low', 
    color: '#48bb78', 
    recommendation: 'Keep up the good work!' 
  });
  const timerRef = useRef(null);
  const { showToast } = useToast();
  const BREAK_INTERVAL = 20 * 60;

  useEffect(() => {
    const saved = localStorage.getItem('focusTrackerState');
    if (saved) {
      const state = JSON.parse(saved);
      setSeconds(state.seconds || 0);
      setTotalSeconds(state.totalSeconds || 0);
      setNextBreak(state.nextBreakSeconds || BREAK_INTERVAL);
      setIsRunning(state.isRunning || false);
      setIsPaused(state.isPaused || false);
      setReminderEnabled(state.reminderEnabled !== undefined ? state.reminderEnabled : true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('focusTrackerState', JSON.stringify({
      seconds,
      totalSeconds,
      nextBreakSeconds: nextBreak,
      isRunning,
      isPaused,
      reminderEnabled
    }));
  }, [seconds, totalSeconds, nextBreak, isRunning, isPaused, reminderEnabled]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
        setTotalSeconds(prev => prev + 1);
        setNextBreak(prev => {
          const newVal = prev - 1;
          if (reminderEnabled && newVal <= 0) {
            showBreakAlert();
            return BREAK_INTERVAL;
          }
          return newVal;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused, reminderEnabled]);

  useEffect(() => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 20) {
      setStrainLevel({ level: 'ðŸŸ¢ Low', color: '#48bb78', recommendation: 'Keep up the good work!' });
    } else if (minutes < 40) {
      setStrainLevel({ level: 'ðŸŸ¡ Medium', color: '#ecc94b', recommendation: 'Take a quick break soon' });
    } else {
      setStrainLevel({ level: 'ðŸ”´ High', color: '#fc8181', recommendation: 'Take a break now!' });
    }
  }, [seconds]);

  const showBreakAlert = () => {
    showToast(' 20-20-20 Break! Look 20 feet away for 20 seconds.', 'warning');
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(' 20-20-20 Break!', {
        body: 'Look 20 feet away for 20 seconds.',
        icon: '/icon.svg'
      });
    }
    playSound();
  };

  const playSound = () => {
    try {
      const audio = new Audio('/static/alert.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatBreak = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    showToast(' Focus session started!', 'success');
  };

  const handlePause = () => {
    setIsPaused(true);
    showToast(' Focus session paused', 'info');
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setSeconds(0);
    setNextBreak(BREAK_INTERVAL);
    showToast(' Focus session reset', 'info');
  };

  return (
    <div className="glass-card p-4 h-100">
      <h5 className="mb-3">
        <i className="fas fa-clock text-accent me-2"></i>
        Focus Session Tracker
      </h5>

      <div className="display-5 mb-2" style={{ fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
        {formatTime(seconds)}
      </div>

      <p className="small-note mb-3">
        Total focus time today: <strong>{formatTime(totalSeconds)}</strong>
      </p>

      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="enableBreakReminder"
          checked={reminderEnabled}
          onChange={(e) => setReminderEnabled(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="enableBreakReminder">
          Enable 20-20-20 Reminder
        </label>
      </div>

      <h6 className="mb-2">Next Break</h6>
      <div className="display-6 mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
        {formatBreak(nextBreak)}
      </div>

      <p className="small-note mb-3" style={{ color: reminderEnabled ? '#4ad7a8' : '#fc8181' }}>
        {reminderEnabled ? ' Reminder Enabled' : 'âŒ Reminder Disabled'}
      </p>

      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-outline-light btn-sm" onClick={handleStart} disabled={isRunning}>
          Start
        </button>
        <button className="btn btn-warning btn-sm" onClick={handlePause} disabled={!isRunning || isPaused}>
          Pause
        </button>
        <button className="btn btn-outline-light btn-sm" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="mt-3 pt-3 border-top border-secondary">
        <div className="row g-2">
          <div className="col-6">
            <span className="small-note">Strain Level:</span>
            <div style={{ color: strainLevel.color, fontWeight: 'bold' }}>{strainLevel.level}</div>
          </div>
          <div className="col-6">
            <span className="small-note">Recommendation:</span>
            <div style={{ color: strainLevel.color }}>{strainLevel.recommendation}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;