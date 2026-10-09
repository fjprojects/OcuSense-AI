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
  const getStreakIcon = () => streak >= 30 ? 'fa-trophy' : streak >= 14 ? 'fa-fire' : streak >= 7 ? 'fa-hand-fist' : streak >= 3 ? 'fa-star' : 'fa-droplet';
  const percentage = Math.min(todayGlasses / target * 100, 100);

  return (
    <section className="glass-card">
      <div className="card-heading">
        <h2><i className="fas fa-droplet" aria-hidden="true" />Water tracker</h2>
        <span className="status-pill"><i className={'fas ' + getStreakIcon()} aria-hidden="true" />{streak} {streak === 1 ? 'day' : 'days'}</span>
      </div>
      <div className="water-tally"><strong>{todayGlasses}</strong> / {target} glasses today</div>
      <div className="water-progress-label"><span>Daily progress</span><span>{todayGlasses >= target ? 'Goal Met!' : (target - todayGlasses) + ' remaining'}</span></div>
      <div className="progress">
        <div className="progress-bar" role="progressbar" aria-label="Daily water goal" aria-valuemin={0} aria-valuemax={target}
          aria-valuenow={todayGlasses} style={{ width: percentage + '%' }} />
      </div>
      <div className="water-controls">
        <button className="btn btn-accent" onClick={addGlass}>+ Add Glass</button>
        <button className="btn btn-outline-light" onClick={reset}>Reset Today</button>
      </div>
      <p className="tracking-caption" style={{ color: todayGlasses >= target ? '#65e2b7' : undefined }}>
        {todayGlasses >= target ? 'Goal reached! ' + streak + ' day streak!' : todayGlasses + (todayGlasses === 1 ? ' glass' : ' glasses') + ' - Keep going!'}
      </p>
      <details className="tracker-history">
        <summary>Your last 7 days</summary>
        <div className="week-grid">
          {Array.from({ length: 7 }, (_, index) => {
            const day = new Date();
            day.setDate(day.getDate() - (6 - index));
            const key = day.toDateString();
            const count = history[key] || 0;
            const isToday = key === new Date().toDateString();
            return <div key={key} className={'week-day' + (isToday ? ' today' : '')}>
              <span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span><strong>{count || '–'}</strong>
            </div>;
          })}
        </div>
        <button className="btn btn-outline-danger" onClick={resetAll}>Reset All</button>
      </details>
    </section>
  );
};

export default HydrationTracker;
