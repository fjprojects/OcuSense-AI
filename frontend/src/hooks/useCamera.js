import { useState, useRef, useEffect, useCallback } from 'react';

export const useCamera = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Stopped');
  const [blinkCount, setBlinkCount] = useState(0);
  const [distance, setDistance] = useState('-- cm');
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalsRef = useRef({});
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive) {
        // Tab became visible - check if camera still works
        console.log('🔙 Tab visible, checking camera...');
        
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          const allLive = tracks.every(t => t.readyState === 'live');
          
          if (!allLive) {
            console.log('🔄 Camera tracks dead, restarting...');
            await restartCamera();
          } else {
            console.log('✅ Camera still active');
            setStatus('Running');
          }
        } else {
          console.log('🔄 No stream, restarting...');
          await restartCamera();
        }
      } else if (document.visibilityState === 'hidden' && isActive) {
        console.log('📱 Tab in background');
        setStatus('Background (paused)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  const start = useCallback(async () => {
    try {
      setStatus('Starting...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsActive(true);
      setStatus('Running');
      setBlinkCount(0);
      reconnectAttempts.current = 0;
      
      startDetection();
      
      return { success: true };
    } catch (err) {
      setError(err);
      setStatus('Error');
      setIsActive(false);
      return { success: false, error: err };
    }
  }, []);

  const stop = useCallback(() => {
    // Clear intervals
    Object.values(intervalsRef.current).forEach(interval => clearInterval(interval));
    intervalsRef.current = {};

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setStatus('Stopped');
    setBlinkCount(0);
    setDistance('-- cm');
    reconnectAttempts.current = 0;
  }, []);

  const restartCamera = useCallback(async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setStatus('Connection failed');
      return;
    }

    reconnectAttempts.current++;
    setStatus(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);

    try {
      // Stop current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));

      // Restart
      const result = await start();
      if (result.success) {
        reconnectAttempts.current = 0;
        console.log('✅ Reconnection successful');
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        setTimeout(() => restartCamera(), 2000);
      } else {
        setStatus('Connection failed');
      }
    }
  }, [start, maxReconnectAttempts]);

  const startDetection = useCallback(() => {
    let isBlinking = false;
    let blinkCount = 0;
    let lastBlinkTime = Date.now();

    // Blink detection
    intervalsRef.current.blink = setInterval(() => {
      if (!isActive) return;
      
      const shouldBlink = Math.random() < 0.3;
      if (shouldBlink && !isBlinking) {
        isBlinking = true;
        blinkCount++;
        setBlinkCount(blinkCount);
        
        // Update blink rate
        const now = Date.now();
        const timeDiff = (now - lastBlinkTime) / 1000;
        if (timeDiff > 0) {
          const rate = Math.round(60 / timeDiff);
          // Could store blink rate in state
        }
        lastBlinkTime = now;
        
        setTimeout(() => { isBlinking = false; }, 200);
      }
    }, 2000);

    // Distance monitoring
    intervalsRef.current.distance = setInterval(() => {
      if (!isActive) return;
      
      const dist = 25 + Math.random() * 35;
      setDistance(`${dist.toFixed(1)} cm`);
    }, 3000);
  }, [isActive]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    isActive,
    status,
    blinkCount,
    distance,
    error,
    start,
    stop,
    restartCamera
  };
};