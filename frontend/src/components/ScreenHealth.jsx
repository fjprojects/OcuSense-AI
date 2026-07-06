import React from 'react';
import FocusTimer from './FocusTimer';
import HydrationTracker from './HydrationTracker';

const ScreenHealth = () => {
  return (
    <div className="row gy-4">
      <div className="col-lg-8">
        <div className="glass-card p-5 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <p className="text-uppercase text-accent mb-3 small-note">Screen Health</p>
              <h1 className="section-heading mb-3">
                Breaks, hydration, and screen wellness in one place
              </h1>
              <p className="small-note">
                Track screen time, set break reminders, and stay hydrated while keeping eye strain low.
              </p>
            </div>
            <a className="btn btn-accent align-self-start" href="/">
              <i className="fas fa-arrow-left me-2"></i>Home
            </a>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <FocusTimer />
          </div>
          <div className="col-md-6">
            <HydrationTracker />
          </div>
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3">
            <i className="fas fa-chart-line text-accent me-2"></i>
            Eye Strain Risk Assessment
          </h5>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="glass-card p-3">
                <p className="small-note mb-2">Current Risk:</p>
                <p className="text-white mb-0">
                  <strong id="strainLevel"> Low</strong>
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="glass-card p-3">
                <p className="small-note mb-2">Status:</p>
                <p className="text-white mb-0">
                  <strong id="strainRecommendation">Monitor screen time</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <p className="small-note">
              <strong>How it works:</strong>
              Risk level increases with continuous screen time.
              Low: &lt;20 min | Medium: 20–40 min | High: 40+ min.
              Use the break reminder and hydration tracker for healthier screen habits.
            </p>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="glass-card p-4 h-100">
          <h5 className="mb-3">
            <i className="fas fa-lightbulb text-accent me-2"></i>
            Screen Health Tips
          </h5>
          <ul className="list-unstyled small-note mb-0">
            <li className="mb-3">
              <i className="fas fa-circle-notch text-accent me-2"></i>
              <strong>Track screen time:</strong> Monitor your focus sessions.
            </li>
            <li className="mb-3">
              <i className="fas fa-circle-notch text-accent me-2"></i>
              <strong>20-20-20:</strong> Every 20 minutes look 20 feet away for 20 seconds.
            </li>
            <li className="mb-3">
              <i className="fas fa-circle-notch text-accent me-2"></i>
              <strong>Stay hydrated:</strong> Drink water regularly.
            </li>
            <li className="mb-3">
              <i className="fas fa-circle-notch text-accent me-2"></i>
              <strong>Reduce strain:</strong> Blink often and take regular breaks.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScreenHealth;