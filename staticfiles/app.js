/* =========================
   OCUSENSE ARENA - COMPLETE APP.JS
   MATCHES YOUR DJANGO TEMPLATES
   ========================= */

// ==================== CAMERA CONTROLLER ====================
const CameraController = {
    currentStream: null,
    isCameraActive: false,
    isTabVisible: true,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectTimeout: null,
    isReconnecting: false,
    blinkCount: 0,
    distanceValue: 0,
    blinkInterval: null,

    elements: {},

    init() {
        // Get DOM elements - MATCHING YOUR TEMPLATES
        this.elements = {
            startBtn: document.getElementById('startCameraButton'),
            video: document.getElementById('cameraVideo'),
            statusEl: document.getElementById('cameraStatus'),
            blinkCount: document.getElementById('blinkCount'),
            distanceValue: document.getElementById('distanceValue')
        };

        // Check critical elements
        if (!this.elements.startBtn || !this.elements.video) {
            console.error('❌ Camera elements not found');
            return;
        }

        // Setup
        this.setupEventListeners();
        this.setupVisibilityListener();

        // Set initial status
        this.updateStatus('Stopped', '#6c757d');

        console.log('✅ Camera module initialized');
    },

    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => {
            if (this.isCameraActive) {
                this.stopCamera();
            } else {
                this.startCamera();
            }
        });
    },

    setupVisibilityListener() {
        document.addEventListener('visibilitychange', async () => {
            this.isTabVisible = document.visibilityState === 'visible';
            
            if (this.isTabVisible && this.isCameraActive) {
                console.log('🔙 Tab visible, checking camera...');
                
                if (this.currentStream) {
                    const tracks = this.currentStream.getTracks();
                    const allLive = tracks.every(t => t.readyState === 'live');
                    
                    if (!allLive) {
                        console.log('🔄 Camera dead, restarting...');
                        await this.restartCamera();
                    } else {
                        console.log('✅ Camera still alive');
                        this.updateStatus('Running', '#4ad7a8');
                    }
                } else {
                    console.log('🔄 No stream, restarting...');
                    await this.restartCamera();
                }
            } else if (!this.isTabVisible && this.isCameraActive) {
                console.log('📱 Tab in background');
                this.updateStatus('Background (paused)', '#ecc94b');
            }
        });
    },

    async startCamera() {
        try {
            if (this.isCameraActive && this.currentStream) {
                console.log('⚠️ Camera already running');
                return;
            }

            if (this.isReconnecting) {
                console.log('⏳ Already reconnecting');
                return;
            }

            console.log('🚀 Starting camera...');
            this.updateStatus('Starting...', '#ecc94b');

            if (this.currentStream) {
                this.stopCamera();
            }

            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.currentStream = stream;
            this.isCameraActive = true;
            this.reconnectAttempts = 0;

            this.elements.video.srcObject = stream;
            this.elements.video.style.display = 'block';
            await this.elements.video.play();

            // Start blink and distance detection
            this.startDetection();

            this.updateStatus('Running', '#4ad7a8');
            this.elements.startBtn.textContent = '⏹️ Stop Camera';
            this.elements.startBtn.className = 'btn btn-danger';

            console.log('✅ Camera started successfully');
            
            // Show toast notification
            if (window.showToast) {
                window.showToast('📷 Camera started successfully!', 'success');
            }

        } catch (error) {
            console.error('❌ Camera start failed:', error);
            this.handleCameraError(error);
        }
    },

    stopCamera() {
        console.log('🛑 Stopping camera...');
        
        // Clear detection interval
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
                console.log(`  ⏹️ Stopped ${track.kind} track`);
            });
            this.currentStream = null;
        }

        this.isCameraActive = false;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;

        this.elements.video.srcObject = null;
        this.elements.video.style.display = 'none';

        // Reset blink count
        this.blinkCount = 0;
        if (this.elements.blinkCount) {
            this.elements.blinkCount.textContent = '0';
        }
        if (this.elements.distanceValue) {
            this.elements.distanceValue.textContent = '-- cm';
        }

        this.updateStatus('Stopped', '#6c757d');
        this.elements.startBtn.textContent = '📷 Start Camera';
        this.elements.startBtn.className = 'btn btn-accent';

        console.log('✅ Camera stopped');
        
        if (window.showToast) {
            window.showToast('📷 Camera stopped', 'info');
        }
    },

    startDetection() {
        // Clear existing interval
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
        }

        this.blinkCount = 0;
        let isBlinking = false;

        this.blinkInterval = setInterval(() => {
            if (!this.isCameraActive || !this.currentStream) {
                return;
            }

            // Simulate blink detection (every 3-8 seconds)
            const shouldBlink = Math.random() < 0.25;
            
            if (shouldBlink && !isBlinking) {
                isBlinking = true;
                this.blinkCount++;
                
                if (this.elements.blinkCount) {
                    this.elements.blinkCount.textContent = this.blinkCount;
                }

                setTimeout(() => {
                    isBlinking = false;
                }, 200);
            }

            // Simulate distance monitoring (every 2 seconds)
            if (Math.random() < 0.3) {
                const distance = 30 + Math.random() * 30; // 30-60 cm
                this.distanceValue = distance;
                
                if (this.elements.distanceValue) {
                    this.elements.distanceValue.textContent = `${distance.toFixed(1)} cm`;
                    
                    // Alert if too close (< 30cm)
                    if (distance < 30) {
                        this.elements.distanceValue.style.color = '#fc8181';
                        if (window.showToast && Math.random() < 0.1) {
                            window.showToast('⚠️ Too close! Move back from screen.', 'warning');
                        }
                    } else {
                        this.elements.distanceValue.style.color = '#4ad7a8';
                    }
                }
            }
        }, 2000);
    },

    async restartCamera() {
        if (this.isReconnecting) return;
        
        this.isReconnecting = true;
        this.updateStatus('Reconnecting...', '#ecc94b');

        try {
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(t => t.stop());
                this.currentStream = null;
                this.isCameraActive = false;
            }

            await this.sleep(500);
            await this.startCamera();
            this.isReconnecting = false;
            console.log('✅ Reconnection successful');

        } catch (error) {
            this.isReconnecting = false;
            console.error('❌ Reconnection failed:', error);
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`🔄 Retry ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                
                this.reconnectTimeout = setTimeout(() => {
                    this.restartCamera();
                }, 2000);
            } else {
                this.updateStatus('Connection failed', '#fc8181');
                this.stopCamera();
                if (window.showToast) {
                    window.showToast('❌ Camera reconnection failed', 'error');
                }
            }
        }
    },

    handleCameraError(error) {
        this.updateStatus('Error', '#fc8181');
        this.isCameraActive = false;

        let message = '';
        switch (error.name) {
            case 'NotAllowedError':
                message = 'Camera permission denied. Please allow camera access in browser settings.';
                break;
            case 'NotFoundError':
                message = 'No camera found. Please connect a camera.';
                break;
            case 'NotReadableError':
                message = 'Camera in use. Close other apps using the camera (Zoom, Teams, etc.)';
                break;
            case 'OverconstrainedError':
                message = 'Camera settings not supported.';
                break;
            default:
                message = `${error.name}: ${error.message}`;
        }

        alert(`Camera Error\n\n${message}`);
        
        this.elements.startBtn.textContent = '📷 Start Camera';
        this.elements.startBtn.className = 'btn btn-accent';
    },

    updateStatus(message, color = '#6c757d') {
        const statusEl = this.elements.statusEl;
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = color;
            statusEl.className = '';
            
            // Add styling
            if (message === 'Running') {
                statusEl.style.fontWeight = '600';
            }
        }
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// ==================== SCREEN HEALTH / FOCUS TIMER ====================
const FocusTracker = {
    timer: null,
    seconds: 0,
    isRunning: false,
    isPaused: false,
    totalSeconds: 0,
    breakSeconds: 20 * 60,
    nextBreakSeconds: 20 * 60,
    reminderEnabled: true,

    elements: {},

    init() {
        this.elements = {
            timerDisplay: document.getElementById('screenTimeDisplay'),
            breakCountdown: document.getElementById('breakCountdown'),
            breakStatus: document.getElementById('breakStatus'),
            startBtn: document.getElementById('screenTimerStart'),
            pauseBtn: document.getElementById('screenTimerPause'),
            resetBtn: document.getElementById('screenTimerReset'),
            enableCheckbox: document.getElementById('enableBreakReminder'),
            strainLevel: document.getElementById('strainLevel'),
            strainRecommendation: document.getElementById('strainRecommendation')
        };

        // Only initialize if elements exist (on screen_health page)
        if (!this.elements.timerDisplay) {
            console.warn('Focus timer elements not found (not on screen_health page)');
            return;
        }

        this.loadState();
        this.setupEvents();
        this.updateDisplay();
        this.updateBreakDisplay();
        this.updateBreakStatus();
        this.updateStrainLevel();

        console.log('✅ Focus Tracker initialized');
    },

    setupEvents() {
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.start());
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.pause());
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.reset());
        }
        if (this.elements.enableCheckbox) {
            this.elements.enableCheckbox.addEventListener('change', (e) => {
                this.reminderEnabled = e.target.checked;
                this.updateBreakStatus();
                this.saveState();
                
                if (window.showToast) {
                    window.showToast(
                        this.reminderEnabled ? '✅ 20-20-20 Reminder enabled' : '❌ Reminder disabled',
                        this.reminderEnabled ? 'success' : 'info'
                    );
                }
            });
        }
    },

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(() => {
            this.seconds++;
            this.totalSeconds++;
            this.nextBreakSeconds--;

            if (this.reminderEnabled && this.nextBreakSeconds <= 0) {
                this.showBreakAlert();
                this.nextBreakSeconds = this.breakSeconds;
            }

            this.updateDisplay();
            this.updateBreakDisplay();
            this.updateStrainLevel();
            this.saveState();
        }, 1000);

        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = true;
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.disabled = false;
        }
        this.updateBreakStatus();

        if (window.showToast) {
            window.showToast('▶️ Focus session started!', 'success');
        }

        console.log('▶️ Focus timer started');
    },

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = false;
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.disabled = true;
        }
        this.updateBreakStatus();
        this.saveState();
        
        if (window.showToast) {
            window.showToast('⏸️ Focus session paused', 'info');
        }
        
        console.log('⏸️ Focus timer paused');
    },

    reset() {
        this.isRunning = false;
        this.isPaused = false;

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.seconds = 0;
        this.nextBreakSeconds = this.breakSeconds;

        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = false;
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.disabled = true;
        }

        this.updateDisplay();
        this.updateBreakDisplay();
        this.updateStrainLevel();
        this.updateBreakStatus();
        this.saveState();
        
        if (window.showToast) {
            window.showToast('🔄 Focus session reset', 'info');
        }
        
        console.log('🔄 Focus timer reset');
    },

    showBreakAlert() {
        // Show toast notification
        if (window.showToast) {
            window.showToast('👁️ 20-20-20 Break! Look 20 feet away for 20 seconds.', 'warning');
        }

        // Send notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('👁️ 20-20-20 Break!', {
                body: 'Look 20 feet away for 20 seconds.',
                icon: '/static/icon.svg'
            });
        }

        // Play sound
        this.playSound();
        
        console.log('⏰ 20-20-20 Break alert!');
    },

    playSound() {
        try {
            const audio = new Audio('/static/alert.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {
            // Fallback - use base64
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACBhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFhYqFg==');
                audio.volume = 0.3;
                audio.play().catch(() => {});
            } catch (e2) {}
        }
    },

    updateDisplay() {
        if (!this.elements.timerDisplay) return;
        const hours = Math.floor(this.seconds / 3600);
        const minutes = Math.floor((this.seconds % 3600) / 60);
        const secs = this.seconds % 60;
        this.elements.timerDisplay.textContent = 
            `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(secs)}`;
    },

    updateBreakDisplay() {
        if (!this.elements.breakCountdown) return;
        const minutes = Math.floor(this.nextBreakSeconds / 60);
        const secs = this.nextBreakSeconds % 60;
        this.elements.breakCountdown.textContent = 
            `${this.pad(minutes)}:${this.pad(secs)}`;
    },

    updateBreakStatus() {
        if (!this.elements.breakStatus) return;
        if (this.reminderEnabled && this.isRunning) {
            this.elements.breakStatus.textContent = '✅ Reminder Enabled';
            this.elements.breakStatus.style.color = '#4ad7a8';
        } else if (this.reminderEnabled && this.isPaused) {
            this.elements.breakStatus.textContent = '⏸️ Paused';
            this.elements.breakStatus.style.color = '#ecc94b';
        } else if (!this.reminderEnabled) {
            this.elements.breakStatus.textContent = '❌ Reminder Disabled';
            this.elements.breakStatus.style.color = '#fc8181';
        } else {
            this.elements.breakStatus.textContent = '⏹️ Stopped';
            this.elements.breakStatus.style.color = '#6c757d';
        }
    },

    updateStrainLevel() {
        if (!this.elements.strainLevel || !this.elements.strainRecommendation) return;

        const minutes = Math.floor(this.seconds / 60);
        let level, recommendation, color;

        if (minutes < 20) {
            level = '🟢 Low';
            recommendation = 'Keep up the good work!';
            color = '#48bb78';
        } else if (minutes < 40) {
            level = '🟡 Medium';
            recommendation = 'Take a quick break soon';
            color = '#ecc94b';
        } else {
            level = '🔴 High';
            recommendation = 'Take a break now!';
            color = '#fc8181';
        }

        this.elements.strainLevel.textContent = level;
        this.elements.strainLevel.style.color = color;
        this.elements.strainRecommendation.textContent = recommendation;
        this.elements.strainRecommendation.style.color = color;
    },

    pad(num) {
        return String(num).padStart(2, '0');
    },

    saveState() {
        try {
            const state = {
                seconds: this.seconds,
                totalSeconds: this.totalSeconds,
                nextBreakSeconds: this.nextBreakSeconds,
                isRunning: this.isRunning,
                isPaused: this.isPaused,
                reminderEnabled: this.reminderEnabled
            };
            localStorage.setItem('focusTrackerState', JSON.stringify(state));
        } catch (e) {}
    },

    loadState() {
        try {
            const saved = localStorage.getItem('focusTrackerState');
            if (saved) {
                const state = JSON.parse(saved);
                this.seconds = state.seconds || 0;
                this.totalSeconds = state.totalSeconds || 0;
                this.nextBreakSeconds = state.nextBreakSeconds || this.breakSeconds;
                this.isRunning = state.isRunning || false;
                this.isPaused = state.isPaused || false;
                this.reminderEnabled = state.reminderEnabled !== undefined ? 
                    state.reminderEnabled : true;

                if (this.elements.enableCheckbox) {
                    this.elements.enableCheckbox.checked = this.reminderEnabled;
                }

                if (this.isRunning) {
                    this.start();
                }
            }
        } catch (e) {}
    }
};

// ==================== HYDRATION TRACKER ====================
const HydrationTracker = {
    glasses: 0,
    target: 8,

    elements: {},

    init() {
        this.elements = {
            count: document.getElementById('waterCount'),
            progress: document.getElementById('waterProgressBar'),
            status: document.getElementById('hydrationStatus'),
            addBtn: document.getElementById('addWaterButton'),
            resetBtn: document.getElementById('resetWaterButton')
        };

        // Only initialize if elements exist (on screen_health page)
        if (!this.elements.count) {
            console.warn('Hydration elements not found (not on screen_health page)');
            return;
        }

        this.loadState();
        this.setupEvents();
        this.updateUI();

        console.log('💧 Hydration Tracker initialized');
    },

    setupEvents() {
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', () => this.addGlass());
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.reset());
        }
    },

    addGlass() {
        if (this.glasses >= this.target) {
            if (window.showToast) {
                window.showToast('🎉 Goal reached! You\'re fully hydrated!', 'success');
            }
            return;
        }

        this.glasses++;
        this.updateUI();
        this.saveState();

        if (this.glasses === this.target) {
            if (window.showToast) {
                window.showToast('🎉 Amazing! You reached your hydration goal!', 'success');
            }
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('💧 Goal Reached!', {
                    body: 'You drank 8 glasses of water today!',
                    icon: '/static/icon.svg'
                });
            }
        } else {
            if (window.showToast) {
                window.showToast(`💧 ${this.glasses}/8 glasses - Keep going!`, 'info');
            }
        }

        console.log(`💧 Glass added: ${this.glasses}/${this.target}`);
    },

    reset() {
        this.glasses = 0;
        this.updateUI();
        this.saveState();
        
        if (window.showToast) {
            window.showToast('🔄 Hydration reset', 'info');
        }
        
        console.log('🔄 Hydration reset');
    },

    updateUI() {
        if (this.elements.count) {
            this.elements.count.textContent = this.glasses;
        }

        if (this.elements.progress) {
            const percentage = (this.glasses / this.target) * 100;
            const width = Math.min(percentage, 100);
            this.elements.progress.style.width = `${width}%`;
            this.elements.progress.textContent = `${Math.round(width)}%`;
            
            // Change color based on progress
            if (percentage >= 75) {
                this.elements.progress.style.background = 'linear-gradient(90deg, #4ad7a8, #38a169)';
            } else if (percentage >= 50) {
                this.elements.progress.style.background = 'linear-gradient(90deg, #ecc94b, #d69e2e)';
            } else {
                this.elements.progress.style.background = 'linear-gradient(90deg, #fc8181, #e53e3e)';
            }
        }

        if (this.elements.status) {
            if (this.glasses >= this.target) {
                this.elements.status.textContent = '🎉 Goal reached! Great job!';
                this.elements.status.className = 'status-pill';
                this.elements.status.style.background = 'rgba(74,215,168,0.2)';
                this.elements.status.style.color = '#4ad7a8';
                this.elements.status.style.borderColor = '#4ad7a8';
            } else {
                this.elements.status.textContent = `💧 ${this.glasses} glasses - Keep going!`;
                this.elements.status.className = 'status-pill';
                this.elements.status.style.background = 'rgba(255,255,255,0.08)';
                this.elements.status.style.color = 'rgba(230,248,255,0.72)';
                this.elements.status.style.borderColor = 'rgba(255,255,255,0.12)';
            }
        }
    },

    saveState() {
        try {
            localStorage.setItem('hydrationState', JSON.stringify({
                glasses: this.glasses
            }));
        } catch (e) {}
    },

    loadState() {
        try {
            const saved = localStorage.getItem('hydrationState');
            if (saved) {
                const state = JSON.parse(saved);
                this.glasses = state.glasses || 0;
            }
        } catch (e) {}
    }
};

// ==================== TOAST NOTIFICATION SYSTEM ====================
function showToast(message, type = 'info') {
    // Check if container exists
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            width: 100%;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    
    const colors = {
        success: '#4ad7a8',
        error: '#fc8181',
        warning: '#ecc94b',
        info: '#4299e1'
    };

    const textColors = {
        success: '#0f5132',
        error: '#742a2a',
        warning: '#744210',
        info: '#0a3d6b'
    };

    toast.style.cssText = `
        padding: 15px 20px;
        border-radius: 12px;
        color: ${textColors[type] || '#ffffff'};
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
        background: ${colors[type] || colors.info};
        transform: translateX(0);
        transition: all 0.3s ease;
        pointer-events: auto;
        border: 1px solid rgba(255,255,255,0.1);
    `;
    
    toast.textContent = message;
    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 4000);
}

// ==================== INITIALIZE EVERYTHING ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Ocusense Arena...');
    
    // Initialize Camera
    CameraController.init();
    
    // Initialize Focus Tracker (only if on screen_health page)
    FocusTracker.init();
    
    // Initialize Hydration (only if on screen_health page)
    HydrationTracker.init();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log(`📱 Notification permission: ${permission}`);
        });
    }

    // Make toast available globally
    window.showToast = showToast;

    console.log('✅ App initialized successfully');
});

// ==================== SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js')
        .then(reg => {
            console.log('📱 Service Worker registered');
            
            // Check for updates
            reg.addEventListener('updatefound', () => {
                console.log('🔄 New service worker found');
            });
        })
        .catch((error) => {
            console.warn('❌ Service Worker registration failed:', error);
        });
}

// ==================== EXPOSE GLOBALLY ====================
window.CameraController = CameraController;
window.FocusTracker = FocusTracker;
window.HydrationTracker = HydrationTracker;
window.showToast = showToast;

console.log('✅ All modules loaded successfully!');