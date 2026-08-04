import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './Toast';

// MediaPipe imports
import * as faceMesh from '@mediapipe/face_mesh';
import * as drawingUtils from '@mediapipe/drawing_utils';

const CameraMonitor = () => {
  // ==================== STATE ====================
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState('Stopped');
  const [isLoading, setIsLoading] = useState(false);
  
  // Blink tracking
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkRate, setBlinkRate] = useState(0);
  const [earValue, setEarValue] = useState(0);
  const [eyeState, setEyeState] = useState('open');
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  
  // Distance & posture
  const [distance, setDistance] = useState('-- cm');
  const [distanceColor, setDistanceColor] = useState('#6c757d');
  const [posture, setPosture] = useState('good');
  const [postureScore, setPostureScore] = useState(100);
  
  // Face & head
  const [faceDetected, setFaceDetected] = useState(false);
  
  // Session stats
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const sessionIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const { showToast } = useToast();
  
  // ==================== BLINK DETECTION REFS ====================
  const blinkCountRef = useRef(0);
  const blinkRateCountRef = useRef(0);
  const minuteStartRef = useRef(Date.now());
  const eyeStateRef = useRef("OPEN");
  const closedFrameCountRef = useRef(0);
  const invalidClosureRef = useRef(false);
  const lastBlinkTimeRef = useRef(0);
  
  // Calibration refs
  const calibrationSamplesRef = useRef([]);
  const calibratedThresholdRef = useRef(0.16);
  const isCalibratedRef = useRef(false);
  const calibrationFrameCountRef = useRef(0);
  const CALIBRATION_FRAMES = 90; // 3 seconds at 30fps
  const MIN_EAR_FOR_CALIBRATION = 0.20; // Ignore samples below this (likely blinks)
  
  // Adjusted thresholds
  const BLINK_THRESHOLD_FRAMES = 4; // Minimum frames eyes must be closed (~133ms at 30fps)
  const BLINK_COOLDOWN_MS = 700; // Minimum time between blinks
  const MAX_CLOSED_FRAMES = 20; // Ignore closures longer than this (not blinks)
  
  // Frame rate limiting
  const lastFrameTimeRef = useRef(0);
  const FRAME_INTERVAL = 33; // ~30 FPS

  // ==================== CALCULATE EAR ====================
  const calculateEAR = useCallback((p1, p2, p3, p4, p5, p6) => {
    if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 1;
    
    const v1 = Math.sqrt(
      Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2)
    );
    const v2 = Math.sqrt(
      Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2)
    );
    
    const h = Math.sqrt(
      Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2)
    );
    
    return h > 0 ? (v1 + v2) / (2.0 * h) : 1;
  }, []);

  // ==================== CALIBRATE EAR THRESHOLD ====================
  const calibrateThreshold = useCallback((minEAR) => {
    if (isCalibratedRef.current) return;
    
    calibrationFrameCountRef.current++;
    
    // Only collect samples that are likely open eyes (filter out blinks)
    if (minEAR > MIN_EAR_FOR_CALIBRATION) {
      calibrationSamplesRef.current.push(minEAR);
    }
    
    // Update calibration progress
    const progress = Math.min(100, Math.round((calibrationFrameCountRef.current / CALIBRATION_FRAMES) * 100));
    setCalibrationProgress(progress);
    
    if (calibrationFrameCountRef.current >= CALIBRATION_FRAMES) {
      const samples = calibrationSamplesRef.current;
      
      if (samples.length < 10) {
        // Not enough good samples, use default
        calibratedThresholdRef.current = 0.16;
        showToast('Using default threshold (insufficient calibration data)', 'warning');
      } else {
        // Sort and trim outliers
        const sortedSamples = [...samples].sort((a, b) => a - b);
        const trimStart = Math.floor(samples.length * 0.1);
        const trimEnd = Math.ceil(samples.length * 0.9);
        const trimmedSamples = sortedSamples.slice(trimStart, trimEnd);
        
        const mean = trimmedSamples.reduce((sum, val) => sum + val, 0) / trimmedSamples.length;
        
        // Use 75% of mean open EAR (was 60%)
        const dynamicThreshold = mean * 0.75;
        
        // Clamp to reasonable range
        calibratedThresholdRef.current = Math.max(0.12, Math.min(0.22, dynamicThreshold));
      }
      
      isCalibratedRef.current = true;
      setStatus("Running");
      showToast(`Calibration complete! Threshold: ${calibratedThresholdRef.current.toFixed(3)}`, 'success');
    }
  }, [showToast]);

  // ==================== CALCULATE HEAD POSE ====================
  const calculateHeadPose = useCallback((landmarks) => {
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
  }, []);

  // ==================== DETECT POSTURE ====================
  const detectPosture = useCallback((headPose, distanceCm) => {
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
  }, []);

  // ==================== HANDLE ERROR ====================
  const handleError = useCallback((error) => {
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
    
    showToast(`Camera Error: ${message}`, 'error');
  }, [showToast]);

  // ==================== ON RESULTS CALLBACK ====================
  const onResults = useCallback((results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      setDistance('No face detected');
      setDistanceColor('#6c757d');
      
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
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
      
      drawingUtils.drawLandmarks(ctx, landmarks, {
        color: 'rgba(74,215,168,0.2)',
        lineWidth: 0.5,
        radius: 0.5
      });
    }

    // Calculate distance
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

    // Eye tracking & Blink detection
    const leftEyeP1 = landmarks[33];
    const leftEyeP2 = landmarks[160];
    const leftEyeP3 = landmarks[159];
    const leftEyeP4 = landmarks[133];
    const leftEyeP5 = landmarks[145];
    const leftEyeP6 = landmarks[144];
    
    const rightEyeP1 = landmarks[362];
    const rightEyeP2 = landmarks[385];
    const rightEyeP3 = landmarks[386];
    const rightEyeP4 = landmarks[263];
    const rightEyeP5 = landmarks[374];
    const rightEyeP6 = landmarks[380];

    if (leftEyeP1 && leftEyeP2 && leftEyeP3 && leftEyeP4 && leftEyeP5 && leftEyeP6 &&
        rightEyeP1 && rightEyeP2 && rightEyeP3 && rightEyeP4 && rightEyeP5 && rightEyeP6) {
      
      const leftEAR = calculateEAR(leftEyeP1, leftEyeP2, leftEyeP3, leftEyeP4, leftEyeP5, leftEyeP6);
      const rightEAR = calculateEAR(rightEyeP1, rightEyeP2, rightEyeP3, rightEyeP4, rightEyeP5, rightEyeP6);
      
      // Use MINIMUM of both eyes (not average) - detects blink when either eye closes
      // Average EAR is displayed and used during open-eye calibration.
      const averageEAR = (leftEAR + rightEAR) / 2;
      setEarValue(averageEAR);

      // Run calibration if needed.
      if (!isCalibratedRef.current) {
        calibrateThreshold(averageEAR);

        const headPose = calculateHeadPose(landmarks);
        const postureResult = detectPosture(headPose, distanceCm);
        setPosture(postureResult.posture);
        setPostureScore(postureResult.score);
        return;
      }

      const currentThreshold = calibratedThresholdRef.current;

      // A blink begins only when BOTH eyes are below the threshold.
      // This prevents a wink or one unstable landmark from counting.
      const bothEyesClosed =
        leftEAR < currentThreshold && rightEAR < currentThreshold;

      if (bothEyesClosed) {
        closedFrameCountRef.current++;

        if (closedFrameCountRef.current >= BLINK_THRESHOLD_FRAMES) {
          eyeStateRef.current = "CLOSED";
          setEyeState("closed");
        }

        // Long closures are not counted as normal blinks.
        if (closedFrameCountRef.current > MAX_CLOSED_FRAMES) {
          invalidClosureRef.current = true;
        }
      } else {
        setEyeState("open");

        const validBlink =
          eyeStateRef.current === "CLOSED" &&
          !invalidClosureRef.current &&
          closedFrameCountRef.current >= BLINK_THRESHOLD_FRAMES &&
          closedFrameCountRef.current <= MAX_CLOSED_FRAMES;

        if (validBlink) {
          const now = Date.now();

          if (now - lastBlinkTimeRef.current > BLINK_COOLDOWN_MS) {
            blinkCountRef.current++;
            blinkRateCountRef.current++;
            setBlinkCount(blinkCountRef.current);
            lastBlinkTimeRef.current = now;
          }
        }

        eyeStateRef.current = "OPEN";
        closedFrameCountRef.current = 0;
        invalidClosureRef.current = false;
      }
    }

    const headPose = calculateHeadPose(landmarks);
    const postureResult = detectPosture(headPose, distanceCm);
    setPosture(postureResult.posture);
    setPostureScore(postureResult.score);
  }, [calculateEAR, calculateHeadPose, detectPosture, calibrateThreshold]);

  // ==================== STOP CAMERA ====================
  const stopCamera = useCallback(async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (faceMeshRef.current) {
      try {
        await faceMeshRef.current.close();
      } catch (e) {}
      faceMeshRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }

    setIsCameraActive(false);
    setStatus('Stopped');
    setSessionStart(null);
    setSessionTime(0);
    setFaceDetected(false);
    setBlinkRate(0);
    setDistance('-- cm');
    setDistanceColor('#6c757d');
    setEarValue(0);
    setEyeState('open');
    setCalibrationProgress(0);
    
    showToast('Camera stopped', 'info');
  }, [showToast]);

  // ==================== START CAMERA ====================
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setStatus("Starting...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user"
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        await new Promise((resolve) => {
          if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            resolve();
          } else {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });
      }

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

      const detect = async (timestamp) => {
        if (timestamp - lastFrameTimeRef.current >= FRAME_INTERVAL) {
          lastFrameTimeRef.current = timestamp;
          
          const video = videoRef.current;
          
          if (
            video &&
            faceMeshRef.current &&
            video.readyState === 4 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            try {
              await faceMeshRef.current.send({
                image: video
              });
            } catch (err) {}
          }
        }

        animationFrameRef.current = requestAnimationFrame(detect);
      };

      lastFrameTimeRef.current = 0;
      detect(0);

      setIsCameraActive(true);
      setStatus("Calibrating...");
      setSessionStart(Date.now());
      
      // Reset everything
      blinkCountRef.current = 0;
      blinkRateCountRef.current = 0;
      minuteStartRef.current = Date.now();
      eyeStateRef.current = "OPEN";
      closedFrameCountRef.current = 0;
      invalidClosureRef.current = false;
      lastBlinkTimeRef.current = 0;
      calibrationSamplesRef.current = [];
      calibratedThresholdRef.current = 0.16;
      isCalibratedRef.current = false;
      calibrationFrameCountRef.current = 0;
      setBlinkCount(0);
      setBlinkRate(0);
      setEarValue(0);
      setEyeState('open');
      setCalibrationProgress(0);
      
      showToast("Calibrating eye detection... Please look naturally at the camera", "info");
    } catch (error) {
      console.error("Camera error:", error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [onResults, showToast, handleError]);

  // ==================== UPDATE BLINK RATE ====================
  const updateBlinkRate = useCallback(() => {
    const now = Date.now();
    const elapsedSeconds = (now - minuteStartRef.current) / 1000;
    
    if (elapsedSeconds >= 1) {
      const rate = Math.round((blinkRateCountRef.current / elapsedSeconds) * 60);
      setBlinkRate(rate);
      
      if (isCalibratedRef.current) {
        if (rate < 8 && rate > 0) {
          showToast('Low blink rate! Remember to blink more often.', 'warning');
        } else if (rate > 25) {
          showToast('High blink rate! You might be tired.', 'warning');
        }
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, []);

  // ==================== SESSION TIMER ====================
  useEffect(() => {
    if (isCameraActive && sessionStart) {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
      
      sessionIntervalRef.current = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStart) / 1000));
        updateBlinkRate();
        
        const elapsedSeconds = (Date.now() - minuteStartRef.current) / 1000;
        if (elapsedSeconds >= 60) {
          resetBlinkRateCounter();
        }
      }, 1000);
    }
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
        sessionIntervalRef.current = null;
      }
    };
  }, [isCameraActive, sessionStart, updateBlinkRate, resetBlinkRateCounter]);

  // ==================== VISIBILITY HANDLER ====================
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isCameraActive) {
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          const allLive = tracks.every(t => t.readyState === 'live');
          if (!allLive) {
            await stopCamera();
            await startCamera();
          } else {
            setStatus(isCalibratedRef.current ? 'Running' : 'Calibrating...');
          }
        } else {
          await startCamera();
        }
      } else if (document.visibilityState === 'hidden' && isCameraActive) {
        setStatus('Background (paused)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCameraActive, startCamera, stopCamera]);

  // ==================== FORMAT TIME ====================
  const formatTime = useCallback((seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  // ==================== GET STATUS COLOR ====================
  const getStatusColor = useCallback(() => {
    if (status === 'Running') return '#4ad7a8';
    if (status === 'Error') return '#fc8181';
    if (status === 'Starting...' || status === 'Calibrating...') return '#ecc94b';
    return '#6c757d';
  }, [status]);

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
            {!isCalibratedRef.current && isCameraActive && (
              <span className="status-pill" style={{ background: 'rgba(236,201,75,0.2)', color: '#ecc94b' }}>
                <i className="fas fa-cog me-2"></i>Calibrating... {calibrationProgress}%
              </span>
            )}
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
                <p className="small-note mb-1">Blink Count</p>
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
                <p className="small-note mb-1">Face Distance</p>
                <strong style={{ color: distanceColor }}>{distance}</strong>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1">Posture</p>
                <strong>
                  {posture.charAt(0).toUpperCase() + posture.slice(1)} ({postureScore}%)
                </strong>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1">EAR Value</p>
                <strong>{earValue.toFixed(3)}</strong>
                <small className="d-block text-muted">Eye: {eyeState}</small>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="glass-card p-3">
                <p className="small-note mb-1">Threshold</p>
                <strong>{calibratedThresholdRef.current.toFixed(3)}</strong>
                <small className="d-block text-muted">
                  {isCalibratedRef.current ? 'Calibrated' : 'Calibrating...'}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="glass-card p-4 mb-4">
          <h5 className="mb-3">Health Summary</h5>
          
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
          <h5 className="mb-3">Real-time Tips</h5>
          <ul className="list-unstyled small-note mb-0">
            {!isCalibratedRef.current && isCameraActive && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                Calibrating... Please look naturally at the camera
              </li>
            )}
            {blinkRate < 12 && blinkRate > 0 && isCalibratedRef.current && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                Try to blink more often (target: 12-25 blinks/min)
              </li>
            )}
            {blinkRate > 25 && isCalibratedRef.current && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                High blink rate! You might be tired. Take a break.
              </li>
            )}
            {blinkRate >= 12 && blinkRate <= 25 && blinkRate > 0 && (
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
            {posture === 'good' && blinkRate >= 12 && blinkRate <= 25 && blinkRate > 0 && (
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