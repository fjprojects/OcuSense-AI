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
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function App() {
  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/static/sw.js')
        .then(() => console.log(' Service Worker registered'))
        .catch((err) => console.warn(' SW registration failed:', err));
    }

    // Notification Permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app">
          <Navbar />
          <main className="page-shell">
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
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
