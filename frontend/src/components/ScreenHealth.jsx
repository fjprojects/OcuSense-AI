import React, { useState } from 'react';
import FocusTimer from './FocusTimer';
import HydrationTracker from './HydrationTracker';
import PageHeader from './PageHeader';

const ScreenHealth = () => {
  const [strain, setStrain] = useState({ level: 'Low', recommendation: 'Monitor screen time' });
  return (
    <>
      <PageHeader eyebrow="Your daily rhythm" title="Screen health"
        description="Find your focus, remember your breaks, and keep water within reach." />
      <div className="workspace-grid">
        <FocusTimer onStrainChange={setStrain} showStrain={false} />
        <HydrationTracker />
      </div>
      <div className="strain-banner">
        <i className="fas fa-eye" aria-hidden="true" />
        <div>
          <p>Screen-time risk: <strong id="strainLevel" style={{ color: strain.color }}>{strain.level}</strong> · <span id="strainRecommendation">{strain.recommendation}</span></p>
          <p className="small-note">Based on session duration: low under 20 minutes, medium 20–40, high over 40. A reminder for your habits, not a diagnosis.</p>
        </div>
      </div>
      <section className="tips-strip" aria-label="Screen health tips">
        <div className="tip-item"><i className="fas fa-binoculars" aria-hidden="true" /><div><h3>Give your eyes a change of scene</h3><p>Every 20 minutes, look 20 feet away for 20 seconds.</p></div></div>
        <div className="tip-item"><i className="fas fa-droplet" aria-hidden="true" /><div><h3>Make water part of your routine</h3><p>Keep a glass nearby and log it when you drink.</p></div></div>
        <div className="tip-item"><i className="fas fa-display" aria-hidden="true" /><div><h3>Set up a comfortable screen</h3><p>Reduce glare and adjust your screen to a comfortable height.</p></div></div>
      </section>
    </>
  );
};

export default ScreenHealth;
