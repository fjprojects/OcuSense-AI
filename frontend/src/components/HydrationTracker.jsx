import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

const HydrationTracker = () => {
  const [glasses, setGlasses] = useState(0);
  const [todayGlasses, setTodayGlasses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastDrinkDate, setLastDrinkDate] = useState(null);
  const [history, setHistory] = useState({});
  const target = 8;
  const { showToast } = useToast();

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hydrationState');
    if (saved) {
      const state = JSON.parse(saved);
      
      // Check if last drink was today
      const today = new Date().toDateString();
      const lastDate = state.lastDrinkDate ? new Date(state.lastDrinkDate).toDateString() : null;
      
      if (lastDate === today) {
        // Today's glasses
        const todayHistory = state.history && state.history[today] ? state.history[today] : 0;
        setTodayGlasses(todayHistory);
        setGlasses(todayHistory);
      } else {
        // Reset for new day
        setTodayGlasses(0);
        setGlasses(0);
        
        // Check streak
        if (lastDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();
          
          if (state.history && state.history[yesterdayStr] && state.history[yesterdayStr] >= target) {
            // Streak continues
            setStreak(state.streak || 0);
          } else {
            // Streak broken
            setStreak(0);
          }
        }
      }
      
      setLastDrinkDate(state.lastDrinkDate || null);
      setHistory(state.history || {});
      
      // Update glasses to show today's count
      if (state.history && state.history[today]) {
        setGlasses(state.history[today]);
        setTodayGlasses(state.history[today]);
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    const today = new Date().toDateString();
    const newHistory = { ...history };
    newHistory[today] = todayGlasses;
    
    const state = {
      glasses: todayGlasses,
      history: newHistory,
      streak: streak,
      lastDrinkDate: lastDrinkDate
    };
    localStorage.setItem('hydrationState', JSON.stringify(state));
  }, [todayGlasses, streak, lastDrinkDate, history]);

  const addGlass = () => {
    if (todayGlasses >= target) {
      showToast('🎉 Goal reached! You\'re fully hydrated today!', 'success');
      return;
    }

    const newCount = todayGlasses + 1;
    setTodayGlasses(newCount);
    setGlasses(newCount);
    setLastDrinkDate(new Date().toISOString());
    
    const today = new Date().toDateString();
    const newHistory = { ...history };
    newHistory[today] = newCount;
    setHistory(newHistory);

    if (newCount === target) {
      // Goal reached! Update streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      showToast(`🎉 Amazing! You reached your hydration goal! 🔥 ${newStreak} day streak!`, 'success');
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('💧 Goal Reached!', {
          body: `You drank 8 glasses of water today! 🔥 ${newStreak} day streak!`,
          icon: '/icon.svg'
        });
      }
    } else {
      showToast(`💧 ${newCount}/${target} glasses - Keep going!`, 'info');
    }
  };

  const reset = () => {
    const today = new Date().toDateString();
    setTodayGlasses(0);
    setGlasses(0);
    
    const newHistory = { ...history };
    newHistory[today] = 0;
    setHistory(newHistory);
    
    // Don't reset streak on manual reset
    showToast('🔄 Today\'s hydration reset', 'info');
  };

  const resetAll = () => {
    if (window.confirm('Reset all hydration data including streak?')) {
      setGlasses(0);
      setTodayGlasses(0);
      setStreak(0);
      setHistory({});
      setLastDrinkDate(null);
      localStorage.removeItem('hydrationState');
      showToast('🔄 All hydration data reset', 'info');
    }
  };

  const getProgressColor = () => {
    const percentage = (todayGlasses / target) * 100;
    if (percentage >= 75) return 'linear-gradient(90deg, #4ad7a8, #38a169)';
    if (percentage >= 50) return 'linear-gradient(90deg, #ecc94b, #d69e2e)';
    return 'linear-gradient(90deg, #fc8181, #e53e3e)';
  };

  const getStreakEmoji = () => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '💪';
    if (streak >= 3) return '🌟';
    return '💧';
  };

  const percentage = Math.min((todayGlasses / target) * 100, 100);

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
          <span style={{ fontSize: '1.2rem' }}>{getStreakEmoji()}</span>
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
          {todayGlasses >= target ? '✅ Goal Met!' : `${target - todayGlasses} remaining`}
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
          ? `🎉 Goal reached! 🔥 ${streak} day streak!` 
          : `💧 ${todayGlasses} glasses - Keep going!`}
      </div>

      {/* Weekly History */}
      <div className="mt-3 pt-3 border-top border-secondary">
        <p className="small-note mb-2">This Week</p>
        <div className="d-flex justify-content-between">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
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
                  {day}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: count >= target ? '#4ad7a8' : count > 0 ? '#ecc94b' : '#6c757d'
                }}>
                  {count > 0 ? count : '•'}
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