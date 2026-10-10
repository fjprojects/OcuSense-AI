import React from 'react';
import PageHeader from './PageHeader';

const About = () => (
  <>
    <PageHeader eyebrow="Meet OcuSense" title="Built for healthier screen habits"
      description="Everyday tools that make it easier to care for yourself while you work." />
    <section className="glass-card about-intro">
      <h2>A little attention to your habits can change your screen routine.</h2>
      <p>OcuSense brings focus sessions, water tracking, camera monitoring, and medicine reminders together. Pick the tools that fit your day and build a routine one small step at a time.</p>
    </section>
    <div className="about-grid">
      <section className="glass-card"><div className="tool-icon"><i className="fas fa-clock" aria-hidden="true" /></div><h2>Simple daily habits</h2><p className="small-note">Start a focus session, take a break, or log a glass of water without a complicated setup.</p></section>
      <section className="glass-card"><div className="tool-icon"><i className="fas fa-shield-halved" aria-hidden="true" /></div><h2>Camera processing on your device</h2><p className="small-note">Blink and distance tracking happens in your browser. Camera frames are not sent to the server.</p></section>
      <section className="glass-card"><div className="tool-icon"><i className="fas fa-comment" aria-hidden="true" /></div><h2>A project shaped by feedback</h2><p className="small-note">Report a problem or suggest a feature. Your message is shared privately with the project team.</p></section>
    </div>
    <div className="about-details">
      <section><h2>How your data is handled</h2><p className="small-note">Focus and water progress stays in this browser. Medicine reminders are saved for your browser session; clearing cookies ends access to them. Contact messages are stored for the project team to review.</p></section>
      <section><h2>Understanding the readings</h2><p className="small-note">Camera distance and posture readings are estimates. Screen-time risk uses session duration. These tools support everyday habits and are not a clinical diagnosis.</p></section>
    </div>
  </>
);

export default About;
