import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleButton = useRef(null);
  return (
    <nav className="navbar navbar-expand-lg navbar-dark py-3" aria-label="Main navigation"
      onKeyDown={event => {
        if (event.key === 'Escape') { setIsOpen(false); toggleButton.current.focus(); }
      }}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="container">
        <NavLink className="navbar-brand" to="/" onClick={() => setIsOpen(false)}>
          <i className="fas fa-eye"></i> Ocusense Arena
        </NavLink>
        <button
          className="navbar-toggler"
          ref={toggleButton}
          type="button"
          aria-controls="ocusenseNavbar"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen(previous => !previous)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={'collapse navbar-collapse' + (isOpen ? ' show' : '')} id="ocusenseNavbar"
          onClick={event => { if (event.target.closest('a')) setIsOpen(false); }}>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                } 
                to="/"
              >
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                } 
                to="/screen-health"
              >
                Screen Health
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                } 
                to="/camera-monitor"
              >
                Camera Monitor
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                } 
                to="/medicine-reminder"
              >
                Medicine Reminder
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                } 
                to="/about"
              >
                About
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                } 
                to="/contact"
              >
                Contact
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
