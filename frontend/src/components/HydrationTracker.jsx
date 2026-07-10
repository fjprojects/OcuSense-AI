import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

const HydrationTracker = () => {
  const [todayGlasses, setTodayGlasses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastDrinkDate, setLastDrinkDate] = useState(null);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [history, setHistory] = useState({});
  const [today, setToday] = useState(new Date().toDateString());
  const target = 8;
  const { showToast } = useToast();

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hydrationState');
    if (saved) {
      const state = JSON.parse(saved);
      
      const currentDate = new Date().toDateString();
      
      setHistory(state.history || {});
      setLastDrinkDate(state.lastDrinkDate || null);
      setLastCompletedDate(state.lastCompletedDate || null);
      
      // Always load today's count from history
      const todayCount = state.history && state.history[currentDate] ? state.history[currentDate] : 0;
      setTodayGlasses(todayCount);
      
      // Calculate streak based on lastCompletedDate
      if (state.lastCompletedDate) {
        const lastCompleted = new Date(state.lastCompletedDate).toDateString();
        
        if (lastCompleted === currentDate) {
          // Completed today
          setStreak(state.streak || 0);
        } else {
          // Check if yesterday was completed
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();
          
          if (lastCompleted === yesterdayStr) {
            // Yesterday completed, keep streak
            setStreak(state.streak || 0);
          } else {
            // Streak broken
            setStreak(0);
          }
        }
      } else {
        setStreak(0);
      }
    }
  }, []);

  // Update today's date and check for day changes
  useEffect(() => {
    const updateDate = () => {
      const newToday = new Date().toDateString();
      
      if (newToday !== today) {
        console.log("📅 Date changed:", today, "→", newToday);
        
        // Check if yesterday was completed
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        setToday(newToday);
        
        // Reset today's glasses
        const todayCount = history[newToday] || 0;
        setTodayGlasses(todayCount);
        
        // Update streak
        if (lastCompletedDate) {
          const lastCompleted = new Date(lastCompletedDate).toDateString();
          
          if (lastCompleted === yesterdayStr || lastCompleted === newToday) {
            // Streak continues
            console.log("✅ Streak continues:", streak);
          } else {
            // Streak broken
            console.log("❌ Streak reset");
            setStreak(0);
          }
        }
      }
    };
    
    // Update immediately
    updateDate();
    
    // Then check every second
    const timer = setInterval(updateDate, 1000);
    
    return () => clearInterval(timer);
  }, [today, history, lastCompletedDate, streak]);

  // Save state to localStorage
  useEffect(() => {
    if (!today) return;
    
    const newHistory = { ...history };
    newHistory[today] = todayGlasses;
    
    const state = {
      glasses: todayGlasses,
      history: newHistory,
      streak: streak,
      lastDrinkDate: lastDrinkDate,
      lastCompletedDate: lastCompletedDate
    };
    localStorage.setItem('hydrationState', JSON.stringify(state));
  }, [todayGlasses, streak, lastDrinkDate, lastCompletedDate, today]);

  const addGlass = () => {
    if (todayGlasses >= target) {
      showToast('🎉 Goal reached! You\'re fully hydrated today!', 'success');
      return;
    }

    const newCount = todayGlasses + 1;
    const now = new Date().toISOString();
    setTodayGlasses(newCount);
    setLastDrinkDate(now);
    
    const newHistory = { ...history };
    newHistory[today] = newCount;
    setHistory(newHistory);

    if (newCount === target) {
      const newStreak = streak + 1;
      const todayDate = new Date().toDateString();
      
      setStreak(newStreak);
      setLastCompletedDate(todayDate);
      
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
    setTodayGlasses(0);
    
    const newHistory = { ...history };
    newHistory[today] = 0;
    setHistory(newHistory);
    
    showToast('🔄 Today\'s hydration reset', 'info');
  };

  const resetAll = () => {
    if (window.confirm('Reset all hydration data including streak?')) {
      setTodayGlasses(0);
      setStreak(0);
      setHistory({});
      setLastDrinkDate(null);
      setLastCompletedDate(null);
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

  const formatToday = () => {
    const date = new Date(today);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Generate week data based on today state
  const getWeekData = () => {
    const todayDate = new Date(today);
    const weekData = [];
    
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(todayDate);
    startOfWeek.setDate(todayDate.getDate() - todayDate.getDay());
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toDateString();
      const count = history[dateStr] || 0;
      const isToday = dateStr === today;
      
      weekData.push({
        day: dayNames[i],
        dateStr,
        count,
        isToday
      });
    }
    
    return weekData;
  };

  const percentage = Math.min((todayGlasses / target) * 100, 100);
  const weekData = getWeekData();

  return (
    <div className="glass-card p-4 h-100">
      <h5 className="mb-3">
        <i className="fas fa-droplet text-accent me-2"></i>
        Hydration Reminder
      </h5>

      {/* Today's Date Display */}
      <div className="mb-3 p-2" style={{ 
        background: 'rgba(74,215,168,0.1)', 
        borderRadius: '8px',
        border: '1px solid rgba(74,215,168,0.2)'
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <span className="small-note">📅 Today</span>
          <span style={{ color: '#4ad7a8', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {formatToday()}
          </span>
        </div>
      </div>

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
        <button className="btn btn-outline-light btn-sm" onClick={addGlass}>
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

      {/* Weekly History - Now uses today state */}
      <div className="mt-3 pt-3 border-top border-secondary">
        <p className="small-note mb-2">
          This Week ({new Date(weekData[0].dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(weekData[6].dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
        </p>
        <div className="d-flex justify-content-between">
          {weekData.map((day, index) => (
            <div key={index} className="text-center" style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '10px', 
                color: day.isToday ? '#4ad7a8' : 'rgba(255,255,255,0.5)',
                fontWeight: day.isToday ? 'bold' : 'normal'
              }}>
                {day.day}
              </div>
              <div style={{ 
                fontSize: '14px',
                fontWeight: 'bold',
                color: day.count >= target ? '#4ad7a8' : day.count > 0 ? '#ecc94b' : '#6c757d'
              }}>
                {day.count > 0 ? day.count : '•'}
              </div>
              <div style={{
                fontSize: '8px',
                color: day.isToday ? '#4ad7a8' : 'rgba(255,255,255,0.3)'
              }}>
                {new Date(day.dateStr).getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HydrationTracker;