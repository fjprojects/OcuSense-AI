import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './Toast';
import { enableReminderSound, playReminderSound, showReminderNotification } from '../services/notifications';

const BREAK_INTERVAL = 20 * 60;

const readFocusState = () => {
  try { return JSON.parse(localStorage.getItem('focusTrackerState')) || {}; }
  catch { return {}; }
};

const FocusTimer = ({ onStrainChange }) => {
  const [saved] = useState(readFocusState);
  const [seconds, setSeconds] = useState(saved.seconds || 0);
  const [isRunning, setIsRunning] = useState(saved.isRunning || false);
  const [isPaused, setIsPaused] = useState(saved.isPaused || false);
  const [totalSeconds, setTotalSeconds] = useState(saved.totalSeconds || 0);
  const [nextBreak, setNextBreak] = useState(saved.nextBreakSeconds || BREAK_INTERVAL);
  const [reminderEnabled, setReminderEnabled] = useState(saved.reminderEnabled !== false);
  const [strainLevel, setStrainLevel] = useState({ 
    level: 'Low',
    color: '#48bb78', 
    recommendation: 'Keep up the good work!' 
  });
  const timerRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    try { localStorage.setItem('focusTrackerState', JSON.stringify({
      seconds,
      totalSeconds,
      nextBreakSeconds: nextBreak,
      isRunning,
      isPaused,
      reminderEnabled
    })); } catch { /* The timer still works when browser storage is unavailable. */ }
  }, [seconds, totalSeconds, nextBreak, isRunning, isPaused, reminderEnabled]);

  const showBreakAlert = useCallback(() => {
    showToast('20-20-20 Break! Look 20 feet away for 20 seconds.', 'warning');
    showReminderNotification('20-20-20 Break!', 'Look 20 feet away for 20 seconds.');
    playReminderSound();
  }, [showToast]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
        setTotalSeconds(prev => prev + 1);
        setNextBreak(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (isRunning && !isPaused && nextBreak <= 0) {
      setNextBreak(BREAK_INTERVAL);
      if (reminderEnabled) showBreakAlert();
    }
  }, [isRunning, isPaused, nextBreak, reminderEnabled, showBreakAlert]);

  useEffect(() => {
    const minutes = Math.floor(seconds / 60);
    const next = minutes < 20 ? { level: 'Low', color: '#48bb78', recommendation: 'Keep up the good work!' } :
      minutes < 40 ? { level: 'Medium', color: '#ecc94b', recommendation: 'Take a quick break soon' } :
      { level: 'High', color: '#fc8181', recommendation: 'Take a break now!' };
    setStrainLevel(next);
    if (onStrainChange) onStrainChange(next);
  }, [seconds, onStrainChange]);


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
    enableReminderSound().catch(() => {});
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
        {reminderEnabled ? ' Reminder Enabled' : ' Reminder Disabled'}
      </p>

      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-outline-light btn-sm" onClick={handleStart} disabled={isRunning && !isPaused}>
          {isPaused ? 'Resume' : 'Start'}
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
