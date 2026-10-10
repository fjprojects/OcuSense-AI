import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Routes, Route, BrowserRouter, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ScreenHealth from './components/ScreenHealth';
import CameraMonitor from './components/CameraMonitor';
import MedicineReminder from './components/MedicineReminder';
import About from './components/About';
import Contact from './components/Contact';
import { ToastProvider } from './components/Toast';
import { MedicineProvider } from './components/MedicineProvider';
import './App.css';

const pageTitles = {
  '/': 'Everyday screen wellness', '/screen-health': 'Screen health',
  '/camera-monitor': 'Camera monitor', '/medicine-reminder': 'Medicine reminders',
  '/about': 'About', '/contact': 'Contact and feedback'
};

function RouteView() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    document.title = (pageTitles[pathname] || 'Screen wellness') + ' · OcuSense';
    if (previousPath.current !== pathname) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    previousPath.current = pathname;
  }, [pathname]);
  return null;
}

function App() {
  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log(' Service Worker registered'))
        .catch((err) => console.warn(' SW registration failed:', err));
    }

  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <MedicineProvider>
        <div className="app">
          <RouteView />
          <Navbar />
          <main className="page-shell" id="main-content" tabIndex={-1}>
            <div className="container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/screen-health" element={<ScreenHealth />} />
                <Route path="/camera-monitor" element={<CameraMonitor />} />
                <Route path="/medicine-reminder" element={<MedicineReminder />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
              </Routes>
            </div>
          </main>
          <footer className="app-footer">
            <div className="container">
              <p><strong>OcuSense</strong> · Small habits for healthier screen time.</p>
              <div className="footer-links">
                <Link to="/about">About the project</Link>
                <Link to="/contact">Share feedback</Link>
              </div>
            </div>
          </footer>
        </div>
        </MedicineProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
