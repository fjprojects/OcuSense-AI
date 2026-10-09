import React, { useEffect } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
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
        </div>
        </MedicineProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
