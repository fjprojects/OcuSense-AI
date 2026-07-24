import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/ocusense-splash.png";

const Home = () => {
  const features = [
    {
      icon: "fa-clock",
      title: "Screen Health",
      desc: "Monitor screen time, viewing distance, and eye strain analysis",
      link: "/screen-health",
    },
    {
      icon: "fa-video",
      title: "Camera Monitor",
      desc: "Launch live camera blink detection and face distance monitoring",
      link: "/camera-monitor",
    },
    {
      icon: "fa-pills",
      title: "Medicine Reminder",
      desc: "Schedule reminders for eye care medication and track alerts",
      link: "/medicine-reminder",
    },
  ];

  return (
    <>
    <div className="home-logo-section">
  <img
    src={logo}
    alt="Ocusense Arena"
    className="home-logo"
  />
</div>
     <div className="row gy-4">

        {/* Hero Section */}
        <div className="col-12">
          <div className="glass-card hero-panel p-5">

            <div className="text-center text-lg-start mb-4">


              <p className="text-uppercase text-accent mb-3 small-note">
                AI-powered eye wellness assistant
              </p>

              <h1 className="display-5 fw-bold mb-3">
                OcuSense Arena
              </h1>

            </div>


            <p className="lead text-white-75 mb-4">
              A modern dashboard for screen health, camera monitoring,
              wellness tracking, and medicine scheduling with a polished,
              SaaS-ready interface.
            </p>


            <div className="d-flex flex-column flex-sm-row gap-3">

              <Link 
                className="btn btn-outline-light btn-lg" 
                to="/screen-health"
              >
                Get Started
              </Link>


              <Link 
                className="btn btn-outline-light btn-lg" 
                to="/about"
              >
                Learn More
              </Link>

            </div>

          </div>
        </div>



        {/* Why OcuSense */}
        <div className="col-12">
          <div className="glass-card p-4 h-100">

            <h2 className="h4 section-heading mb-3">
              Why OcuSense Arena?
            </h2>


            <ul className="list-unstyled small-note mb-0">

              <li className="mb-3">
                <i className="fas fa-check-circle text-success me-2"></i>
                Dedicated pages for each feature.
              </li>


              <li className="mb-3">
                <i className="fas fa-check-circle text-success me-2"></i>
                Clean dashboard layout with glassmorphism panels.
              </li>


              <li>
                <i className="fas fa-check-circle text-success me-2"></i>
                Responsive navigation and modern SaaS styling.
              </li>

            </ul>

          </div>
        </div>

      </div>



      {/* Feature Section */}
      <section className="mt-5">

        <div className="mb-4">

          <p className="text-uppercase text-accent mb-2">
            Feature overview
          </p>


          <h2 className="section-heading">
            Explore each module
          </h2>


          <p className="small-note">
            Navigate to the dedicated module pages for focused workflows
            and clearer presentation.
          </p>

        </div>



        <div className="row g-4">

          {features.map((feature, index) => (

            <div 
              key={index} 
              className="col-md-6 col-xl-4"
            >

              <div className="glass-card p-4 feature-card h-100">


                <div className="d-flex align-items-center mb-3">

                  <div className="icon me-3">
                    <i className={`fas ${feature.icon}`}></i>
                  </div>


                  <h5 className="mb-0">
                    {feature.title}
                  </h5>

                </div>


                <p className="small-note mb-4">
                  {feature.desc}
                </p>


                <Link 
                  className="btn btn-outline-light" 
                  to={feature.link}
                >
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