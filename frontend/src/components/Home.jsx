import React from 'react';
import { Link } from 'react-router-dom';

const tools = [
  { icon: 'fa-clock', title: 'Screen Health', description: 'Focus timers, break reminders, and daily water tracking.', path: '/screen-health', action: 'Start a session' },
  { icon: 'fa-video', title: 'Camera Monitor', description: 'Blink tracking and calibrated distance estimates, on your device.', path: '/camera-monitor', action: 'Open the camera' },
  { icon: 'fa-pills', title: 'Medicine Reminder', description: 'A simple schedule for your medicines, with alerts while the app is open.', path: '/medicine-reminder', action: 'Set a reminder' }
];

const Home = () => (
  <>
    <section className="home-hero" aria-labelledby="home-title">
      <div>
        <p className="eyebrow">Small habits. Healthier screen time.</p>
        <h1 id="home-title">A healthier rhythm.<br /><span>One small habit<br className="d-none d-lg-block" /> at a time.</span></h1>
        <p className="hero-description">Make room for a break, a glass of water, and a better screen setup. OcuSense keeps your everyday wellness tools in one place.</p>
        <div className="hero-actions">
          <Link className="btn btn-accent" to="/screen-health">Start a focus session <i className="fas fa-arrow-right" aria-hidden="true" /></Link>
          <a className="btn btn-outline-light" href="#daily-tools">Explore the tools</a>
        </div>
        <p className="hero-footnote"><i className="fas fa-shield-halved" aria-hidden="true" /> Camera frames stay on your device.</p>
      </div>
      <aside className="routine-panel" aria-label="A simple screen routine">
        <p className="eyebrow">Your next screen session</p>
        <h2>A little care goes a long way.</h2>
        <div className="routine-step">
          <span className="routine-number">01</span>
          <div><h3>Focus, then look away</h3><p>Use a timer to make space for regular breaks.</p></div>
        </div>
        <div className="routine-step">
          <span className="routine-number">02</span>
          <div><h3>Keep water within reach</h3><p>Log each glass and follow your daily progress.</p></div>
        </div>
        <div className="routine-step">
          <span className="routine-number">03</span>
          <div><h3>Check your screen setup</h3><p>Use the camera to track blinks and estimate your viewing distance.</p></div>
        </div>
      </aside>
    </section>
    <section id="daily-tools" aria-labelledby="tools-title">
      <div className="section-intro"><h2 id="tools-title">Your everyday toolkit</h2><p>Choose what you need for this session.</p></div>
      <div className="tool-grid">
        {tools.map(tool => (
          <Link key={tool.path} className="tool-card" to={tool.path}>
            <div className="tool-icon"><i className={'fas ' + tool.icon} aria-hidden="true" /></div>
            <div><h3>{tool.title}</h3><p>{tool.description}</p></div>
            <div className="tool-link"><span>{tool.action}</span><i className="fas fa-arrow-right" aria-hidden="true" /></div>
          </Link>
        ))}
      </div>
    </section>
    <section className="home-note" aria-label="Project feedback">
      <div><h2>Help shape OcuSense</h2><p className="small-note">Something missing, or an idea to make it better? We'd like to hear it.</p></div>
      <Link to="/contact">Share feedback <i className="fas fa-arrow-right ms-1" aria-hidden="true" /></Link>
    </section>
  </>
);

export default Home;
