import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  ['/', 'Home'], ['/screen-health', 'Screen Health'], ['/camera-monitor', 'Camera Monitor'],
  ['/medicine-reminder', 'Medicine Reminder'], ['/about', 'About'], ['/contact', 'Contact']
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleButton = useRef(null);
  return (
    <nav className="navbar navbar-expand-lg navbar-dark site-nav" aria-label="Main navigation"
      onKeyDown={event => {
        if (event.key === 'Escape') { setIsOpen(false); toggleButton.current.focus(); }
      }}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="container">
        <NavLink className="navbar-brand" to="/" onClick={() => setIsOpen(false)} aria-label="OcuSense home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.7" /></svg>
          </span>
          OcuSense
        </NavLink>
        <button className="navbar-toggler" ref={toggleButton} type="button" aria-controls="ocusenseNavbar"
          aria-expanded={isOpen} aria-label="Toggle navigation" onClick={() => setIsOpen(previous => !previous)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={'collapse navbar-collapse' + (isOpen ? ' show' : '')} id="ocusenseNavbar"
          onClick={event => { if (event.target.closest('a')) setIsOpen(false); }}>
          <ul className="navbar-nav ms-auto">
            {links.map(([path, label]) => <li className="nav-item" key={path}>
              <NavLink to={path} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>{label}</NavLink>
            </li>)}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
