import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './Toast';
import { enableReminderSound, playReminderSound, showReminderNotification } from '../services/notifications';

const BREAK_INTERVAL = 20 * 60;

const readFocusState = () => {
  try { return JSON.parse(localStorage.getItem('focusTrackerState')) || {}; }
  catch { return {}; }
};

const FocusTimer = ({ onStrainChange, showStrain = true }) => {
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
    <section className="glass-card">
      <div className="card-heading">
        <h2><i className="fas fa-clock" aria-hidden="true" />Focus session</h2>
        <span className={'status-pill' + (isRunning && !isPaused ? '' : ' neutral')}>{isPaused ? 'Paused' : isRunning ? 'In focus' : 'Ready to begin'}</span>
      </div>
      <div className="timer-value">{formatTime(seconds)}</div>
      <div className="tracker-stats">
        <div><span>Total focus time</span><strong>{formatTime(totalSeconds)}</strong></div>
        <div><span>Next break</span><strong>{formatBreak(nextBreak)}</strong></div>
      </div>
      <div className="focus-controls">
        <button className="btn btn-accent" onClick={handleStart} disabled={isRunning && !isPaused}>
          {isPaused ? 'Resume' : 'Start'}
        </button>
        <button className="btn btn-outline-light" onClick={handlePause} disabled={!isRunning || isPaused}>Pause</button>
        <button className="btn btn-outline-light" onClick={handleReset}>Reset</button>
      </div>
      <div className="reminder-switch">
        <input className="form-check-input" type="checkbox" id="enableBreakReminder"
          checked={reminderEnabled} onChange={event => setReminderEnabled(event.target.checked)} />
        <label htmlFor="enableBreakReminder">Enable 20-20-20 Reminder</label>
      </div>
      <p className="tracking-caption">{reminderEnabled ? 'A reminder every 20 minutes to look away for 20 seconds.' : 'Break reminders are off. Your timer will keep running.'}</p>
      {showStrain && <div className="strain-banner">
        <div><p>Strain level: <strong style={{ color: strainLevel.color }}>{strainLevel.level}</strong></p>
          <p className="small-note">{strainLevel.recommendation}</p></div>
      </div>}
    </section>
  );
};

export default FocusTimer;
