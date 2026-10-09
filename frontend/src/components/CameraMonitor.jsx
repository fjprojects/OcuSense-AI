import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import * as faceMesh from '@mediapipe/face_mesh';
import * as drawingUtils from '@mediapipe/drawing_utils';

const MODEL_VERSION = '0.4.1633559619';
const EAR_THRESHOLD = 0.18;
const BLINK_THRESHOLD = 2;

const calculateEAR = (upper, lower, inner, outer, aspect = 4 / 3) => {
  if (!upper || !lower || !inner || !outer) return 0;
  const vertical = Math.hypot((upper.x - lower.x) * aspect, upper.y - lower.y);
  const horizontal = Math.hypot((inner.x - outer.x) * aspect, inner.y - outer.y);
  return horizontal > 0 ? vertical / horizontal : 0;
};

const calculateHeadPose = landmarks => {
  const nose = landmarks[1], left = landmarks[33], right = landmarks[263];
  if (!nose || !left || !right) return { x: 0, y: 0, z: 0 };
  return {
    x: (nose.x - (left.x + right.x) / 2) * 100,
    y: (nose.y - (left.y + right.y) / 2) * 100,
    z: (left.y - right.y) * 100
  };
};

const detectPosture = (pose, distanceCm) => {
  let posture = 'good', score = 100;
  if (Math.abs(pose.x) > 15 || Math.abs(pose.y) > 15) { posture = 'poor'; score -= 30; }
  if (distanceCm !== null && distanceCm < 30) { posture = 'too_close'; score -= 30; }
  else if (distanceCm !== null && distanceCm > 60) { posture = 'too_far'; score -= 10; }
  return { posture, score: Math.max(0, score) };
};

const CameraMonitor = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState('Stopped');
  const [isLoading, setIsLoading] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkRate, setBlinkRate] = useState(0);
  const [distance, setDistance] = useState('-- cm');
  const [distanceColor, setDistanceColor] = useState('#6c757d');
  const [posture, setPosture] = useState('good');
  const [postureScore, setPostureScore] = useState(100);
  const [faceDetected, setFaceDetected] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const [calibrationDistance, setCalibrationDistance] = useState(50);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const frameRef = useRef(null);
  const generation = useRef(0);
  const isMounted = useRef(false);
  const active = useRef(false);
  const starting = useRef(false);
  const blinkCountRef = useRef(0);
  const blinkRateCountRef = useRef(0);
  const minuteStartRef = useRef(Date.now());
  const closedFrames = useRef(0);
  const faceSeen = useRef(false);
  const lastFaceWidth = useRef(null);
  const calibration = useRef(null);
  const { showToast } = useToast();

  const releaseResources = useCallback(() => {
    generation.current++;
    active.current = false;
    starting.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const model = faceMeshRef.current;
    faceMeshRef.current = null;
    if (model) {
      try { Promise.resolve(model.close()).catch(() => {}); } catch {}
    }
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = canvasRef.current;
    const context = canvas && canvas.getContext('2d');
    if (context) context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Only resource cleanup belongs to unmount; it must not depend on UI state or toasts.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      releaseResources();
    };
  }, [releaseResources]);

  const stopCamera = useCallback((notify = true) => {
    const wasRunning = active.current || starting.current;
    releaseResources();
    if (!isMounted.current) return;
    setIsCameraActive(false);
    setIsLoading(false);
    setStatus('Stopped');
    setSessionStart(null);
    setSessionTime(0);
    setFaceDetected(false);
    setBlinkRate(0);
    setDistance('-- cm');
    calibration.current = null;
    lastFaceWidth.current = null;
    if (wasRunning && notify) showToast('Camera stopped', 'info');
  }, [releaseResources, showToast]);

  const onResults = useCallback(results => {
    if (!isMounted.current || !active.current) return;
    const landmarks = results.multiFaceLandmarks && results.multiFaceLandmarks[0];
    if (!landmarks) {
      setFaceDetected(false);
      setDistance('No face detected');
      setDistanceColor('#6c757d');
      closedFrames.current = 0;
      lastFaceWidth.current = null;
      return;
    }
    faceSeen.current = true;
    setFaceDetected(true);
    const canvas = canvasRef.current;
    const context = canvas && canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawingUtils.drawConnectors(context, landmarks, faceMesh.FACEMESH_TESSELATION, { color: 'rgba(74,215,168,0.1)', lineWidth: 0.5 });
      drawingUtils.drawConnectors(context, landmarks, faceMesh.FACEMESH_RIGHT_EYE, { color: '#4ad7a8', lineWidth: 1.5 });
      drawingUtils.drawConnectors(context, landmarks, faceMesh.FACEMESH_LEFT_EYE, { color: '#4ad7a8', lineWidth: 1.5 });
      drawingUtils.drawConnectors(context, landmarks, faceMesh.FACEMESH_FACE_OVAL, { color: 'rgba(255,255,255,0.3)', lineWidth: 1 });
    }
    const leftCheek = landmarks[234], rightCheek = landmarks[454];
    const width = leftCheek && rightCheek ? Math.abs(rightCheek.x - leftCheek.x) : 0;
    lastFaceWidth.current = width > 0 ? width : null;
    let distanceCm = null;
    if (calibration.current && width > 0) {
      distanceCm = calibration.current.distance * calibration.current.width / width;
      setDistance(distanceCm.toFixed(1) + ' cm (estimate)');
      setDistanceColor(distanceCm < 30 ? '#fc8181' : distanceCm < 40 ? '#ecc94b' : '#4ad7a8');
    } else {
      setDistance('Calibrate distance');
      setDistanceColor('#6c757d');
    }
    const video = videoRef.current;
    const aspect = video && video.videoHeight ? video.videoWidth / video.videoHeight : 4 / 3;
    const leftEAR = calculateEAR(landmarks[159], landmarks[145], landmarks[133], landmarks[33], aspect);
    const rightEAR = calculateEAR(landmarks[386], landmarks[374], landmarks[362], landmarks[263], aspect);
    if (leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD) {
      closedFrames.current++;
    } else {
      if (leftEAR > EAR_THRESHOLD && rightEAR > EAR_THRESHOLD && closedFrames.current >= BLINK_THRESHOLD) {
        blinkCountRef.current++;
        blinkRateCountRef.current++;
        setBlinkCount(blinkCountRef.current);
      }
      closedFrames.current = 0;
    }
    const result = detectPosture(calculateHeadPose(landmarks), distanceCm);
    setPosture(result.posture);
    setPostureScore(result.score);
  }, []);

  const startCamera = useCallback(async () => {
    if (starting.current || active.current) return;
    starting.current = true;
    const token = ++generation.current;
    setIsLoading(true);
    setStatus('Starting...');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access requires a supported browser and HTTPS');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      if (!isMounted.current || token !== generation.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      if (!isMounted.current || token !== generation.current) return;
      const model = new faceMesh.FaceMesh({
        locateFile: file => 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@' + MODEL_VERSION + '/' + file
      });
      faceMeshRef.current = model;
      model.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      model.onResults(results => { if (token === generation.current) onResults(results); });
      if (model.initialize) await model.initialize();
      if (!isMounted.current || token !== generation.current) return;
      blinkCountRef.current = 0;
      blinkRateCountRef.current = 0;
      closedFrames.current = 0;
      faceSeen.current = false;
      minuteStartRef.current = Date.now();
      active.current = true;
      setIsCameraActive(true);
      setStatus('Running');
      setSessionStart(Date.now());
      setBlinkCount(0);
      setBlinkRate(0);

      const frame = async () => {
        if (!active.current || token !== generation.current) return;
        try {
          if (document.visibilityState !== 'hidden' && video.readyState >= 2) {
            await model.send({ image: video });
          }
          if (active.current && token === generation.current) frameRef.current = requestAnimationFrame(frame);
        } catch {
          if (token === generation.current && isMounted.current) {
            stopCamera(false);
            setStatus('Error');
            showToast('Face tracking failed. Restart the camera to try again.', 'error');
          }
        }
      };
      frameRef.current = requestAnimationFrame(frame);
      showToast('Camera started successfully!', 'success');
    } catch (error) {
      if (token === generation.current && isMounted.current) {
        releaseResources();
        setIsCameraActive(false);
        setIsLoading(false);
        setStatus('Error');
        const message = error.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access.' :
          error.name === 'NotFoundError' ? 'No camera found. Please connect a camera.' : error.message;
        showToast(message, 'error');
      }
    } finally {
      if (token === generation.current && isMounted.current) {
        starting.current = false;
        setIsLoading(false);
      }
    }
  }, [onResults, releaseResources, showToast, stopCamera]);

  useEffect(() => {
    if (!isCameraActive || !sessionStart) return;
    const timer = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStart) / 1000));
      const elapsed = (Date.now() - minuteStartRef.current) / 1000;
      const rate = elapsed > 0 ? Math.round(blinkRateCountRef.current * 60 / elapsed) : 0;
      setBlinkRate(rate);
      if (elapsed >= 60) {
        if (faceSeen.current && document.visibilityState === 'visible' && rate < 8) {
          showToast('Low blink rate. Remember to blink and take a break.', 'warning');
        }
        blinkRateCountRef.current = 0;
        minuteStartRef.current = Date.now();
        faceSeen.current = false;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCameraActive, sessionStart, showToast]);

  useEffect(() => {
    const changed = () => {
      if (!active.current) return;
      if (document.visibilityState === 'hidden') {
        setStatus('Background (paused)');
      } else {
        minuteStartRef.current = Date.now();
        blinkRateCountRef.current = 0;
        if (streamRef.current && streamRef.current.getTracks().every(track => track.readyState === 'live')) {
          setStatus('Running');
        } else {
          stopCamera(false);
          startCamera();
        }
      }
    };
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, [startCamera, stopCamera]);

  const calibrateDistance = () => {
    if (!lastFaceWidth.current) { showToast('Start the camera and face it before calibrating', 'info'); return; }
    const knownDistance = Number(calibrationDistance);
    if (!Number.isFinite(knownDistance) || knownDistance < 10 || knownDistance > 200) {
      showToast('Enter a measured distance between 10 and 200 cm', 'error');
      return;
    }
    calibration.current = { width: lastFaceWidth.current, distance: knownDistance };
    showToast('Distance calibrated. Keep the same camera and head position for estimates.', 'success');
  };

  const formatTime = seconds => {
    const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
    return [h, m, s].map(value => String(value).padStart(2, '0')).join(':');
  };
  const getStatusColor = () => status === 'Running' ? '#4ad7a8' : status === 'Error' ? '#fc8181' :
    status === 'Starting...' ? '#ecc94b' : '#6c757d';

  const hasMetrics = isCameraActive && faceDetected;
  const rateColor = !hasMetrics ? '#9aaebf' : blinkRate >= 12 && blinkRate <= 25 ? '#4ad7a8' : blinkRate > 8 ? '#ecc94b' : '#fc8181';

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
              <p className="small-note mb-0">Track blinks and calibrate a measured distance for distance estimates.</p>
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

        <div className="glass-card p-3 mb-4">
          <label htmlFor="camera-calibration" className="small-note">Measured distance from your camera (cm)</label>
          <div className="d-flex gap-2 mt-2">
            <input id="camera-calibration" type="number" min="10" max="200"
              className="form-control" style={{ maxWidth: '120px' }} value={calibrationDistance}
              onChange={event => setCalibrationDistance(event.target.value)} />
            <button className="btn btn-outline-light" onClick={calibrateDistance} disabled={!faceDetected}>
              Calibrate distance
            </button>
          </div>
          <p className="small-note mb-0 mt-2">Measure your current distance, enter it, and calibrate while facing the camera.
            Estimates depend on camera position and head angle.</p>
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
                <strong style={{ color: rateColor }}>
                  {hasMetrics ? blinkRate : '--'} / min
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
                  {hasMetrics ? posture.charAt(0).toUpperCase() + posture.slice(1) + ' (' + postureScore + '%)' : 'Waiting for a face'}
                </strong>
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
              <span style={{ color: rateColor }}>
                {hasMetrics ? blinkRate : '--'} / min
              </span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div className="progress-bar" style={{ 
                width: `${hasMetrics ? Math.min(100, (blinkRate / 25) * 100) : 0}%`,
                background: blinkRate >= 12 && blinkRate <= 25 ? '#4ad7a8' : '#ecc94b'
              }}></div>
            </div>
            <small className="text-muted">Target: 12-25 blinks/min</small>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between">
              <span className="small-note">Posture</span>
              <span style={{ color: !hasMetrics ? '#9aaebf' : postureScore > 80 ? '#4ad7a8' : '#ecc94b' }}>
                {hasMetrics ? postureScore + '%' : '--'}
              </span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div className="progress-bar" style={{ 
                width: `${hasMetrics ? postureScore : 0}%`,
                background: postureScore > 80 ? '#4ad7a8' : '#ecc94b'
              }}></div>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3">Real-time Tips</h5>
          <ul className="list-unstyled small-note mb-0">
            {!hasMetrics && <li>Start the camera and keep your face in view to see tracking tips.</li>}
            {hasMetrics && blinkRate < 12 && blinkRate > 0 && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                Try to blink more often (target: 12-25 blinks/min)
              </li>
            )}
            {hasMetrics && blinkRate > 25 && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                High blink rate! You might be tired. Take a break.
              </li>
            )}
            {hasMetrics && blinkRate >= 12 && blinkRate <= 25 && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#4ad7a8' }}></i>
                Great blink rate! Keep it up!
              </li>
            )}
            {hasMetrics && posture === 'too_close' && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#fc8181' }}></i>
                Move back from the screen (ideal: 40-60 cm)
              </li>
            )}
            {hasMetrics && posture === 'poor' && (
              <li className="mb-2">
                <i className="fas fa-circle text-accent me-2" style={{ color: '#ecc94b' }}></i>
                Straighten your posture for better ergonomics
              </li>
            )}
            {posture === 'good' && hasMetrics && blinkRate >= 12 && blinkRate <= 25 && (
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
