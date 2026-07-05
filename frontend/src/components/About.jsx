import React from 'react';

const About = () => {
  return (
    <div className="row gy-4">
      <div className="col-lg-8">
        <div className="glass-card p-5 mb-4">
          <p className="text-uppercase text-accent mb-3 small-note">About Ocusense Arena</p>
          <h1 className="section-heading mb-3">Project objective</h1>
          <p className="small-note">
            Ocusense Arena is designed to transform eye care into a professional, multi-page dashboard experience. 
            It separates core features into dedicated pages and provides a clean interface for demos and classroom presentations.
          </p>
        </div>

        <div className="glass-card p-4 mb-4">
          <h5 className="mb-3">Technologies used</h5>
          <ul className="list-unstyled small-note mb-0">
            <li className="mb-2"><i className="fas fa-check-circle text-accent me-2"></i>React 18</li>
            <li className="mb-2"><i className="fas fa-check-circle text-accent me-2"></i>React Router v6</li>
            <li className="mb-2"><i className="fas fa-check-circle text-accent me-2"></i>Bootstrap 5</li>
            <li className="mb-2"><i className="fas fa-check-circle text-accent me-2"></i>FontAwesome icons</li>
            <li><i className="fas fa-check-circle text-accent me-2"></i>Glassmorphism and responsive SaaS design</li>
          </ul>
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3">Team</h5>
          <p className="small-note">
            This project is ideal for college demos, showcasing a polished architecture with separate feature pages and improved navigation.
          </p>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="glass-card p-4 h-100 feature-list-card">
          <h5 className="mb-3">Project highlights</h5>
          <ul className="list-unstyled small-note mb-0">
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Multi-page layout</li>
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Dedicated module pages</li>
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Professional dashboard design</li>
            <li><i className="fas fa-circle-notch text-accent me-2"></i>Responsive mobile support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;