import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './Toast';

// MediaPipe imports
import * as faceMesh from '@mediapipe/face_mesh';
import * as cameraUtils from '@mediapipe/camera_utils';
import * as drawingUtils from '@mediapipe/drawing_utils';

const CameraMonitor = () => {
  // ==================== STATE ====================
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState('Stopped');
  const [isLoading, setIsLoading] = useState(false);
  
  // Blink tracking
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkRate, setBlinkRate] = useState(0);
  
  // Distance & posture
  const [distance, setDistance] = useState('-- cm');
  const [distanceColor, setDistanceColor] = useState('#6c757d');
  const [posture, setPosture] = useState('good');
  const [postureScore, setPostureScore] = useState(100);
  
  // Face & head
  const [faceDetected, setFaceDetected] = useState(false);
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0, z: 0 });
  
  // Session stats
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const sessionIntervalRef = useRef(null);
  const { showToast } = useToast();
  
  // ==================== BLINK DETECTION REFS (FIXED) ====================
  const blinkCountRef = useRef(0);
  const blinkRateCountRef = useRef(0);
  const minuteStartRef = useRef(Date.now());
  const leftEyeOpenRef = useRef(true);
  const rightEyeOpenRef = useRef(true);
  const leftEyeClosedFramesRef = useRef(0);
  const rightEyeClosedFramesRef = useRef(0);
  const BLINK_THRESHOLD = 2;
  const EAR_THRESHOLD = 0.18;
  
  // ==================== BLINK RATE CALCULATION (FIXED) ====================
  const updateBlinkRate = useCallback(() => {
    const now = Date.now();
    const elapsedSeconds = (now - minuteStartRef.current) / 1000;
    
    // Update blink rate every second
    if (elapsedSeconds >= 1) {
      // Calculate rate: blinks per minute
      const rate = Math.round((blinkRateCountRef.current / elapsedSeconds) * 60);
      setBlinkRate(rate);
      
      // Show warnings based on blink rate
      if (rate < 8 && rate > 0) {
        showToast(' Low blink rate! Remember to blink more often.', 'warning');
      } else if (rate > 25) {
        showToast(' High blink rate! You might be tired.', 'warning');
      }
    }
  }, [showToast]);

  // ==================== RESET BLINK RATE COUNTER ====================
  const resetBlinkRateCounter = useCallback(() => {
    const rate = blinkRateCountRef.current;
    setBlinkRate(rate);
    blinkRateCountRef.current = 0;
    minuteStartRef.current = Date.now();
  }, []);

  // ==================== CLEANUP ====================
  useEffect(() => {
    return () => {
      stopCamera();
      clearInterval(sessionIntervalRef.current);
    };
  }, []);

  // ==================== SESSION TIMER ====================
  useEffect(() => {
    if (isCameraActive && sessionStart) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStart) / 1000));
        
        // Update blink rate every second
        updateBlinkRate();
        
        // Reset counter every minute
        const elapsedSeconds = (Date.now() - minuteStartRef.current) / 1000;
        if (elapsedSeconds >= 60) {
          resetBlinkRateCounter();
        }
      }, 1000);
    }
    return () => clearInterval(sessionIntervalRef.current);
  }, [isCameraActive, sessionStart, updateBlinkRate, resetBlinkRateCounter]);

  // ==================== VISIBILITY HANDLER ====================
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isCameraActive) {
        console.log(' Tab visible, checking camera...');
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          const allLive = tracks.every(t => t.readyState === 'live');
          if (!allLive) {
            await stopCamera();
            await startCamera();
          } else {
            setStatus('Running');
          }
        } else {
          await startCamera();
        }
      } else if (document.visibilityState === 'hidden' && isCameraActive) {
        console.log(' Tab in background');
        setStatus('Background (paused)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCameraActive]);

  // ==================== FACE MESH INITIALIZATION ====================
  const initializeFaceMesh = useCallback(() => {
    try {
      faceMeshRef.current = new faceMesh.FaceMesh({
        locateFile: (file) => 
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMeshRef.current.onResults(onResults);
      console.log(' Face Mesh initialized');
      return true;
    } catch (error) {
      console.error(' Face Mesh initialization error:', error);
      return false;
    }
  }, []);

  // ==================== EYE ASPECT RATIO CALCULATION ====================
  const calculateEAR = (upper, lower, inner, outer) => {
    if (!upper || !lower || !inner || !outer) return 0;
    
    const verticalDist = Math.sqrt(
      Math.pow(upper.x - lower.x, 2) + 
      Math.pow(upper.y - lower.y, 2)
    );
    
    const horizontalDist = Math.sqrt(
      Math.pow(inner.x - outer.x, 2) + 
      Math.pow(inner.y - outer.y, 2)
    );
    
    return horizontalDist > 0 ? verticalDist / horizontalDist : 0;
  };

  // ==================== HEAD POSE ESTIMATION ====================
  const calculateHeadPose = (landmarks) => {
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    if (!nose || !leftEye || !rightEye) return { x: 0, y: 0, z: 0 };

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    
    return {
      x: (nose.x - eyeMidX) * 100,
      y: (nose.y - eyeMidY) * 100,
      z: (leftEye.y - rightEye.y) * 100
    };
  };

  // ==================== POSTURE DETECTION ====================
  const detectPosture = (headPose, distanceCm) => {
    let posture = 'good';
    let score = 100;

    if (Math.abs(headPose.x) > 15 || Math.abs(headPose.y) > 15) {
      posture = 'poor';
      score -= 30;
    }

    if (distanceCm < 30) {
      posture = 'too_close';
      score -= 30;
    } else if (distanceCm > 60) {
      posture = 'too_far';
      score -= 10;
    }

    return { posture, score: Math.max(0, score) };
  };

  // ==================== RESULTS PROCESSING ====================
  const onResults = (results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      setDistance('No face detected');
      setDistanceColor('#6c757d');
      return;
    }

    setFaceDetected(true);
    const landmarks = results.multiFaceLandmarks[0];
    
    // Draw on canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawingUtils.drawConnectors(ctx, landmarks, faceMesh.FACEMESH_TESSELATION, 
        { color: 'rgba(74,215,168,0.1)', lineWidth: 0.5 });
      drawingUtils.drawConnectors(ctx, landmarks, faceMesh.FACEMESH_RIGHT_EYE, 
        { color: '#4ad7a8', lineWidth: 1.5 });
      drawingUtils.drawConnectors(ctx, landmarks, faceMesh.FACEMESH_LEFT_EYE, 
        { color: '#4ad7a8', lineWidth: 1.5 });
      drawingUtils.drawConnectors(ctx, landmarks, faceMesh.FACEMESH_FACE_OVAL, 
        { color: 'rgba(255,255,255,0.3)', lineWidth: 1 });
    }

    // 1. Calculate distance
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    let distanceCm = 45;
    
    if (leftCheek && rightCheek) {
      const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
      distanceCm = 30 + (1 - faceWidth) * 50;
      distanceCm = Math.max(20, Math.min(80, distanceCm));
      
      setDistance(`${distanceCm.toFixed(1)} cm`);
      
      if (distanceCm < 30) {
        setDistanceColor('#fc8181');
      } else if (distanceCm < 40) {
        setDistanceColor('#ecc94b');
      } else {
        setDistanceColor('#4ad7a8');
      }
    }

    // 2. Eye tracking & Blink detection
    const leftEyeInner = landmarks[133];
    const leftEyeOuter = landmarks[33];
    const leftEyeUpper = landmarks[159];
    const leftEyeLower = landmarks[145];
    
    const rightEyeInner = landmarks[362];
    const rightEyeOuter = landmarks[263];
    const rightEyeUpper = landmarks[386];
    const rightEyeLower = landmarks[374];

    const leftEAR = calculateEAR(leftEyeUpper, leftEyeLower, leftEyeInner, leftEyeOuter);
    const rightEAR = calculateEAR(rightEyeUpper, rightEyeLower, rightEyeInner, rightEyeOuter);
    
    const leftEyeOpen = leftEAR > EAR_THRESHOLD;
    const rightEyeOpen = rightEAR > EAR_THRESHOLD;
    const isBlinking = !leftEyeOpen && !rightEyeOpen;

    // Detect blinks - FIXED: Proper blink counting
    if (!leftEyeOpen && !rightEyeOpen) {
      // Eyes are closed
      leftEyeClosedFramesRef.current++;
      rightEyeClosedFramesRef.current++;
    } else if (leftEyeOpen && rightEyeOpen) {
      // Eyes are open - check if they were closed before
      if (leftEyeClosedFramesRef.current >= BLINK_THRESHOLD || 
          rightEyeClosedFramesRef.current >= BLINK_THRESHOLD) {
        // Count a blink
        blinkCountRef.current++;
        blinkRateCountRef.current++;
        setBlinkCount(blinkCountRef.current);
        
        console.log(` Blink detected! Total: ${blinkCountRef.current}, Rate count: ${blinkRateCountRef.current}`);
      }
      // Reset closed frames
      leftEyeClosedFramesRef.current = 0;
      rightEyeClosedFramesRef.current = 0;
    }

    leftEyeOpenRef.current = leftEyeOpen;
    rightEyeOpenRef.current = rightEyeOpen;

    // 3. Head pose
    const headPose = calculateHeadPose(landmarks);
    setHeadTilt(headPose);

    // 4. Posture detection
    const postureResult = detectPosture(headPose, distanceCm);
    setPosture(postureResult.posture);
    setPostureScore(postureResult.score);
  };

  // ==================== CAMERA CONTROLS ====================
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setStatus('Starting...');
      
      if (!initializeFaceMesh()) {
        throw new Error('Face Mesh initialization failed');
      }
      
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
      setSessionStart(Date.now());
      
      // Reset all counters
      blinkCountRef.current = 0;
      blinkRateCountRef.current = 0;
      minuteStartRef.current = Date.now();
      leftEyeClosedFramesRef.current = 0;
      rightEyeClosedFramesRef.current = 0;
      setBlinkCount(0);
      setBlinkRate(0);
      
      // Start camera
      if (videoRef.current && faceMeshRef.current) {
        cameraRef.current = new cameraUtils.Camera(videoRef.current, {
          onFrame: async () => {
            try {
              await faceMeshRef.current.send({image: videoRef.current});
            } catch (err) {
              // Silent fail
            }
          },
          width: 640,
          height: 480
        });
        await cameraRef.current.start();
      }
      
      showToast(' Camera started successfully!', 'success');
    } catch (error) {
      console.error('Camera error:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (e) {}
      cameraRef.current = null;
    }

    faceMeshRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setIsCameraActive(false);
    setStatus('Stopped');
    setSessionStart(null);
    setSessionTime(0);
    setFaceDetected(false);
    setBlinkRate(0);
    
    showToast('📷 Camera stopped', 'info');
  };

  const handleError = (error) => {
    setStatus('Error');
    setIsCameraActive(false);
    setIsLoading(false);

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

  // ==================== FORMAT TIME ====================
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ==================== GET STATUS COLOR ====================
  const getStatusColor = () => {
    if (status === 'Running') return '#4ad7a8';
    if (status === 'Error') return '#fc8181';
    if (status === 'Starting...') return '#ecc94b';
    return '#6c757d';
  };

  // ==================== RENDER ====================
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
            <span className="status-pill" style={{ 
              background: faceDetected ? 'rgba(74,215,168,0.2)' : 'rgba(255,255,255,0.08)',
              color: faceDetected ? '#4ad7a8' : 'rgba(230,248,255,0.72)'
            }}>
              <i className={`fas ${faceDetected ? 'fa-smile' : 'fa-meh'} me-2`}></i>
              {faceDetected ? 'Face detected' : 'No face'}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5>Camera controls</h5>
              <p className="small-note mb-0">Use your camera to start monitoring blinks and distance.</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className={`btn ${isCameraActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={isCameraActive ? stopCamera : startCamera}
                disabled={isLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  minWidth: '140px'
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className={`fas ${isCameraActive ? 'fa-stop' : 'fa-play'} me-2`}></i>
                    {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 mb-4" style={{ position: 'relative' }}>
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
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: 'calc(100% - 40px)',
              height: 'calc(100% - 40px)',
              borderRadius: '20px',
              pointerEvents: 'none',
              display: isCameraActive ? 'block' : 'none'
            }}
            width={640}
            height={480}
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
          <div className="row g-3">
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1">Status</p>
                <strong style={{ color: getStatusColor() }}>{status}</strong>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1">Session Time</p>
                <strong>{formatTime(sessionTime)}</strong>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1"> Blink Count</p>
                <strong>{blinkCount}</strong>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1">Blink Rate</p>
                <strong style={{ color: blinkRate >= 12 && blinkRate <= 25 ? '#4ad7a8' : blinkRate > 8 ? '#ecc94b' : '#fc8181' }}>
                  {blinkRate} / min
                </strong>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1"> Face Distance</p>
                <strong style={{ color: distanceColor }}>{distance}</strong>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1"> Posture</p>
                <strong>
                  {posture.charAt(0).toUpperCase() + posture.slice(1)} ({postureScore}%)
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="glass-card p-4 mb-4">
          <h5 className="mb-3"> Health Summary</h5>
          
          <div className="mb-3">
            <div className="d-flex justify-content-between">
              <span className="small-note">Blink Rate</span>
              <span style={{ color: blinkRate >= 12 && blinkRate <= 25 ? '#4ad7a8' : blinkRate > 8 ? '#ecc94b' : '#fc8181' }}>
                {blinkRate} / min
              </span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div className="progress-bar" style={{ 
                width: `${Math.min(100, (blinkRate / 25) * 100)}%`,
                background: blinkRate >= 12 && blinkRate <= 25 ? '#4ad7a8' : '#ecc94b'
              }}></div>
            </div>
            <small className="text-muted">Target: 12-25 blinks/min</small>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between">
              <span className="small-note">Posture</span>
              <span style={{ color: postureScore > 80 ? '#4ad7a8' : '#ecc94b' }}>
                {postureScore}%
              </span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div className="progress-bar" style={{ 
                width: `${postureScore}%`,
                background: postureScore > 80 ? '#4ad7a8' : '#ecc94b'
              }}></div>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3"> Real-time Tips</h5>
          <ul className="list-unstyled small-note mb-0">
            {blinkRate < 12 && blinkRate > 0 && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                 Try to blink more often (target: 12-25 blinks/min)
              </li>
            )}
            {blinkRate > 25 && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                 High blink rate! You might be tired. Take a break.
              </li>
            )}
            {blinkRate >= 12 && blinkRate <= 25 && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#4ad7a8' }}></i>
                 Great blink rate! Keep it up!
              </li>
            )}
            {distance.includes('30') && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#fc8181' }}></i>
                 Move back from the screen (ideal: 40-60 cm)
              </li>
            )}
            {posture === 'poor' && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                 Straighten your posture for better ergonomics
              </li>
            )}
            {posture === 'good' && blinkRate >= 12 && blinkRate <= 25 && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#4ad7a8' }}></i>
                 All metrics are optimal! Great job!
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CameraMonitor;