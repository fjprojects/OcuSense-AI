import React, { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';
import { showReminderNotification } from '../services/notifications';

const TARGET = 8;
const emptyState = () => ({ todayGlasses: 0, streak: 0, lastDrinkDate: null, history: {} });
const readState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('hydrationState'));
    if (!saved || typeof saved !== 'object') return emptyState();
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const history = saved.history && typeof saved.history === 'object' ? saved.history : {};
    const lastDate = saved.lastDrinkDate && new Date(saved.lastDrinkDate).toDateString();
    return {
      todayGlasses: Number(history[today]) || 0,
      history,
      streak: lastDate === today || Number(history[yesterday.toDateString()]) >= TARGET ? Number(saved.streak) || 0 : 0,
      lastDrinkDate: saved.lastDrinkDate || null
    };
  } catch { return emptyState(); }
};

const HydrationTracker = () => {
  const [data, setData] = useState(readState);
  const { todayGlasses, streak, history, lastDrinkDate } = data;
  const date = useRef(new Date().toDateString());
  const target = TARGET;
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      const today = new Date().toDateString();
      if (date.current === today) return;
      date.current = today;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setData(previous => ({
        ...previous, todayGlasses: 0, lastDrinkDate: null,
        streak: (previous.history[yesterday.toDateString()] || 0) >= TARGET ? previous.streak : 0
      }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('hydrationState', JSON.stringify({
        glasses: todayGlasses, history: { ...history, [new Date().toDateString()]: todayGlasses },
        streak, lastDrinkDate
      }));
    } catch { /* Counting still works when browser storage is unavailable. */ }
  }, [todayGlasses, streak, lastDrinkDate, history]);

  const addGlass = () => {
    if (todayGlasses >= target) { showToast('Daily goal reached', 'success'); return; }
    const count = todayGlasses + 1;
    const newStreak = count === target ? streak + 1 : streak;
    setData({
      todayGlasses: count, streak: newStreak, lastDrinkDate: new Date().toISOString(),
      history: { ...history, [new Date().toDateString()]: count }
    });
    if (count === target) {
      showToast('Hydration goal reached! ' + newStreak + ' day streak!', 'success');
      showReminderNotification('Goal Reached!', 'You reached your daily water tracking goal.');
    } else showToast(count + '/' + target + ' glasses — Keep going!', 'info');
  };
  const reset = () => {
    setData(previous => ({ ...previous, todayGlasses: 0, lastDrinkDate: null,
      streak: Math.max(0, previous.streak - (previous.todayGlasses >= target ? 1 : 0)),
      history: { ...previous.history, [new Date().toDateString()]: 0 } }));
    showToast("Today's hydration reset", 'info');
  };
  const resetAll = () => {
    if (window.confirm('Reset all hydration data including streak?')) {
      setData(emptyState());
      showToast('All hydration data reset', 'info');
    }
  };
  const getProgressColor = () => todayGlasses / target >= 0.75 ? 'linear-gradient(90deg, #4ad7a8, #38a169)' :
    todayGlasses / target >= 0.5 ? 'linear-gradient(90deg, #ecc94b, #d69e2e)' : 'linear-gradient(90deg, #fc8181, #e53e3e)';
  const getStreakIcon = () => streak >= 30 ? 'fa-trophy' : streak >= 14 ? 'fa-fire' : streak >= 7 ? 'fa-hand-fist' : streak >= 3 ? 'fa-star' : 'fa-droplet';
  const percentage = Math.min(todayGlasses / target * 100, 100);

  return (
    <div className="glass-card p-4 h-100">
      <h5 className="mb-3">
        <i className="fas fa-droplet text-accent me-2"></i>
        Hydration Reminder
      </h5>

      <p className="small-note mb-3">
        Aim for 8 glasses of water while working at your screen.
      </p>

      {/* Streak Display */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-2" style={{ 
        background: 'rgba(74,215,168,0.1)', 
        borderRadius: '8px',
        border: '1px solid rgba(74,215,168,0.2)'
      }}>
        <span>
          <i className={'fas ' + getStreakIcon()} style={{ fontSize: '1.2rem' }} aria-hidden="true" />
          <span className="ms-2">Daily Streak</span>
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ad7a8' }}>
          {streak} {streak === 1 ? 'day' : 'days'}
        </span>
      </div>

      <div className="progress mb-3" style={{ height: '1.5rem' }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{
            width: `${percentage}%`,
            background: getProgressColor()
          }}
        >
          {Math.round(percentage)}%
        </div>
      </div>

      <div className="d-flex justify-content-between mb-2">
        <p className="mb-0">
          <strong>{todayGlasses}</strong> / {target} glasses today
        </p>
        <p className="small-note mb-0">
          {todayGlasses >= target ? 'Goal Met!' : `${target - todayGlasses} remaining`}
        </p>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button className="btn btn-accent btn-sm" onClick={addGlass}>
          + Add Glass
        </button>
        <button className="btn btn-outline-light btn-sm" onClick={reset}>
          Reset Today
        </button>
        <button className="btn btn-outline-danger btn-sm" onClick={resetAll}>
          Reset All
        </button>
      </div>

      <div
        className="status-pill"
        style={{
          background: todayGlasses >= target ? 'rgba(74,215,168,0.2)' : 'rgba(255,255,255,0.08)',
          color: todayGlasses >= target ? '#4ad7a8' : 'rgba(230,248,255,0.72)'
        }}
      >
        {todayGlasses >= target 
          ? `Goal reached! ${streak} day streak!` 
          : `${todayGlasses} glasses - Keep going!`}
      </div>

      {/* Weekly History */}
      <div className="mt-3 pt-3 border-top border-secondary">
        <p className="small-note mb-2">This Week</p>
        <div className="d-flex justify-content-between">
          {Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dateStr = date.toDateString();
            const count = history[dateStr] || 0;
            const isToday = dateStr === new Date().toDateString();
            
            return (
              <div key={index} className="text-center" style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '10px', 
                  color: isToday ? '#4ad7a8' : 'rgba(255,255,255,0.5)',
                  fontWeight: isToday ? 'bold' : 'normal'
                }}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: count >= target ? '#4ad7a8' : count > 0 ? '#ecc94b' : '#6c757d'
                }}>
                  {count > 0 ? count : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HydrationTracker;
