import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./components/Home";
import ScreenHealth from "./components/ScreenHealth";
import CameraMonitor from "./components/CameraMonitor";
import MedicineReminder from "./components/MedicineReminder";
import About from "./components/About";
import Contact from "./components/Contact";
import SplashScreen from "./components/SplashScreen";
import { ToastProvider } from "./components/Toast";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    // Service Worker Registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/static/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) =>
          console.warn("Service Worker registration failed:", err)
        );
    }

    // Notification Permission
    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }

    return () => clearTimeout(splashTimer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app">
          <Navbar />

          <main className="page-shell">
            <div className="container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/screen-health"
                  element={<ScreenHealth />}
                />
                <Route
                  path="/camera-monitor"
                  element={<CameraMonitor />}
                />
                <Route
                  path="/medicine-reminder"
                  element={<MedicineReminder />}
                />
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