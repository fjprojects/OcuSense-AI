import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: 'fa-clock',
      title: 'Screen Health',
      desc: 'Track focus sessions, follow break reminders, and log your water intake',
      link: '/screen-health'
    },
    {
      icon: 'fa-video',
      title: 'Camera Monitor',
      desc: 'Track blinks in your browser and calibrate an estimated viewing distance',
      link: '/camera-monitor'
    },
    {
      icon: 'fa-pills',
      title: 'Medicine Reminder',
      desc: 'Save medicine schedules and receive alerts while the app is open',
      link: '/medicine-reminder'
    }
  ];

  return (
    <>
      <div className="row align-items-center gy-4">
        <div className="col-lg-7">
          <div className="glass-card hero-panel p-5">
            <p className="text-uppercase text-accent mb-3 small-note">
              AI-powered eye wellness assistant
            </p>
            <h1 className="display-5 fw-bold mb-3">Ocusense Arena</h1>
            <p className="lead text-white-75 mb-4">
              Build healthier screen habits with timed breaks, hydration tracking,
              camera monitoring, and medicine reminders.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3">
              <Link className="btn btn-accent btn-lg" to="/screen-health">
                Get Started
              </Link>
              <Link className="btn btn-outline-light btn-lg" to="/about">
                Learn More
              </Link>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="glass-card p-4 h-100">
            <h2 className="h4 section-heading mb-3">Why Ocusense Arena?</h2>
            <ul className="list-unstyled small-note mb-0">
              <li className="mb-3">
                <i className="fas fa-check-circle text-success me-2"></i>
                Start and pause your focus sessions.
              </li>
              <li className="mb-3">
                <i className="fas fa-check-circle text-success me-2"></i>
                Keep camera processing on your device.
              </li>
              <li>
                <i className="fas fa-check-circle text-success me-2"></i>
                See your saved reminder schedule in one place.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mt-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
          <div>
            <p className="text-uppercase text-accent mb-2">Feature overview</p>
            <h2 className="section-heading">Explore each module</h2>
            <p className="small-note">
              Choose a tool to support your next screen session.
            </p>
          </div>
        </div>
        <div className="row g-4">
          {features.map((feature, index) => (
            <div key={index} className="col-md-6 col-xl-4">
              <div className="glass-card p-4 feature-card h-100">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon me-3">
                    <i className={`fas ${feature.icon}`}></i>
                  </div>
                  <div>
                    <h5 className="mb-0">{feature.title}</h5>
                  </div>
                </div>
                <p className="small-note mb-4">{feature.desc}</p>
                <Link className="btn btn-outline-light" to={feature.link}>
                  Open Module
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
