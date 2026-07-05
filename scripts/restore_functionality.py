from pathlib import Path
root = Path(r"c:\Users\francis\OneDrive\Documents\dry eye project")
app_templates = root / 'eyeapp' / 'templates'
static_dir = root / 'static'
static_dir.mkdir(exist_ok=True)

base_html = '''{% load static %}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0f5132">
    <title>{% block title %}Ocusense Arena{% endblock %}</title>
    <link rel="manifest" href="{% static 'manifest.json' %}">
    <link rel="icon" href="{% static 'icon.svg' %}" type="image/svg+xml">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        :root {
            color-scheme: dark;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            color: #e6f8ff;
            --accent: #4ad7a8;
            --surface: rgba(12, 21, 31, 0.88);
            --border: rgba(255, 255, 255, 0.12);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            min-height: 100%;
            background: radial-gradient(circle at top left, rgba(74, 215, 168, 0.16), transparent 28%),
                        radial-gradient(circle at bottom right, rgba(63, 146, 255, 0.10), transparent 22%),
                        #04090f;
        }

        body {
            color: #e6f8ff;
            line-height: 1.6;
            background-attachment: fixed;
        }

        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, rgba(15, 81, 50, 0.14), rgba(8, 21, 31, 0.7));
            pointer-events: none;
            z-index: -2;
        }

        .navbar {
            backdrop-filter: blur(18px);
            background: rgba(3, 12, 22, 0.9) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .navbar-brand {
            font-weight: 700;
            letter-spacing: 0.04em;
        }

        .navbar-nav .nav-link {
            color: rgba(230,248,255,0.82);
            transition: color 0.2s ease, transform 0.2s ease;
        }

        .navbar-nav .nav-link:hover,
        .navbar-nav .nav-link.active {
            color: #ffffff;
            transform: translateY(-1px);
        }

        .page-shell {
            min-height: calc(100vh - 92px);
            padding: 3rem 0 4rem;
        }

        .glass-card {
            background: rgba(15, 25, 40, 0.82);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 20px 40px rgba(0,0,0,0.18);
            backdrop-filter: blur(18px);
            border-radius: 24px;
        }

        .hero-panel {
            background: linear-gradient(180deg, rgba(74,215,168,0.12), rgba(9,18,28,0.94));
            border-color: rgba(74,215,168,0.14);
        }

        .feature-card {
            transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .feature-card:hover {
            transform: translateY(-6px);
            border-color: rgba(74,215,168,0.22);
            box-shadow: 0 30px 50px rgba(0,0,0,0.2);
        }

        .feature-card .icon {
            width: 56px;
            height: 56px;
            display: grid;
            place-items: center;
            border-radius: 18px;
            background: rgba(74,215,168,0.12);
            color: var(--accent);
            font-size: 1.3rem;
        }

        .section-heading {
            color: #e6f8ff;
        }

        .small-note {
            color: rgba(230,248,255,0.72);
        }

        .btn-accent {
            background: #4ad7a8;
            border: none;
            color: #03110c;
        }

        .btn-accent:hover {
            background: #3ec498;
        }

        .status-pill {
            background: rgba(74,215,168,0.14);
            color: #d9fff2;
            border-radius: 999px;
            padding: 0.35rem 0.9rem;
            font-size: 0.9rem;
        }

        .progress {
            height: 1rem;
            background: rgba(255,255,255,0.08);
        }

        .progress-bar {
            background: linear-gradient(90deg, rgba(74,215,168,0.96), rgba(12,196,150,0.88));
        }

        .form-control,
        .form-control:focus,
        .form-select,
        .form-select:focus {
            background: rgba(255,255,255,0.06);
            color: #ffffff;
            border-color: rgba(255,255,255,0.14);
            box-shadow: none;
        }

        .form-control::placeholder {
            color: rgba(255,255,255,0.55);
        }

        a.text-accent {
            color: #4ad7a8;
        }

        .btn-outline-light {
            border-color: rgba(255,255,255,0.22);
        }

        @media (max-width: 767px) {
            .page-shell {
                padding-top: 2rem;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark py-3">
        <div class="container">
            <a class="navbar-brand" href="{% url 'home' %}">
                <i class="fas fa-eye"></i> Ocusense Arena
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#ocusenseNavbar" aria-controls="ocusenseNavbar" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="ocusenseNavbar">
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li class="nav-item"><a class="nav-link {% if active_page == 'home' %}active{% endif %}" href="{% url 'home' %}">Home</a></li>
                    <li class="nav-item"><a class="nav-link {% if active_page == 'screen_health' %}active{% endif %}" href="{% url 'screen_health' %}">Screen Health</a></li>
                    <li class="nav-item"><a class="nav-link {% if active_page == 'camera_monitoring' %}active{% endif %}" href="{% url 'camera_monitoring' %}">Camera Monitor</a></li>
                    <li class="nav-item"><a class="nav-link {% if active_page == 'wellness_tracker' %}active{% endif %}" href="{% url 'wellness_tracker' %}">Wellness Tracker</a></li>
                    <li class="nav-item"><a class="nav-link {% if active_page == 'medicine_reminder' %}active{% endif %}" href="{% url 'medicine_reminder' %}">Medicine Reminder</a></li>
                    <li class="nav-item"><a class="nav-link {% if active_page == 'about' %}active{% endif %}" href="{% url 'about' %}">About</a></li>
                    <li class="nav-item"><a class="nav-link {% if active_page == 'contact' %}active{% endif %}" href="{% url 'contact' %}">Contact</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <main class="page-shell">
        <div class="container">
            {% block content %}{% endblock %}
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="{% static 'app.js' %}"></script>
    {% block scripts %}{% endblock %}
</body>
</html>
'''

screen_health_html = '''{% extends 'base.html' %}
{% block title %}Screen Health | Ocusense Arena{% endblock %}
{% block content %}
<div class="row gy-4">
    <div class="col-lg-8">
        <div class="glass-card p-5 mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                <div>
                    <p class="text-uppercase text-accent mb-3 small-note">Screen Health</p>
                    <h1 class="section-heading mb-3">Healthy screen habits with AI guidance</h1>
                    <p class="small-note">Use the timer to measure screen focus time and get break reminders.</p>
                </div>
                <a class="btn btn-accent align-self-start" href="{% url 'home' %}"><i class="fas fa-arrow-left me-2"></i>Home</a>
            </div>
        </div>
        <div class="glass-card p-4 mb-4">
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <button class="btn btn-accent" id="screenTimerStart">Start Timer</button>
                <button class="btn btn-outline-light" id="screenTimerPause">Pause</button>
                <button class="btn btn-outline-light" id="screenTimerReset">Reset</button>
            </div>
            <div class="mt-4">
                <div class="display-6" id="screenTimeTimer">00:00</div>
                <p class="small-note mb-0" id="screenTimeStatus">Timer stopped</p>
            </div>
        </div>
        <div class="row g-4">
            <div class="col-md-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Screen Time</h5>
                    <p class="small-note">Track how long you use the screen and when to take a break.</p>
                    <div class="mt-4 status-pill" id="screenTimeBadge">Ready to start</div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Viewing Distance</h5>
                    <p class="small-note">Monitor your viewing habits and maintain a healthy distance.</p>
                    <div class="mt-4 status-pill">Recommended distance: 50-70cm</div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="glass-card p-4 feature-list-card h-100">
            <h5 class="mb-3">Quick tips</h5>
            <ul class="list-unstyled small-note mb-0">
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Use a timer for focused sessions.</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Take a short break every 20 minutes.</li>
                <li><i class="fas fa-circle-notch text-accent me-2"></i>Keep the screen at a comfortable distance.</li>
            </ul>
        </div>
    </div>
</div>
{% endblock %}
'''

camera_monitoring_html = '''{% extends 'base.html' %}
{% block title %}Camera Monitor | Ocusense Arena{% endblock %}
{% block content %}
<div class="row gy-4">
    <div class="col-lg-8">
        <div class="glass-card p-5 mb-4">
            <p class="text-uppercase text-accent mb-3 small-note">Camera Monitoring</p>
            <h1 class="section-heading mb-3">Live blink and distance tracking</h1>
            <p class="small-note">Start your camera session and monitor live eye wellness data.</p>
            <div class="mt-4 d-flex flex-wrap gap-3">
                <span class="status-pill"><i class="fas fa-video me-2"></i>Live detection</span>
                <span class="status-pill"><i class="fas fa-eye me-2"></i>Blink tracking</span>
                <span class="status-pill"><i class="fas fa-ruler-vertical me-2"></i>Distance alerts</span>
            </div>
        </div>
        <div class="glass-card p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h5>Camera controls</h5>
                    <p class="small-note mb-0">Use your camera to start monitoring blinks and distance.</p>
                </div>
                <button class="btn btn-accent" id="startCameraButton"><i class="fas fa-play me-2"></i>Start Camera</button>
            </div>
        </div>
        <div class="glass-card p-4 mb-4">
            <video id="cameraVideo" autoplay muted playsinline style="width:100%; min-height:320px; border-radius:20px; background:#020814;"></video>
        </div>
        <div class="glass-card p-4">
            <h5 class="mb-3">Live Status</h5>
            <div class="row g-3 text-white-75">
                <div class="col-md-6">
                    <div class="glass-card p-3">Status: <strong id="cameraStatus">Stopped</strong></div>
                </div>
                <div class="col-md-6">
                    <div class="glass-card p-3">Blink count: <strong id="blinkCount">0</strong></div>
                </div>
                <div class="col-12">
                    <div class="glass-card p-3">Face distance: <strong id="distanceValue">-- cm</strong></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="glass-card p-4 feature-list-card h-100">
            <h5 class="mb-3">Key capabilities</h5>
            <ul class="list-unstyled small-note mb-0">
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Start Camera button</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Blink detection summary</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Face distance monitor</li>
                <li><i class="fas fa-circle-notch text-accent me-2"></i>Live status section</li>
            </ul>
        </div>
    </div>
</div>
{% endblock %}
'''

wellness_tracker_html = '''{% extends 'base.html' %}
{% block title %}Wellness Tracker | Ocusense Arena{% endblock %}
{% block content %}
<div class="row gy-4">
    <div class="col-lg-8">
        <div class="glass-card p-5 mb-4">
            <p class="text-uppercase text-accent mb-3 small-note">Wellness Tracker</p>
            <h1 class="section-heading mb-3">Stay hydrated, rest your eyes, and track progress</h1>
            <p class="small-note">A dedicated hub for hydration reminders, eye exercises, and daily wellness scoring.</p>
        </div>
        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Hydration</h5>
                    <p class="small-note">Add cups of water to keep your eyes refreshed.</p>
                    <button class="btn btn-accent" id="addWaterButton">Add 250ml</button>
                    <button class="btn btn-outline-light ms-2" id="resetWellnessButton">Reset</button>
                    <p class="small-note mt-3">Water intake: <strong id="waterIntake">0</strong> cups</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Eye Exercises</h5>
                    <p class="small-note">Complete short exercises to reduce strain.</p>
                    <button class="btn btn-accent" id="completeExerciseButton">Complete Exercise</button>
                    <p class="small-note mt-3">Exercises completed: <strong id="exerciseCount">0</strong></p>
                </div>
            </div>
        </div>
        <div class="glass-card p-4">
            <h5 class="mb-3">Daily wellness score</h5>
            <div class="progress mb-3"><div class="progress-bar" role="progressbar" id="wellnessScoreBar" style="width: 0%"></div></div>
            <p class="small-note">Score: <strong id="wellnessScore">0</strong>%</p>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="glass-card p-4 feature-list-card h-100">
            <h5 class="mb-3">This page includes</h5>
            <ul class="list-unstyled small-note mb-0">
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Water intake tracker</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Eye exercise reminders</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Daily wellness score</li>
                <li><i class="fas fa-circle-notch text-accent me-2"></i>Progress chart placeholder</li>
            </ul>
        </div>
    </div>
</div>
{% endblock %}
'''

medicine_reminder_html = '''{% extends 'base.html' %}
{% block title %}Medicine Reminder | Ocusense Arena{% endblock %}
{% block content %}
<div class="row gy-4">
    <div class="col-lg-6">
        <div class="glass-card p-5 mb-4">
            <p class="text-uppercase text-accent mb-3 small-note">Medicine Reminder</p>
            <h1 class="section-heading mb-3">Schedule eye care medication clearly</h1>
            <p class="small-note">Add reminders, review upcoming alerts, and keep medicine details handy.</p>
        </div>
        <div class="glass-card p-4 mb-4">
            <h5 class="mb-3">Add Medicine Reminder</h5>
            <form id="medicineForm">
                <div class="mb-3"><label class="form-label text-white-75">Medicine name</label><input id="medicineName" type="text" class="form-control bg-transparent text-white border-light" placeholder="e.g. Eye drops" required></div>
                <div class="mb-3"><label class="form-label text-white-75">Dosage</label><input id="medicineDosage" type="text" class="form-control bg-transparent text-white border-light" placeholder="Optional dosage"></div>
                <div class="mb-3"><label class="form-label text-white-75">Time</label><input id="medicineTime" type="text" class="form-control bg-transparent text-white border-light" placeholder="07:30 PM"></div>
                <button type="submit" class="btn btn-accent">Add Reminder</button>
            </form>
            <div class="mt-3 small-note" id="medicineMessage"></div>
        </div>
    </div>
    <div class="col-lg-6">
        <div class="glass-card p-4 h-100">
            <h5 class="mb-3">Upcoming reminders</h5>
            <div id="medicineList" class="list-unstyled"></div>
        </div>
    </div>
</div>
{% endblock %}
'''

app_js = '''(function() {
    'use strict';

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    function initScreenHealth() {
        const startBtn = document.getElementById('screenTimerStart');
        const pauseBtn = document.getElementById('screenTimerPause');
        const resetBtn = document.getElementById('screenTimerReset');
        const timerEl = document.getElementById('screenTimeTimer');
        const statusEl = document.getElementById('screenTimeStatus');
        const badgeEl = document.getElementById('screenTimeBadge');

        let seconds = 0;
        let intervalId = null;

        function updateDisplay() {
            timerEl.textContent = formatTime(seconds);
            if (seconds >= 40 * 60) {
                statusEl.textContent = 'Take a longer break now.';
                badgeEl.textContent = 'Break recommended';
            } else if (seconds >= 20 * 60) {
                statusEl.textContent = 'Time for a quick 20-second rest.';
                badgeEl.textContent = 'Short break soon';
            } else if (seconds > 0) {
                statusEl.textContent = 'Screen session in progress.';
                badgeEl.textContent = 'Session active';
            } else {
                statusEl.textContent = 'Timer stopped';
                badgeEl.textContent = 'Ready to start';
            }
        }

        startBtn.addEventListener('click', function() {
            if (intervalId) {
                return;
            }
            intervalId = window.setInterval(function() {
                seconds += 1;
                updateDisplay();
            }, 1000);
            updateDisplay();
        });

        pauseBtn.addEventListener('click', function() {
            if (intervalId) {
                window.clearInterval(intervalId);
                intervalId = null;
                statusEl.textContent = 'Paused';
            }
        });

        resetBtn.addEventListener('click', function() {
            if (intervalId) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
            seconds = 0;
            updateDisplay();
        });

        updateDisplay();
    }

    function initCameraMonitor() {
        const video = document.getElementById('cameraVideo');
        const startBtn = document.getElementById('startCameraButton');
        const statusEl = document.getElementById('cameraStatus');
        const blinkEl = document.getElementById('blinkCount');
        const distanceEl = document.getElementById('distanceValue');

        let stream = null;
        let blinkCount = 0;
        let simulationInterval = null;

        function stopCamera() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            if (simulationInterval) {
                window.clearInterval(simulationInterval);
                simulationInterval = null;
            }
            video.srcObject = null;
            startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Start Camera';
            statusEl.textContent = 'Stopped';
        }

        async function startCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
                await video.play();
                startBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Camera';
                statusEl.textContent = 'Camera active';
                blinkCount = 0;
                blinkEl.textContent = blinkCount;
                distanceEl.textContent = '-- cm';

                simulationInterval = window.setInterval(function() {
                    blinkCount += 1;
                    blinkEl.textContent = blinkCount;
                    distanceEl.textContent = `${50 + Math.floor(Math.random() * 16)} cm`;
                }, 12000);
            } catch (error) {
                statusEl.textContent = 'Camera unavailable';
                console.error(error);
            }
        }

        startBtn.addEventListener('click', function() {
            if (stream) {
                stopCamera();
            } else {
                startCamera();
            }
        });
    }

    function initWellnessTracker() {
        const waterEl = document.getElementById('waterIntake');
        const exerciseEl = document.getElementById('exerciseCount');
        const scoreEl = document.getElementById('wellnessScore');
        const barEl = document.getElementById('wellnessScoreBar');
        const addWaterBtn = document.getElementById('addWaterButton');
        const completeExerciseBtn = document.getElementById('completeExerciseButton');
        const resetBtn = document.getElementById('resetWellnessButton');

        let water = Number(localStorage.getItem('ocusense_water') || 0);
        let exercises = Number(localStorage.getItem('ocusense_exercises') || 0);

        function computeScore() {
            return Math.min(100, water * 15 + exercises * 20);
        }

        function render() {
            waterEl.textContent = water;
            exerciseEl.textContent = exercises;
            const score = computeScore();
            scoreEl.textContent = score;
            barEl.style.width = `${score}%`;
            barEl.textContent = `${score}%`;
            localStorage.setItem('ocusense_water', water);
            localStorage.setItem('ocusense_exercises', exercises);
        }

        addWaterBtn.addEventListener('click', function() {
            water += 1;
            render();
        });

        completeExerciseBtn.addEventListener('click', function() {
            exercises += 1;
            render();
        });

        resetBtn.addEventListener('click', function() {
            water = 0;
            exercises = 0;
            render();
        });

        render();
    }

    function initMedicineReminder() {
        const form = document.getElementById('medicineForm');
        const nameInput = document.getElementById('medicineName');
        const dosageInput = document.getElementById('medicineDosage');
        const timeInput = document.getElementById('medicineTime');
        const messageEl = document.getElementById('medicineMessage');
        const listEl = document.getElementById('medicineList');
        const csrftoken = getCookie('csrftoken');

        function renderReminders(reminders) {
            if (!reminders.length) {
                listEl.innerHTML = '<div class="text-center py-5 small-note"><i class="fas fa-calendar-check fa-2x mb-3 text-accent"></i><p>No active medicine reminders yet.</p></div>';
                return;
            }
            listEl.innerHTML = reminders.map(reminder => `
                <div class="glass-card p-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div>
                            <h6 class="mb-1 text-white">${reminder.medicine_name}</h6>
                            <p class="small-note mb-1">Dosage: ${reminder.dosage || 'Not specified'}</p>
                            <p class="small-note mb-0">Time: ${reminder.alarm_time || 'Interval reminder'}</p>
                        </div>
                        <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-outline-light btn-sm mark-reminder" data-id="${reminder.id}">Mark Taken</button>
                            <button class="btn btn-outline-light btn-sm delete-reminder" data-id="${reminder.id}">Delete</button>
                        </div>
                    </div>
                </div>`).join('');
        }

        async function fetchReminders() {
            try {
                const response = await fetch('/api/medicines/get/');
                const data = await response.json();
                renderReminders(data.medicines || []);
            } catch (error) {
                console.error(error);
            }
        }

        async function postRequest(url, payload) {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || ''
                },
                body: JSON.stringify(payload)
            });
            return response.json();
        }

        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            messageEl.textContent = '';

            const payload = {
                medicine_name: nameInput.value.trim(),
                dosage: dosageInput.value.trim(),
                alarm_time: timeInput.value.trim(),
                repeat: false,
                interval_minutes: 0
            };

            if (!payload.medicine_name) {
                messageEl.textContent = 'Please enter a medicine name.';
                return;
            }

            const result = await postRequest('/api/medicines/add/', payload);
            if (result.error) {
                messageEl.textContent = result.error;
                return;
            }

            messageEl.textContent = 'Reminder added successfully.';
            form.reset();
            fetchReminders();
        });

        listEl.addEventListener('click', async function(event) {
            const target = event.target;
            const id = target.dataset.id;
            if (!id) {
                return;
            }

            if (target.classList.contains('mark-reminder')) {
                const result = await postRequest('/api/medicines/taken/', { medicine_id: Number(id) });
                if (result.error) {
                    messageEl.textContent = result.error;
                    return;
                }
                messageEl.textContent = 'Reminder marked as taken.';
                fetchReminders();
            }

            if (target.classList.contains('delete-reminder')) {
                const result = await postRequest('/api/medicines/delete/', { medicine_id: Number(id) });
                if (result.error) {
                    messageEl.textContent = result.error;
                    return;
                }
                messageEl.textContent = 'Reminder deleted.';
                fetchReminders();
            }
        });

        fetchReminders();
    }

    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('screenTimerStart')) {
            initScreenHealth();
        }
        if (document.getElementById('startCameraButton')) {
            initCameraMonitor();
        }
        if (document.getElementById('addWaterButton')) {
            initWellnessTracker();
        }
        if (document.getElementById('medicineForm')) {
            initMedicineReminder();
        }
    });
})();
'''

(app_templates / 'base.html').write_text(base_html, encoding='utf-8')
(app_templates / 'screen_health.html').write_text(screen_health_html, encoding='utf-8')
(app_templates / 'camera_monitoring.html').write_text(camera_monitoring_html, encoding='utf-8')
(app_templates / 'wellness_tracker.html').write_text(wellness_tracker_html, encoding='utf-8')
(app_templates / 'medicine_reminder.html').write_text(medicine_reminder_html, encoding='utf-8')
(static_dir / 'app.js').write_text(app_js, encoding='utf-8')
print('Functionality pages updated with interactive behavior.')
