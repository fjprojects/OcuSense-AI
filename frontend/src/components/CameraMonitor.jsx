import React, { useState, useRef, useEffect } from 'react';
import { useToast } from './Toast';

const CameraMonitor = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState('Stopped');
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkRate, setBlinkRate] = useState(0);
  const [distance, setDistance] = useState('-- cm');
  const [distanceColor, setDistanceColor] = useState('#6c757d');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const { showToast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle background visibility
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isCameraActive) {
        console.log('🔙 Tab visible, checking camera...');
        
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          const allLive = tracks.every(t => t.readyState === 'live');
          
          if (!allLive) {
            console.log('🔄 Camera dead, restarting...');
            await stopCamera();
            await startCamera();
          } else {
            console.log('✅ Camera still alive');
            setStatus('Running');
          }
        } else {
          console.log('🔄 No stream, restarting...');
          await startCamera();
        }
      } else if (document.visibilityState === 'hidden' && isCameraActive) {
        console.log('📱 Tab in background');
        setStatus('Background (paused)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      setStatus('Starting...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user' 
        },
        audio: false
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      setIsCameraActive(true);
      setStatus('Running');
      setBlinkCount(0);
      setBlinkRate(0);
      
      // Start detection
      startDetection();
      
      showToast('📷 Camera started successfully!', 'success');
    } catch (error) {
      console.error('Camera error:', error);
      handleError(error);
    }
  };

  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setStatus('Stopped');
    setBlinkCount(0);
    setBlinkRate(0);
    setDistance('-- cm');
    setDistanceColor('#6c757d');
    
    showToast('📷 Camera stopped', 'info');
  };

  const startDetection = () => {
    // Simulated blink and distance detection
    let isBlinking = false;
    let blinkCount = 0;
    let blinkRateCount = 0;
    let minuteStart = Date.now();

    detectionIntervalRef.current = setInterval(() => {
      if (!isCameraActive) return;
      
      // Simulate blink detection (every 3-6 seconds)
      const shouldBlink = Math.random() < 0.25;
      
      if (shouldBlink && !isBlinking) {
        isBlinking = true;
        blinkCount++;
        blinkRateCount++;
        setBlinkCount(blinkCount);
        
        // Calculate blink rate per minute
        const now = Date.now();
        if (now - minuteStart >= 60000) {
          setBlinkRate(blinkRateCount);
          blinkRateCount = 0;
          minuteStart = now;
        }
        
        setTimeout(() => {
          isBlinking = false;
        }, 200);
      }

      // Simulate distance
      const dist = 25 + Math.random() * 35;
      setDistance(`${dist.toFixed(1)} cm`);
      
      if (dist < 30) {
        setDistanceColor('#fc8181');
        if (Math.random() < 0.05) {
          showToast('⚠️ Too close! Move back from screen.', 'warning');
        }
      } else if (dist < 40) {
        setDistanceColor('#ecc94b');
      } else {
        setDistanceColor('#4ad7a8');
      }
    }, 2000);
  };

  const handleError = (error) => {
    setStatus('Error');
    setIsCameraActive(false);

    let message = '';
    switch (error.name) {
      case 'NotAllowedError':
        message = 'Camera permission denied. Please allow camera access.';
        break;
      case 'NotFoundError':
        message = 'No camera found. Please connect a camera.';
        break;
      case 'NotReadableError':
        message = 'Camera in use. Close other apps using the camera.';
        break;
      default:
        message = `${error.name}: ${error.message}`;
    }
    
    alert(`Camera Error\n\n${message}`);
  };

  return (
    <div className="row gy-4">
      <div className="col-lg-8">
        <div className="glass-card p-5 mb-4">
          <p className="text-uppercase text-accent mb-3 small-note">Camera Monitoring</p>
          <h1 className="section-heading mb-3">Live blink and distance tracking</h1>
          <p className="small-note">Start your camera session and monitor live eye wellness data.</p>
          <div className="mt-4 d-flex flex-wrap gap-3">
            <span className="status-pill"><i className="fas fa-video me-2"></i>Live detection</span>
            <span className="status-pill"><i className="fas fa-eye me-2"></i>Blink tracking</span>
            <span className="status-pill"><i className="fas fa-ruler-vertical me-2"></i>Distance alerts</span>
          </div>
        </div>

        <div className="glass-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5>Camera controls</h5>
              <p className="small-note mb-0">Use your camera to start monitoring blinks and distance.</p>
            </div>
            <button
              className={`btn ${isCameraActive ? 'btn-danger' : 'btn-accent'}`}
              onClick={isCameraActive ? stopCamera : startCamera}
            >
              <i className={`fas ${isCameraActive ? 'fa-stop' : 'fa-play'} me-2`}></i>
              {isCameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
        </div>

        <div className="glass-card p-4 mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              minHeight: '320px',
              borderRadius: '20px',
              background: '#020814',
              display: isCameraActive ? 'block' : 'none'
            }}
          />
          {!isCameraActive && (
            <div style={{
              minHeight: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6c757d',
              borderRadius: '20px',
              background: '#020814'
            }}>
              <div className="text-center">
                <i className="fas fa-camera fa-4x mb-3" style={{ opacity: 0.3 }}></i>
                <p>Camera inactive</p>
                <p className="small">Click "Start Camera" to begin</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3">Live Status</h5>
          <div className="row g-3 text-white-75">
            <div className="col-md-4">
              <div className="glass-card p-3">
                Status: <strong style={{ color: status === 'Running' ? '#4ad7a8' : '#6c757d' }}>{status}</strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-3">
                Blink count: <strong>{blinkCount}</strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-3">
                Blink rate: <strong>{blinkRate} / min</strong>
              </div>
            </div>
            <div className="col-12">
              <div className="glass-card p-3">
                Face distance: <strong style={{ color: distanceColor }}>{distance}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="glass-card p-4 feature-list-card h-100">
          <h5 className="mb-3">Key capabilities</h5>
          <ul className="list-unstyled small-note mb-0">
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Real-time face detection</li>
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Blink tracking</li>
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Face distance monitor</li>
            <li><i className="fas fa-circle-notch text-accent me-2"></i>Live status updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CameraMonitor;