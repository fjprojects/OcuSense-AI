from pathlib import Path

root = Path(r"c:\Users\francis\OneDrive\Documents\dry eye project")
app_templates = root / 'eyeapp' / 'templates'
static_dir = root / 'static'

screen_health_html = '''{% extends 'base.html' %}
{% block title %}Screen Health | Ocusense Arena{% endblock %}
{% block content %}
<div class="row gy-4">
    <div class="col-lg-8">
        <div class="glass-card p-5 mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                <div>
                    <p class="text-uppercase text-accent mb-3 small-note">Monitoring</p>
                    <h1 class="section-heading mb-3">Screen health analytics & monitoring</h1>
                    <p class="small-note">Track screen time, distance, strain, and break patterns in real time.</p>
                </div>
                <a class="btn btn-accent align-self-start" href="{% url 'home' %}"><i class="fas fa-arrow-left me-2"></i>Home</a>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3"><i class="fas fa-clock text-accent me-2"></i>Screen Time</h5>
                    <div class="display-5 mb-2" id="screenTimeDisplay">00:00</div>
                    <p class="small-note mb-3">Total focus time today</p>
                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-accent btn-sm" id="screenTimerStart">Start</button>
                        <button class="btn btn-outline-light btn-sm" id="screenTimerPause">Pause</button>
                        <button class="btn btn-outline-light btn-sm" id="screenTimerReset">Reset</button>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3"><i class="fas fa-ruler-vertical text-accent me-2"></i>Viewing Distance</h5>
                    <div class="display-5 mb-2" id="distanceDisplay">-- cm</div>
                    <p class="small-note mb-3">Optimal: 50-70 cm</p>
                    <div id="distanceStatus" class="status-pill">Distance monitoring ready</div>
                </div>
            </div>
        </div>

        <div class="glass-card p-4 mb-4">
            <h5 class="mb-3"><i class="fas fa-fire text-accent me-2"></i>20-20-20 Break Timer</h5>
            <p class="small-note mb-3">Every 20 minutes, look at something 20 feet away for 20 seconds.</p>
            <div class="row align-items-center">
                <div class="col-md-6">
                    <div class="display-6" id="breakTimer">20:00</div>
                    <p class="small-note" id="breakStatus">Timer ready</p>
                </div>
                <div class="col-md-6">
                    <button class="btn btn-accent" id="breakTimerStart">Start 20-20-20</button>
                    <button class="btn btn-outline-light ms-2" id="breakTimerReset">Reset</button>
                </div>
            </div>
        </div>

        <div class="glass-card p-4">
            <h5 class="mb-3"><i class="fas fa-chart-line text-accent me-2"></i>Eye Strain Risk</h5>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="glass-card p-3">
                        <p class="small-note mb-2">Risk Level:</p>
                        <p class="text-white mb-0"><strong id="strainLevel">Low</strong></p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="glass-card p-3">
                        <p class="small-note mb-2">Blinks This Hour:</p>
                        <p class="text-white mb-0"><strong id="blinkCount">-- </strong></p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="glass-card p-3">
                        <p class="small-note mb-2">Recommendation:</p>
                        <p class="text-white mb-0"><strong id="strainRecommendation">Take a break</strong></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="glass-card p-4 h-100">
            <h5 class="mb-3"><i class="fas fa-lightbulb text-accent me-2"></i>Pro Tips</h5>
            <ul class="list-unstyled small-note mb-0">
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i><strong>Screen Time:</strong> Limit continuous screen use to 2 hours.</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i><strong>Distance:</strong> Keep screen at arm's length (50-70cm).</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i><strong>Breaks:</strong> Use the 20-20-20 timer to stay on track.</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i><strong>Strain:</strong> Blinks naturally decrease on screens—watch for dry eyes.</li>
                <li><i class="fas fa-circle-notch text-accent me-2"></i><strong>Brightness:</strong> Match screen brightness to your environment.</li>
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
            <p class="text-uppercase text-accent mb-3 small-note">Healthy Habits</p>
            <h1 class="section-heading mb-3">Track daily wellness habits & streaks</h1>
            <p class="small-note">Build consistent eye care and wellness routines with daily tracking.</p>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-lg-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3"><i class="fas fa-droplet text-accent me-2"></i>Water Intake</h5>
                    <p class="small-note mb-3">Goal: 8 glasses per day</p>
                    <div class="progress mb-3" style="height:1.5rem;">
                        <div class="progress-bar" id="waterProgressBar" role="progressbar" style="width: 0%"></div>
                    </div>
                    <p class="mb-3"><strong id="waterCount">0</strong> / 8 glasses</p>
                    <button class="btn btn-accent" id="addWaterButton">+ Add Glass</button>
                    <button class="btn btn-outline-light ms-2" id="resetWaterButton">Reset</button>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3"><i class="fas fa-moon text-accent me-2"></i>Sleep Hours</h5>
                    <p class="small-note mb-3">Recommended: 7-8 hours</p>
                    <div class="input-group mb-3">
                        <input type="number" id="sleepHours" class="form-control bg-transparent text-white border-light" placeholder="7.5" min="0" max="24" step="0.5" style="max-width:100px;">
                        <button class="btn btn-accent" id="setSleepButton">Set</button>
                    </div>
                    <p><strong id="sleepDisplay">-- hours</strong></p>
                </div>
            </div>
        </div>

        <div class="glass-card p-4 mb-4">
            <h5 class="mb-3"><i class="fas fa-eye text-accent me-2"></i>Eye Exercises</h5>
            <p class="small-note mb-3">Complete exercises to strengthen eye health. Click to start an exercise.</p>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="glass-card p-3 exercise-card" data-exercise="blink">
                        <h6 class="mb-2">Blink Exercise</h6>
                        <p class="small-note mb-0">Refresh your eyes with controlled blinking.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="glass-card p-3 exercise-card" data-exercise="focus-shift">
                        <h6 class="mb-2">Focus-Near-Far</h6>
                        <p class="small-note mb-0">Shift focus between near and far objects.</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="glass-card p-3 exercise-card" data-exercise="palming">
                        <h6 class="mb-2">Palming Exercise</h6>
                        <p class="small-note mb-0">Relax your eyes with gentle palming.</p>
                    </div>
                </div>
            </div>
            <div id="exerciseModal" class="glass-card p-4 mt-3" style="display:none;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h6 id="exerciseTitle">Exercise</h6>
                    <button class="btn-close btn-close-white" id="closeExerciseModal"></button>
                </div>
                <div id="exerciseInstructions" class="small-note mb-3"></div>
                <button class="btn btn-accent" id="completeExerciseButton">Mark Complete</button>
            </div>
            <p class="mt-3"><strong id="exerciseCount">0</strong> exercises completed today</p>
        </div>

        <div class="glass-card p-4">
            <h5 class="mb-3"><i class="fas fa-medal text-accent me-2"></i>Daily Wellness Score</h5>
            <div class="row align-items-center">
                <div class="col-md-6">
                    <div class="display-4 mb-2"><span id="wellnessScore">0</span> <span style="font-size:0.5em;">/100</span></div>
                    <div class="progress" style="height:1rem;">
                        <div class="progress-bar" id="scoreProgressBar" role="progressbar" style="width: 0%"></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <ul class="list-unstyled small-note mb-0" id="scoreBreakdown">
                        <li><i class="fas fa-check-circle text-success me-2"></i>Water intake: +0</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Eye exercises: +0</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Screen breaks: +0</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Screen distance: +0</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="glass-card p-4 h-100">
            <h5 class="mb-3"><i class="fas fa-fire text-accent me-2"></i>Streak Counter</h5>
            <p class="small-note mb-3">How many days have you maintained good wellness habits?</p>
            <div class="glass-card p-4 text-center mb-3">
                <div class="display-3" id="streakDays">0</div>
                <p class="small-note">Day Streak</p>
            </div>
            <button class="btn btn-accent w-100" id="incrementStreakButton">Increment Streak</button>
            <button class="btn btn-outline-light w-100 mt-2" id="resetStreakButton">Reset Streak</button>
            <div id="streakMessage" class="mt-3 text-center small-note"></div>
        </div>
    </div>
</div>

<script>
const exerciseData = {
    'blink': {
        title: 'Blink Exercise (2 min)',
        instructions: 'Blink slowly and deliberately 20 times. Close your eyes for 2 seconds between blinks. This refreshes your tear film and reduces dryness.'
    },
    'focus-shift': {
        title: 'Focus-Near-Far Exercise (3 min)',
        instructions: 'Look at something near (30cm away) for 10 seconds, then at something far (6m+) for 10 seconds. Repeat 5 times. This relaxes your eye muscles.'
    },
    'palming': {
        title: 'Palming Exercise (3 min)',
        instructions: 'Cup your palms over your closed eyes without pressing. Relax in darkness for 3 minutes. Let your eyes rest completely. Remove your hands slowly.'
    }
};

document.querySelectorAll('.exercise-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
        const exercise = this.dataset.exercise;
        const data = exerciseData[exercise];
        document.getElementById('exerciseTitle').textContent = data.title;
        document.getElementById('exerciseInstructions').textContent = data.instructions;
        document.getElementById('exerciseModal').style.display = 'block';
        document.getElementById('exerciseModal').dataset.currentExercise = exercise;
    });
});

document.getElementById('closeExerciseModal').addEventListener('click', function() {
    document.getElementById('exerciseModal').style.display = 'none';
});
</script>
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

    // Screen Health Page
    function initScreenHealth() {
        const screenStartBtn = document.getElementById('screenTimerStart');
        const screenPauseBtn = document.getElementById('screenTimerPause');
        const screenResetBtn = document.getElementById('screenTimerReset');
        const screenDisplay = document.getElementById('screenTimeDisplay');
        const breakTimerStart = document.getElementById('breakTimerStart');
        const breakTimerReset = document.getElementById('breakTimerReset');
        const breakDisplay = document.getElementById('breakTimer');
        const breakStatus = document.getElementById('breakStatus');
        const strainLevel = document.getElementById('strainLevel');

        let screenSeconds = 0;
        let breakSeconds = 1200; // 20 minutes
        let screenInterval = null;
        let breakInterval = null;

        function updateScreenDisplay() {
            screenDisplay.textContent = formatTime(screenSeconds);
            if (screenSeconds >= 40 * 60) {
                strainLevel.textContent = 'High';
                strainLevel.parentElement.style.color = '#ff6b6b';
            } else if (screenSeconds >= 20 * 60) {
                strainLevel.textContent = 'Medium';
                strainLevel.parentElement.style.color = '#ffa500';
            } else {
                strainLevel.textContent = 'Low';
                strainLevel.parentElement.style.color = '#4ad7a8';
            }
        }

        function updateBreakDisplay() {
            breakDisplay.textContent = formatTime(breakSeconds);
            if (breakSeconds <= 0) {
                breakStatus.textContent = '✓ Time for a break!';
                breakStatus.className = 'status-pill';
                clearInterval(breakInterval);
                breakInterval = null;
            } else if (breakSeconds <= 60) {
                breakStatus.textContent = 'Break time coming soon...';
            } else {
                breakStatus.textContent = 'Break timer running...';
            }
        }

        screenStartBtn.addEventListener('click', function() {
            if (screenInterval) return;
            screenInterval = setInterval(() => {
                screenSeconds += 1;
                updateScreenDisplay();
            }, 1000);
        });

        screenPauseBtn.addEventListener('click', function() {
            if (screenInterval) {
                clearInterval(screenInterval);
                screenInterval = null;
            }
        });

        screenResetBtn.addEventListener('click', function() {
            if (screenInterval) {
                clearInterval(screenInterval);
                screenInterval = null;
            }
            screenSeconds = 0;
            updateScreenDisplay();
        });

        breakTimerStart.addEventListener('click', function() {
            if (breakInterval) return;
            breakInterval = setInterval(() => {
                breakSeconds -= 1;
                updateBreakDisplay();
            }, 1000);
        });

        breakTimerReset.addEventListener('click', function() {
            if (breakInterval) {
                clearInterval(breakInterval);
                breakInterval = null;
            }
            breakSeconds = 1200;
            updateBreakDisplay();
        });

        updateScreenDisplay();
        updateBreakDisplay();
    }

    // Wellness Tracker Page
    function initWellnessTracker() {
        const addWaterBtn = document.getElementById('addWaterButton');
        const resetWaterBtn = document.getElementById('resetWaterButton');
        const waterCount = document.getElementById('waterCount');
        const waterProgressBar = document.getElementById('waterProgressBar');
        
        const setSleepBtn = document.getElementById('setSleepButton');
        const sleepInput = document.getElementById('sleepHours');
        const sleepDisplay = document.getElementById('sleepDisplay');
        
        const exerciseCount = document.getElementById('exerciseCount');
        const completeExerciseBtn = document.getElementById('completeExerciseButton');
        
        const wellnessScore = document.getElementById('wellnessScore');
        const scoreProgressBar = document.getElementById('scoreProgressBar');
        
        const streakDays = document.getElementById('streakDays');
        const incrementStreakBtn = document.getElementById('incrementStreakButton');
        const resetStreakBtn = document.getElementById('resetStreakButton');
        const streakMessage = document.getElementById('streakMessage');

        let water = Number(localStorage.getItem('ocusense_water') || 0);
        let exercises = Number(localStorage.getItem('ocusense_exercises') || 0);
        let sleep = Number(localStorage.getItem('ocusense_sleep') || 0);
        let streak = Number(localStorage.getItem('ocusense_streak') || 0);

        function computeScore() {
            const waterPoints = Math.min(25, water * 3.125);
            const exercisePoints = Math.min(25, exercises * 8.33);
            const sleepPoints = sleep >= 7 && sleep <= 8 ? 25 : (sleep > 8 ? 20 : 15);
            const screenDistance = 25;
            return Math.min(100, Math.round(waterPoints + exercisePoints + sleepPoints + screenDistance));
        }

        function render() {
            waterCount.textContent = water;
            waterProgressBar.style.width = (water / 8 * 100) + '%';
            
            sleepDisplay.textContent = sleep ? `${sleep} hours` : '-- hours';
            
            exerciseCount.textContent = exercises;
            
            const score = computeScore();
            wellnessScore.textContent = score;
            scoreProgressBar.style.width = score + '%';
            
            streakDays.textContent = streak;
            
            localStorage.setItem('ocusense_water', water);
            localStorage.setItem('ocusense_exercises', exercises);
            localStorage.setItem('ocusense_sleep', sleep);
            localStorage.setItem('ocusense_streak', streak);
        }

        addWaterBtn.addEventListener('click', function() {
            if (water < 8) water += 1;
            render();
        });

        resetWaterBtn.addEventListener('click', function() {
            water = 0;
            render();
        });

        setSleepBtn.addEventListener('click', function() {
            const val = parseFloat(sleepInput.value);
            if (!isNaN(val) && val >= 0 && val <= 24) {
                sleep = val;
                render();
            }
        });

        completeExerciseBtn.addEventListener('click', function() {
            exercises += 1;
            document.getElementById('exerciseModal').style.display = 'none';
            render();
        });

        incrementStreakBtn.addEventListener('click', function() {
            streak += 1;
            streakMessage.textContent = streak % 7 === 0 ? '🎉 Week milestone reached!' : '';
            render();
        });

        resetStreakBtn.addEventListener('click', function() {
            streak = 0;
            streakMessage.textContent = '';
            render();
        });

        render();
    }

    // Camera Monitor Page
    function initCameraMonitor() {
        const video = document.getElementById('cameraVideo');
        const startBtn = document.getElementById('startCameraButton');
        const statusEl = document.getElementById('cameraStatus');
        const blinkEl = document.getElementById('blinkCount');
        const distanceEl = document.getElementById('distanceValue');

        if (!video) return;

        let stream = null;
        let blinkCount = 0;
        let simulationInterval = null;

        function stopCamera() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
            }
            video.srcObject = null;
            startBtn.innerHTML = '<i class="fas fa-play me-2"></i>Start Camera';
            statusEl.textContent = 'Stopped';
        }

        async function startCam() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
                await video.play();
                startBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Camera';
                statusEl.textContent = 'Camera active';
                blinkCount = 0;
                blinkEl.textContent = blinkCount;
                distanceEl.textContent = '-- cm';

                simulationInterval = setInterval(function() {
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
                startCam();
            }
        });
    }

    // Medicine Reminder Page
    function initMedicineReminder() {
        const form = document.getElementById('medicineForm');
        if (!form) return;

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
            if (!id) return;

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
        if (document.getElementById('addWaterButton')) {
            initWellnessTracker();
        }
        if (document.getElementById('startCameraButton')) {
            initCameraMonitor();
        }
        if (document.getElementById('medicineForm')) {
            initMedicineReminder();
        }
    });
})();
'''

(app_templates / 'screen_health.html').write_text(screen_health_html, encoding='utf-8')
(app_templates / 'wellness_tracker.html').write_text(wellness_tracker_html, encoding='utf-8')
(static_dir / 'app.js').write_text(app_js, encoding='utf-8')
print('Restructured templates with clearer separation of concerns.')
