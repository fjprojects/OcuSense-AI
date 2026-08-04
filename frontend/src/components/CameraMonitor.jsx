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

  // Blink detector debugging
  const [showBlinkDebug, setShowBlinkDebug] = useState(false);
  const [leftEarDebug, setLeftEarDebug] = useState(0);
  const [rightEarDebug, setRightEarDebug] = useState(0);
  const [blinkDetectorState, setBlinkDetectorState] = useState("OPEN");
  const [lastClosureDuration, setLastClosureDuration] = useState(0);
  const [lastBlinkDecision, setLastBlinkDecision] = useState("Waiting");
  const [lastBlinkConfidence, setLastBlinkConfidence] = useState(0);
  
  // Distance & posture
  const [distance, setDistance] = useState('-- cm');
  const [distanceColor, setDistanceColor] = useState('#6c757d');
  const [isDistanceCalibrated, setIsDistanceCalibrated] = useState(
    () => Boolean(localStorage.getItem("ocusenseFaceWidthAt50Cm"))
  );
  const [isDistanceCalibrating, setIsDistanceCalibrating] = useState(false);
  const [distanceCalibrationCountdown, setDistanceCalibrationCountdown] =
    useState(0);
  const [distanceCalibrationProgress, setDistanceCalibrationProgress] =
    useState(0);
  const [distanceCalibrationQuality, setDistanceCalibrationQuality] =
    useState(
      () => localStorage.getItem("ocusenseDistanceCalibrationQuality") || "None"
    );
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
  const alertAudioRef = useRef(null);
  const sessionStartRef = useRef(null);
  const postureTotalRef = useRef(0);
  const postureSampleCountRef = useRef(0);
  const warningCountsRef = useRef({
    distance: 0,
    lowBlink: 0
  });

  // Personalized distance calibration
  const currentFaceWidthRef = useRef(null);
  const calibratedFaceWidthRef = useRef(
    Number(localStorage.getItem("ocusenseFaceWidthAt50Cm")) || null
  );
  const distanceCalibrationSamplesRef = useRef([]);
  const distanceCalibrationActiveRef = useRef(false);
  const DISTANCE_CALIBRATION_CM = 50;
  const DISTANCE_CALIBRATION_SAMPLE_COUNT = 45;

  // Prevent temporary landmark loss from instantly changing the UI
  const noFaceFrameCountRef = useRef(0);
  const NO_FACE_GRACE_FRAMES = 30;

  // Each warning tracks when the issue started and when it was last shown.
  const alertStateRef = useRef({
    noFace: { since: null, lastShown: 0 },
    tooClose: { since: null, lastShown: 0 },
    poorPosture: { since: null, lastShown: 0 },
    lowBlinkRate: { since: null, lastShown: 0 },
    highBlinkRate: { since: null, lastShown: 0 }
  });

  const { showToast } = useToast();
  
  // ==================== BLINK DETECTION REFS ====================
  const blinkCountRef = useRef(0);
  const blinkRateCountRef = useRef(0);
  const minuteStartRef = useRef(Date.now());
  const eyeStateRef = useRef("OPEN");
  const closedFrameCountRef = useRef(0);
  const invalidClosureRef = useRef(false);
  const lastBlinkTimeRef = useRef(0);

  // More reliable blink detection
  const closureStartTimeRef = useRef(null);
  const smoothedLeftEarRef = useRef(null);
  const smoothedRightEarRef = useRef(null);
  
  // Calibration refs
  const calibrationSamplesRef = useRef([]);
  const calibratedThresholdRef = useRef(0.16);
  const isCalibratedRef = useRef(false);
  const calibrationFrameCountRef = useRef(0);
  const CALIBRATION_FRAMES = 90; // 3 seconds at 30fps
  const MIN_EAR_FOR_CALIBRATION = 0.20; // Ignore samples below this (likely blinks)
  
  // Blink timing and smoothing
  const EAR_SMOOTHING_ALPHA = 0.65;
  const MIN_BLINK_DURATION_MS = 55;
  const MAX_BLINK_DURATION_MS = 650;
  const BLINK_COOLDOWN_MS = 140;
  const REOPEN_THRESHOLD_MULTIPLIER = 1.05;
  
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

  // ==================== SMOOTH EAR VALUES ====================
  const getSmoothedEAR = useCallback((earRef, value) => {
    if (earRef.current === null) {
      earRef.current = value;
      return value;
    }

    earRef.current =
      EAR_SMOOTHING_ALPHA * value +
      (1 - EAR_SMOOTHING_ALPHA) * earRef.current;

    return earRef.current;
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

  // ==================== ALERT SOUND ====================
  const playAlertSound = useCallback(() => {
    try {
      if (!alertAudioRef.current) {
        alertAudioRef.current = new Audio("/static/alert.mp3");
        alertAudioRef.current.volume = 0.65;
      }

      alertAudioRef.current.currentTime = 0;

      alertAudioRef.current.play().catch(() => {
        // Browser may block audio before user interaction.
      });
    } catch (error) {
      console.warn("Alert sound could not play:", error);
    }
  }, []);

  // ==================== SMART ALERT CONTROL ====================
  const triggerSmartAlert = useCallback((
    key,
    isProblemActive,
    holdDurationMs,
    cooldownMs,
    message,
    type = "warning",
    playSound = false
  ) => {
    const alert = alertStateRef.current[key];

    if (!alert) return;

    const now = Date.now();

    if (!isProblemActive) {
      alert.since = null;
      return;
    }

    if (alert.since === null) {
      alert.since = now;
      return;
    }

    const issueDuration = now - alert.since;
    const cooldownFinished = now - alert.lastShown >= cooldownMs;

    if (issueDuration >= holdDurationMs && cooldownFinished) {
      if (key === "tooClose") {
        warningCountsRef.current.distance += 1;
      }

      if (key === "lowBlinkRate") {
        warningCountsRef.current.lowBlink += 1;
      }

      showToast(message, type);

      if (playSound) {
        playAlertSound();
      }

      alert.lastShown = now;

      // Require the issue to persist again before another warning.
      alert.since = now;
    }
  }, [showToast, playAlertSound]);

  // ==================== CALIBRATE FACE DISTANCE ====================
  const calibrateDistance = useCallback(async () => {
    if (!isCameraActive || !faceDetected || !currentFaceWidthRef.current) {
      showToast(
        "Start the camera and keep your full face visible first.",
        "warning"
      );
      return;
    }

    if (isDistanceCalibrating) return;

    setIsDistanceCalibrating(true);
    setDistanceCalibrationProgress(0);
    setDistanceCalibrationQuality("Preparing");

    distanceCalibrationSamplesRef.current = [];
    distanceCalibrationActiveRef.current = false;

    showToast(
      "Sit about 50 cm away and face the camera directly.",
      "info"
    );

    for (let seconds = 3; seconds >= 1; seconds--) {
      setDistanceCalibrationCountdown(seconds);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setDistanceCalibrationCountdown(0);
    distanceCalibrationActiveRef.current = true;
  }, [
    isCameraActive,
    faceDetected,
    isDistanceCalibrating,
    showToast
  ]);

  const resetDistanceCalibration = useCallback(() => {
    calibratedFaceWidthRef.current = null;
    currentFaceWidthRef.current = null;

    distanceCalibrationSamplesRef.current = [];
    distanceCalibrationActiveRef.current = false;

    localStorage.removeItem("ocusenseFaceWidthAt50Cm");
    localStorage.removeItem("ocusenseDistanceCalibrationQuality");

    setIsDistanceCalibrated(false);
    setIsDistanceCalibrating(false);
    setDistanceCalibrationCountdown(0);
    setDistanceCalibrationProgress(0);
    setDistanceCalibrationQuality("None");

    showToast("Distance calibration removed.", "info");
  }, [showToast]);

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
      noFaceFrameCountRef.current++;

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }

      // Wait briefly because MediaPipe can lose landmarks for a few frames.
      if (noFaceFrameCountRef.current >= NO_FACE_GRACE_FRAMES) {
        setFaceDetected(false);
        setDistance("No face detected");
        setDistanceColor("#6c757d");
        setPosture("unknown");
        setPostureScore(0);
        setEarValue(0);
        setEyeState("open");

        eyeStateRef.current = "OPEN";
        closedFrameCountRef.current = 0;
        invalidClosureRef.current = false;

        triggerSmartAlert(
          "noFace",
          true,
          3000,
          30000,
          "Face not detected. Please sit inside the camera frame.",
          "warning",
          true
        );
      }

      return;
    }

    // Face returned, so clear the missing-face counter.
    noFaceFrameCountRef.current = 0;

    triggerSmartAlert(
      "noFace",
      false,
      3000,
      30000,
      ""
    );

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

    // Calculate personalized face distance
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    let distanceCm = 45;

    if (leftCheek && rightCheek) {
      const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
      currentFaceWidthRef.current = faceWidth;

      if (
        distanceCalibrationActiveRef.current &&
        faceWidth > 0
      ) {
        distanceCalibrationSamplesRef.current.push(faceWidth);

        const sampleCount =
          distanceCalibrationSamplesRef.current.length;

        setDistanceCalibrationProgress(
          Math.min(
            100,
            Math.round(
              (sampleCount / DISTANCE_CALIBRATION_SAMPLE_COUNT) * 100
            )
          )
        );

        if (sampleCount >= DISTANCE_CALIBRATION_SAMPLE_COUNT) {
          distanceCalibrationActiveRef.current = false;

          const samples = [
            ...distanceCalibrationSamplesRef.current
          ].sort((a, b) => a - b);

          const median =
            samples[Math.floor(samples.length / 2)];

          const mean =
            samples.reduce((sum, value) => sum + value, 0) /
            samples.length;

          const variance =
            samples.reduce(
              (sum, value) => sum + Math.pow(value - mean, 2),
              0
            ) / samples.length;

          const standardDeviation = Math.sqrt(variance);
          const variationRatio =
            mean > 0 ? standardDeviation / mean : 1;

          if (variationRatio <= 0.035) {
            calibratedFaceWidthRef.current = median;

            localStorage.setItem(
              "ocusenseFaceWidthAt50Cm",
              String(median)
            );

            localStorage.setItem(
              "ocusenseDistanceCalibrationQuality",
              "Good"
            );

            setIsDistanceCalibrated(true);
            setDistanceCalibrationQuality("Good");

            showToast(
              "Distance calibration completed successfully.",
              "success"
            );
          } else {
            setDistanceCalibrationQuality("Poor");

            showToast(
              "Calibration was unstable. Keep your head still and try again.",
              "warning"
            );
          }

          setIsDistanceCalibrating(false);
          setDistanceCalibrationProgress(100);
          distanceCalibrationSamplesRef.current = [];
        }
      }

      if (
        calibratedFaceWidthRef.current &&
        calibratedFaceWidthRef.current > 0 &&
        faceWidth > 0
      ) {
        // Face width is approximately inversely proportional to distance.
        distanceCm =
          DISTANCE_CALIBRATION_CM *
          (calibratedFaceWidthRef.current / faceWidth);
      } else {
        // Temporary estimate until the user performs calibration.
        distanceCm = 30 + (1 - faceWidth) * 50;
      }

      distanceCm = Math.max(20, Math.min(100, distanceCm));

      setDistance(
        `${distanceCm.toFixed(1)} cm${
          calibratedFaceWidthRef.current ? "" : " (estimate)"
        }`
      );

      if (distanceCm < 35) {
        setDistanceColor("#fc8181");
      } else if (distanceCm < 40 || distanceCm > 70) {
        setDistanceColor("#ecc94b");
      } else {
        setDistanceColor("#4ad7a8");
      }

      triggerSmartAlert(
        "tooClose",
        distanceCm < 35,
        7000,
        120000,
        "You have been too close to the screen. Move back to about 40?60 cm.",
        "warning",
        true
      );
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
      // Smooth each eye separately to reduce landmark vibration.
      const smoothedLeftEAR = getSmoothedEAR(
        smoothedLeftEarRef,
        leftEAR
      );

      const smoothedRightEAR = getSmoothedEAR(
        smoothedRightEarRef,
        rightEAR
      );

      const averageEAR =
        (smoothedLeftEAR + smoothedRightEAR) / 2;

      setEarValue(averageEAR);
      setLeftEarDebug(smoothedLeftEAR);
      setRightEarDebug(smoothedRightEAR);

      // Calibrate only using stable open-eye readings.
      if (!isCalibratedRef.current) {
        calibrateThreshold(averageEAR);

        const headPose = calculateHeadPose(landmarks);
        const postureResult = detectPosture(headPose, distanceCm);
        setPosture(postureResult.posture);
        setPostureScore(postureResult.score);
        return;
      }

      const closeThreshold = calibratedThresholdRef.current;
      const reopenThreshold =
        closeThreshold * REOPEN_THRESHOLD_MULTIPLIER;

      const bothEyesClosed =
        smoothedLeftEAR < closeThreshold &&
        smoothedRightEAR < closeThreshold;

      const bothEyesReopened =
        smoothedLeftEAR > reopenThreshold &&
        smoothedRightEAR > reopenThreshold;

      const now = performance.now();

      if (bothEyesClosed) {
        if (eyeStateRef.current === "OPEN") {
          eyeStateRef.current = "CLOSING";
          closureStartTimeRef.current = now;

          setBlinkDetectorState("CLOSING");
          setLastBlinkDecision("Possible blink");
        }

        const closedDuration =
          closureStartTimeRef.current === null
            ? 0
            : now - closureStartTimeRef.current;

        if (closedDuration >= MIN_BLINK_DURATION_MS) {
          eyeStateRef.current = "CLOSED";
          setEyeState("closed");
          setBlinkDetectorState("CLOSED");
          setLastClosureDuration(Math.round(closedDuration));
        }

        if (closedDuration > MAX_BLINK_DURATION_MS) {
          invalidClosureRef.current = true;
          setLastBlinkDecision("Rejected: closure too long");
          setLastBlinkConfidence(0);
        }
      } else if (bothEyesReopened) {
        const closedDuration =
          closureStartTimeRef.current === null
            ? 0
            : now - closureStartTimeRef.current;

        const durationScore =
          closedDuration >= MIN_BLINK_DURATION_MS &&
          closedDuration <= MAX_BLINK_DURATION_MS
            ? 50
            : 0;

        const leftClosureScore =
          smoothedLeftEAR < closeThreshold ? 25 : 0;

        const rightClosureScore =
          smoothedRightEAR < closeThreshold ? 25 : 0;

        const confidence =
          durationScore +
          leftClosureScore +
          rightClosureScore;

        setLastClosureDuration(Math.round(closedDuration));
        setLastBlinkConfidence(confidence);

        const validBlink =
          eyeStateRef.current === "CLOSED" &&
          !invalidClosureRef.current &&
          closedDuration >= MIN_BLINK_DURATION_MS &&
          closedDuration <= MAX_BLINK_DURATION_MS;

        if (
          validBlink &&
          Date.now() - lastBlinkTimeRef.current >= BLINK_COOLDOWN_MS
        ) {
          blinkCountRef.current++;
          blinkRateCountRef.current++;

          setBlinkCount(blinkCountRef.current);

          const elapsedSeconds =
            (Date.now() - minuteStartRef.current) / 1000;

          if (elapsedSeconds > 0) {
            setBlinkRate(
              Math.round(
                (blinkRateCountRef.current / elapsedSeconds) * 60
              )
            );
          }

          lastBlinkTimeRef.current = Date.now();

          setLastBlinkDecision("Accepted blink");
          setBlinkDetectorState("OPEN");
        } else {
          if (invalidClosureRef.current) {
            setLastBlinkDecision("Rejected: long closure");
          } else if (closedDuration < MIN_BLINK_DURATION_MS) {
            setLastBlinkDecision("Rejected: too fast");
          } else if (closedDuration > MAX_BLINK_DURATION_MS) {
            setLastBlinkDecision("Rejected: too slow");
          } else {
            setLastBlinkDecision("Rejected: incomplete closure");
          }
        }

        eyeStateRef.current = "OPEN";
        closureStartTimeRef.current = null;
        invalidClosureRef.current = false;
        setEyeState("open");
      }
    }

    const headPose = calculateHeadPose(landmarks);
    const postureResult = detectPosture(headPose, distanceCm);
    setPosture(postureResult.posture);
    setPostureScore(postureResult.score);
    postureTotalRef.current += postureResult.score;
    postureSampleCountRef.current += 1;

    triggerSmartAlert(
      "poorPosture",
      postureResult.posture === "poor",
      8000,
      120000,
      "Poor head position detected. Straighten your neck and face the screen."
    );
  }, [
    calculateEAR,
    getSmoothedEAR,
    calculateHeadPose,
    detectPosture,
    calibrateThreshold,
    triggerSmartAlert
  ]);

  // ==================== SAVE MONITORING SESSION ====================
  const saveMonitoringSession = useCallback(async () => {
    const startedAt = sessionStartRef.current;

    if (!startedAt) return;

    const endedAt = Date.now();
    const durationSeconds = Math.max(
      1,
      Math.floor((endedAt - startedAt) / 1000)
    );

    const averageBlinkRate =
      durationSeconds > 0
        ? (blinkCountRef.current / durationSeconds) * 60
        : 0;

    const averagePostureScore =
      postureSampleCountRef.current > 0
        ? postureTotalRef.current / postureSampleCountRef.current
        : 0;

    const response = await fetch("/api/sessions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        duration_seconds: durationSeconds,
        total_blinks: blinkCountRef.current,
        average_blink_rate: Number(averageBlinkRate.toFixed(2)),
        average_posture_score: Number(averagePostureScore.toFixed(2)),
        distance_warnings: warningCountsRef.current.distance,
        low_blink_warnings: warningCountsRef.current.lowBlink,
        started_at: new Date(startedAt).toISOString(),
        ended_at: new Date(endedAt).toISOString()
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Could not save monitoring session");
    }
  }, []);

  // ==================== STOP CAMERA ====================
  const stopCamera = useCallback(async () => {
    if (sessionStartRef.current) {
      try {
        await saveMonitoringSession();
        showToast("Monitoring session saved", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    }

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
    sessionStartRef.current = null;
    setSessionTime(0);
    noFaceFrameCountRef.current = 0;
    setFaceDetected(false);
    setBlinkRate(0);
    setDistance('-- cm');
    setDistanceColor('#6c757d');
    setEarValue(0);
    setEyeState('open');
    setCalibrationProgress(0);
    
    showToast('Camera stopped', 'info');
  }, [saveMonitoringSession, showToast]);

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

      const startedAt = Date.now();
      setIsCameraActive(true);
      setStatus("Calibrating...");
      setSessionStart(startedAt);
      sessionStartRef.current = startedAt;
      postureTotalRef.current = 0;
      postureSampleCountRef.current = 0;
      warningCountsRef.current = {
        distance: 0,
        lowBlink: 0
      };
      
      // Reset everything
      blinkCountRef.current = 0;
      blinkRateCountRef.current = 0;
      minuteStartRef.current = Date.now();
      eyeStateRef.current = "OPEN";
      closedFrameCountRef.current = 0;
      invalidClosureRef.current = false;
      closureStartTimeRef.current = null;
      smoothedLeftEarRef.current = null;
      smoothedRightEarRef.current = null;
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

      setLeftEarDebug(0);
      setRightEarDebug(0);
      setBlinkDetectorState("OPEN");
      setLastClosureDuration(0);
      setLastBlinkDecision("Waiting");
      setLastBlinkConfidence(0);

      Object.values(alertStateRef.current).forEach((alert) => {
        alert.since = null;
      });
      
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
      
      // Do not judge blink rate from only a few initial seconds.
      const enoughRateData = elapsedSeconds >= 20;

      triggerSmartAlert(
        "lowBlinkRate",
        isCalibratedRef.current &&
          enoughRateData &&
          rate > 0 &&
          rate < 8,
        10000,
        180000,
        "Your blink rate has remained low. Blink naturally or take a short eye break.",
        "warning",
        true
      );

      triggerSmartAlert(
        "highBlinkRate",
        isCalibratedRef.current &&
          enoughRateData &&
          rate > 25,
        10000,
        180000,
        "Your blink rate has remained high. Eye irritation or tiredness may be affecting you.",
        "warning",
        true
      );
    }
  }, [triggerSmartAlert]);

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

              <button
                className="btn btn-outline-light"
                onClick={calibrateDistance}
                disabled={
                  !isCameraActive ||
                  !faceDetected ||
                  isDistanceCalibrating
                }
                title="Sit approximately 50 cm from the screen and face forward"
              >
                <i className="fas fa-ruler me-2"></i>
                {isDistanceCalibrating
                  ? distanceCalibrationCountdown > 0
                    ? `Starting in ${distanceCalibrationCountdown}`
                    : `Calibrating ${distanceCalibrationProgress}%`
                  : "Calibrate 50 cm"}
              </button>

              {isDistanceCalibrated && (
                <button
                  className="btn btn-outline-warning"
                  onClick={resetDistanceCalibration}
                  disabled={isCameraActive}
                  title="Stop the camera before resetting calibration"
                >
                  Reset distance
                </button>
              )}

              <button
                className="btn btn-outline-info"
                onClick={() => setShowBlinkDebug((value) => !value)}
              >
                <i className="fas fa-bug me-2"></i>
                {showBlinkDebug ? "Hide debug" : "Blink debug"}
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

        {showBlinkDebug && (
          <div className="glass-card p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">Blink Detection Debug</h5>
                <p className="small-note mb-0">
                  Use this only while testing blink accuracy.
                </p>
              </div>

              <span className="status-pill">
                {blinkDetectorState}
              </span>
            </div>

            <div className="row g-3">
              <div className="col-md-3">
                <div className="glass-card p-3">
                  <p className="small-note mb-1">Left EAR</p>
                  <strong>{leftEarDebug.toFixed(3)}</strong>
                </div>
              </div>

              <div className="col-md-3">
                <div className="glass-card p-3">
                  <p className="small-note mb-1">Right EAR</p>
                  <strong>{rightEarDebug.toFixed(3)}</strong>
                </div>
              </div>

              <div className="col-md-3">
                <div className="glass-card p-3">
                  <p className="small-note mb-1">Close Threshold</p>
                  <strong>
                    {calibratedThresholdRef.current.toFixed(3)}
                  </strong>
                </div>
              </div>

              <div className="col-md-3">
                <div className="glass-card p-3">
                  <p className="small-note mb-1">Reopen Threshold</p>
                  <strong>
                    {(
                      calibratedThresholdRef.current *
                      REOPEN_THRESHOLD_MULTIPLIER
                    ).toFixed(3)}
                  </strong>
                </div>
              </div>

              <div className="col-md-4">
                <div className="glass-card p-3">
                  <p className="small-note mb-1">
                    Last Closure Duration
                  </p>
                  <strong>{lastClosureDuration} ms</strong>
                </div>
              </div>

              <div className="col-md-4">
                <div className="glass-card p-3">
                  <p className="small-note mb-1">
                    Last Decision
                  </p>
                  <strong>{lastBlinkDecision}</strong>
                </div>
              </div>

              <div className="col-md-4">
                <div className="glass-card p-3">
                  <p className="small-note mb-1">
                    Confidence
                  </p>
                  <strong>{lastBlinkConfidence}%</strong>

                  <div className="progress mt-2" style={{ height: "6px" }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${lastBlinkConfidence}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <small className="d-block text-muted">
                  {isDistanceCalibrating
                    ? `Calibration ${distanceCalibrationProgress}%`
                    : isDistanceCalibrated
                    ? `Personalized calibration ? ${distanceCalibrationQuality}`
                    : "Uncalibrated estimate"}
                </small>
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