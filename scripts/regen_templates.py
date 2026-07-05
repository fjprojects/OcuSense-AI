from pathlib import Path

def write(path, content):
    path.write_text(content, encoding='utf-8')

root = Path(r"c:\Users\francis\OneDrive\Documents\dry eye project")
app_templates = root / "eyeapp" / "templates"
app_templates.mkdir(parents=True, exist_ok=True)

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

        .feature-start {
            color: #ffffff;
            font-weight: 600;
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
    {% block scripts %}{% endblock %}
</body>
</html>
'''

home_html = '''{% extends 'base.html' %}
{% block title %}Ocusense Arena | Home{% endblock %}
{% block content %}
<div class="row align-items-center gy-4">
    <div class="col-lg-7">
        <div class="glass-card p-5 hero-panel">
            <p class="text-uppercase text-accent mb-3 small-note">AI-powered eye wellness assistant</p>
            <h1 class="display-5 fw-bold mb-3">Ocusense Arena</h1>
            <p class="lead text-white-75 mb-4">A modern dashboard for screen health, camera monitoring, wellness tracking, and medicine scheduling with a polished, SaaS-ready interface.</p>
            <div class="d-flex flex-column flex-sm-row gap-3">
                <a class="btn btn-accent btn-lg" href="{% url 'screen_health' %}">Get Started</a>
                <a class="btn btn-outline-light btn-lg" href="{% url 'about' %}">Learn More</a>
            </div>
        </div>
    </div>
    <div class="col-lg-5">
        <div class="glass-card p-4 h-100">
            <h2 class="h4 section-heading mb-3">Why Ocusense Arena?</h2>
            <ul class="list-unstyled small-note mb-0">
                <li class="mb-3"><i class="fas fa-check-circle text-success me-2"></i>Dedicated pages for each feature.</li>
                <li class="mb-3"><i class="fas fa-check-circle text-success me-2"></i>Clean dashboard layout with glassmorphism panels.</li>
                <li><i class="fas fa-check-circle text-success me-2"></i>Responsive navigation and modern SaaS styling.</li>
            </ul>
        </div>
    </div>
</div>

<section class="mt-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
            <p class="text-uppercase text-accent mb-2">Feature overview</p>
            <h2 class="section-heading">Explore each module</h2>
            <p class="small-note">Navigate to the dedicated module pages for focused workflows and clearer presentation.</p>
        </div>
    </div>
    <div class="row g-4">
        <div class="col-md-6 col-xl-4">
            <div class="glass-card p-4 feature-card h-100">
                <div class="d-flex align-items-center mb-3"><div class="icon me-3"><i class="fas fa-clock"></i></div><div><h5 class="mb-0">Screen Health</h5></div></div>
                <p class="small-note mb-4">Monitor screen time, viewing distance, and eye strain analysis from a dedicated dashboard.</p>
                <a class="btn btn-outline-light" href="{% url 'screen_health' %}">Open Module</a>
            </div>
        </div>
        <div class="col-md-6 col-xl-4">
            <div class="glass-card p-4 feature-card h-100">
                <div class="d-flex align-items-center mb-3"><div class="icon me-3"><i class="fas fa-video"></i></div><div><h5 class="mb-0">Camera Monitor</h5></div></div>
                <p class="small-note mb-4">Launch live camera blink detection and face distance monitoring in one place.</p>
                <a class="btn btn-outline-light" href="{% url 'camera_monitoring' %}">Open Module</a>
            </div>
        </div>
        <div class="col-md-6 col-xl-4">
            <div class="glass-card p-4 feature-card h-100">
                <div class="d-flex align-items-center mb-3"><div class="icon me-3"><i class="fas fa-heartbeat"></i></div><div><h5 class="mb-0">Wellness Tracker</h5></div></div>
                <p class="small-note mb-4">Track hydration and eye exercises with a wellness-focused experience.</p>
                <a class="btn btn-outline-light" href="{% url 'wellness_tracker' %}">Open Module</a>
            </div>
        </div>
        <div class="col-md-6 col-xl-4">
            <div class="glass-card p-4 feature-card h-100">
                <div class="d-flex align-items-center mb-3"><div class="icon me-3"><i class="fas fa-pills"></i></div><div><h5 class="mb-0">Medicine Reminder</h5></div></div>
                <p class="small-note mb-4">Schedule reminders for eye care medication and track alerts.</p>
                <a class="btn btn-outline-light" href="{% url 'medicine_reminder' %}">Open Module</a>
            </div>
        </div>
        <div class="col-md-6 col-xl-4">
            <div class="glass-card p-4 feature-card h-100">
                <div class="d-flex align-items-center mb-3"><div class="icon me-3"><i class="fas fa-info-circle"></i></div><div><h5 class="mb-0">About</h5></div></div>
                <p class="small-note mb-4">Read the project objective, technology stack, and design approach.</p>
                <a class="btn btn-outline-light" href="{% url 'about' %}">View About</a>
            </div>
        </div>
        <div class="col-md-6 col-xl-4">
            <div class="glass-card p-4 feature-card h-100">
                <div class="d-flex align-items-center mb-3"><div class="icon me-3"><i class="fas fa-envelope"></i></div><div><h5 class="mb-0">Contact</h5></div></div>
                <p class="small-note mb-4">Reach out for feedback, support, or demo presentation details.</p>
                <a class="btn btn-outline-light" href="{% url 'contact' %}">Contact Us</a>
            </div>
        </div>
    </div>
</section>
{% endblock %}
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
                    <p class="small-note">Review screen time, viewing distance, and eye strain metrics from a focused page experience.</p>
                </div>
                <a class="btn btn-accent align-self-start" href="{% url 'home' %}"><i class="fas fa-arrow-left me-2"></i>Back to Home</a>
            </div>
        </div>
        <div class="row g-4">
            <div class="col-md-4">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Screen Time</h5>
                    <p class="small-note">Track total focused time and rest recommendations.</p>
                    <div class="mt-4 status-pill">Safe usage zone</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Viewing Distance</h5>
                    <p class="small-note">Monitor your posture and distance in real time.</p>
                    <div class="mt-4 status-pill">Optimal distance</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Eye Strain</h5>
                    <p class="small-note">See recommended breaks and strain alerts for longer sessions.</p>
                    <div class="mt-4 status-pill">Low strain</div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="glass-card p-4 feature-list-card h-100">
            <h5 class="mb-3">Feature summary</h5>
            <ul class="list-unstyled small-note mb-0">
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Screen time tracker</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Viewing distance monitor</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Eye strain analysis</li>
                <li><i class="fas fa-circle-notch text-accent me-2"></i>Stats cards and guidance</li>
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
            <p class="small-note">Start your camera session, review live analytics, and keep your eyes safe during screen time.</p>
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
                    <p class="small-note mb-0">Begin your monitoring session when ready.</p>
                </div>
                <button class="btn btn-accent"><i class="fas fa-play me-2"></i>Start Camera</button>
            </div>
        </div>
        <div class="glass-card p-4">
            <h5 class="mb-3">Live Status</h5>
            <div class="row g-3 text-white-75">
                <div class="col-md-6">
                    <div class="glass-card p-3">Blink detection: <strong>Awaiting camera</strong></div>
                </div>
                <div class="col-md-6">
                    <div class="glass-card p-3">Face distance: <strong>-- cm</strong></div>
                </div>
                <div class="col-12">
                    <div class="glass-card p-3">Session note: <span class="small-note">Live monitoring UI is ready for integration.</span></div>
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
            <p class="small-note">A dedicated hub for hydration, eye exercises, and daily wellness scoring.</p>
        </div>
        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Hydration</h5>
                    <p class="small-note">Water intake tracker and reminder summary.</p>
                    <div class="mt-4 status-pill">Next reminder in 45m</div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="glass-card p-4 h-100">
                    <h5 class="mb-3">Eye Exercises</h5>
                    <p class="small-note">Short prompts to reduce eye strain during long sessions.</p>
                    <div class="mt-4 status-pill">3 exercises ready</div>
                </div>
            </div>
        </div>
        <div class="glass-card p-4">
            <h5 class="mb-3">Daily wellness score</h5>
            <p class="small-note">A quick summary of your daily eye wellness habits.</p>
            <div class="glass-card p-4 mt-3"><strong class="text-white">82%</strong> overall wellness score</div>
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
            <form>
                <div class="mb-3"><label class="form-label text-white-75">Medicine name</label><input type="text" class="form-control bg-transparent text-white border-light" placeholder="e.g. Eye drops"></div>
                <div class="mb-3"><label class="form-label text-white-75">Dosage</label><input type="text" class="form-control bg-transparent text-white border-light" placeholder="Optional dosage"></div>
                <div class="mb-3"><label class="form-label text-white-75">Time</label><input type="text" class="form-control bg-transparent text-white border-light" placeholder="07:30 PM"></div>
                <button type="button" class="btn btn-accent">Add Reminder</button>
            </form>
            <p class="mt-3 small-note">This form is styled for the new page layout and can be wired to your existing reminder API.</p>
        </div>
    </div>
    <div class="col-lg-6">
        <div class="glass-card p-4 h-100">
            <h5 class="mb-3">Upcoming reminders</h5>
            {% if reminders %}
                <ul class="list-unstyled">
                    {% for reminder in reminders %}
                        <li class="glass-card p-3 mb-3">
                            <div class="d-flex justify-content-between align-items-start gap-3">
                                <div>
                                    <h6 class="mb-1 text-white">{{ reminder.medicine_name }}</h6>
                                    <p class="small-note mb-1">Dosage: {{ reminder.dosage|default:'Not specified' }}</p>
                                    <p class="small-note mb-0">Time: {{ reminder.alarm_time|default:'Interval reminder' }}</p>
                                </div>
                                <span class="status-pill">{{ reminder.status }}</span>
                            </div>
                        </li>
                    {% endfor %}
                </ul>
            {% else %}
                <div class="text-center py-5 small-note">
                    <i class="fas fa-calendar-check fa-2x mb-3 text-accent"></i>
                    <p>No active medicine reminders yet.</p>
                </div>
            {% endif %}
        </div>
    </div>
</div>
{% endblock %}
'''

about_html = '''{% extends 'base.html' %}
{% block title %}About | Ocusense Arena{% endblock %}
{% block content %}
<div class="row gy-4">
    <div class="col-lg-8">
        <div class="glass-card p-5 mb-4">
            <p class="text-uppercase text-accent mb-3 small-note">About Ocusense Arena</p>
            <h1 class="section-heading mb-3">Project objective</h1>
            <p class="small-note">Ocusense Arena is designed to transform eye care into a professional, multi-page dashboard experience. It separates core features into dedicated pages and provides a clean interface for demos and classroom presentations.</p>
        </div>
        <div class="glass-card p-4 mb-4">
            <h5 class="mb-3">Technologies used</h5>
            <ul class="list-unstyled small-note mb-0">
                <li class="mb-2"><i class="fas fa-check-circle text-accent me-2"></i>Django</li>
                <li class="mb-2"><i class="fas fa-check-circle text-accent me-2"></i>Bootstrap 5</li>
                <li class="mb-2"><i class="fas fa-check-circle text-accent me-2"></i>FontAwesome icons</li>
                <li><i class="fas fa-check-circle text-accent me-2"></i>Glassmorphism and responsive SaaS design</li>
            </ul>
        </div>
        <div class="glass-card p-4">
            <h5 class="mb-3">Team</h5>
            <p class="small-note">This project is ideal for college demos, showcasing a polished architecture with separate feature pages and improved navigation.</p>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="glass-card p-4 h-100 feature-list-card">
            <h5 class="mb-3">Project highlights</h5>
            <ul class="list-unstyled small-note mb-0">
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Multi-page layout</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Dedicated module pages</li>
                <li class="mb-3"><i class="fas fa-circle-notch text-accent me-2"></i>Professional dashboard design</li>
                <li><i class="fas fa-circle-notch text-accent me-2"></i>Responsive mobile support</li>
            </ul>
        </div>
    </div>
</div>
{% endblock %}
'''

contact_html = '''{% extends 'base.html' %}
{% block title %}Contact | Ocusense Arena{% endblock %}
{% block content %}
<div class="row gy-4">
    <div class="col-lg-6">
        <div class="glass-card p-5 mb-4">
            <p class="text-uppercase text-accent mb-3 small-note">Contact us</p>
            <h1 class="section-heading mb-3">Let's connect</h1>
            <p class="small-note">Send feedback, request a demo, or ask about improvements for the EyeCare AI project.</p>
        </div>
        <div class="glass-card p-4">
            <h5 class="mb-3">Contact form</h5>
            <form>
                <div class="mb-3"><label class="form-label text-white-75">Name</label><input type="text" class="form-control bg-transparent text-white border-light" placeholder="Your name"></div>
                <div class="mb-3"><label class="form-label text-white-75">Email</label><input type="email" class="form-control bg-transparent text-white border-light" placeholder="email@example.com"></div>
                <div class="mb-3"><label class="form-label text-white-75">Message</label><textarea class="form-control bg-transparent text-white border-light" rows="4" placeholder="Hi, I'd like to..."></textarea></div>
                <button type="button" class="btn btn-accent">Send Message</button>
            </form>
        </div>
    </div>
    <div class="col-lg-6">
        <div class="glass-card p-4 h-100 feature-list-card">
            <h5 class="mb-3">Need help?</h5>
            <p class="small-note mb-4">Reach out by email or connect on social media.</p>
            <p class="mb-2"><strong>Email:</strong> <a class="text-accent" href="mailto:support@ocusense.ai">support@ocusense.ai</a></p>
            <p class="mb-4"><strong>Social:</strong></p>
            <a class="btn btn-outline-light me-2 mb-2" href="#"><i class="fab fa-linkedin me-2"></i>LinkedIn</a>
            <a class="btn btn-outline-light mb-2" href="#"><i class="fab fa-github me-2"></i>GitHub</a>
        </div>
    </div>
</div>
{% endblock %}
'''

write(app_templates / 'base.html', base_html)
write(app_templates / 'home.html', home_html)
write(app_templates / 'screen_health.html', screen_health_html)
write(app_templates / 'camera_monitoring.html', camera_monitoring_html)
write(app_templates / 'wellness_tracker.html', wellness_tracker_html)
write(app_templates / 'medicine_reminder.html', medicine_reminder_html)
write(app_templates / 'about.html', about_html)
write(app_templates / 'contact.html', contact_html)

# Update views.py
views_path = root / 'eyeapp' / 'views.py'
views_py = '''from datetime import datetime, timedelta
import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import MedicineReminder


def home(request):
    message = ""
    if request.method == "POST":
        screen_time = request.POST.get("time", "")
        try:
            screen_time_value = int(screen_time)
        except ValueError:
            screen_time_value = None

        if screen_time_value is None:
            message = "Please enter a valid number of minutes."
        elif screen_time_value >= 300:
            message = "⚠️ Warning: More than 5 hours of screen use. Take a long break and rest your eyes."
        elif screen_time_value > 40:
            message = "Your eyes need rest! Follow the 20-20-20 rule."
        else:
            message = "Screen time is safe."

    return render(request, "home.html", {"message": message, "active_page": "home"})


def screen_health(request):
    return render(request, "screen_health.html", {"active_page": "screen_health"})


def camera_monitoring(request):
    return render(request, "camera_monitoring.html", {"active_page": "camera_monitoring"})


def wellness_tracker(request):
    return render(request, "wellness_tracker.html", {"active_page": "wellness_tracker"})


def medicine_reminder(request):
    reminders = MedicineReminder.objects.filter(active=True)
    return render(request, "medicine_reminder.html", {"reminders": reminders, "active_page": "medicine_reminder"})


def about(request):
    return render(request, "about.html", {"active_page": "about"})


def contact(request):
    return render(request, "contact.html", {"active_page": "contact"})


def parse_alarm_time(alarm_time_str):
    alarm_time_str = alarm_time_str.strip().upper()
    try:
        parsed = datetime.strptime(alarm_time_str, '%I:%M %p')
    except ValueError:
        raise ValueError('Alarm time must use hh:mm AM/PM format, for example 07:30 PM')

    now = timezone.localtime()
    scheduled = datetime(
        year=now.year,
        month=now.month,
        day=now.day,
        hour=parsed.hour,
        minute=parsed.minute,
    )
    tz = timezone.get_current_timezone()
    scheduled_dt = timezone.make_aware(scheduled, tz)
    if scheduled_dt <= now:
        scheduled_dt += timedelta(days=1)
    return scheduled_dt


@require_http_methods(["POST"])
def add_medicine(request):
    try:
        data = json.loads(request.body)
        medicine_name = data.get('medicine_name', '').strip()
        dosage = data.get('dosage', '').strip()
        alarm_time = data.get('alarm_time', '').strip()
        repeat = bool(data.get('repeat', False))
        interval_minutes = int(data.get('interval_minutes', 0))

        if not medicine_name:
            return JsonResponse({'error': 'Medicine name is required'}, status=400)

        next_reminder_time = timezone.now()
        total_seconds = 0

        if alarm_time:
            next_reminder_time = parse_alarm_time(alarm_time)
            total_seconds = int((next_reminder_time - timezone.localtime()).total_seconds())
        elif interval_minutes > 0:
            next_reminder_time = timezone.now() + timedelta(minutes=interval_minutes)
            total_seconds = interval_minutes * 60
        else:
            return JsonResponse({'error': 'Provide an alarm time or interval minutes'}, status=400)

        medicine = MedicineReminder.objects.create(
            medicine_name=medicine_name,
            dosage=dosage,
            alarm_time=alarm_time,
            repeat=repeat,
            interval_minutes=interval_minutes,
            countdown_seconds=total_seconds,
            total_seconds=total_seconds,
            status='Pending',
            active=True,
            next_reminder_time=next_reminder_time
        )

        return JsonResponse({
            'id': medicine.id,
            'medicine_name': medicine.medicine_name,
            'dosage': medicine.dosage,
            'alarm_time': medicine.alarm_time,
            'repeat': medicine.repeat,
            'interval_minutes': medicine.interval_minutes,
            'countdown_seconds': medicine.countdown_seconds,
            'total_seconds': medicine.total_seconds,
            'status': medicine.status,
            'created_at': medicine.created_at.isoformat(),
            'next_reminder_time': medicine.next_reminder_time.isoformat(),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["GET"])
def get_medicines(request):
    medicines = MedicineReminder.objects.filter(active=True).order_by('-created_at')
    medicine_list = []
    for medicine in medicines:
        medicine_list.append({
            'id': medicine.id,
            'medicine_name': medicine.medicine_name,
            'dosage': medicine.dosage,
            'alarm_time': medicine.alarm_time,
            'repeat': medicine.repeat,
            'interval_minutes': medicine.interval_minutes,
            'countdown_seconds': medicine.countdown_seconds,
            'total_seconds': medicine.total_seconds,
            'status': medicine.status,
            'next_reminder_time': medicine.next_reminder_time.isoformat(),
            'created_at': medicine.created_at.isoformat()
        })
    return JsonResponse({'medicines': medicine_list})


@require_http_methods(["POST"])
def mark_medicine_taken(request):
    try:
        data = json.loads(request.body)
        medicine_id = data.get('medicine_id')
        medicine = MedicineReminder.objects.get(id=medicine_id)
        medicine.mark_taken()
        return JsonResponse({
            'id': medicine.id,
            'status': medicine.status,
            'countdown_seconds': medicine.countdown_seconds,
            'next_reminder_time': medicine.next_reminder_time.isoformat() if medicine.next_reminder_time else None
        })
    except MedicineReminder.DoesNotExist:
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["POST"])
def delete_medicine(request):
    try:
        data = json.loads(request.body)
        medicine_id = data.get('medicine_id')
        medicine = MedicineReminder.objects.get(id=medicine_id)
        medicine.active = False
        medicine.save()
        return JsonResponse({'id': medicine.id, 'deleted': True})
    except MedicineReminder.DoesNotExist:
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["POST"])
def update_medicine_countdown(request):
    try:
        data = json.loads(request.body)
        medicine_id = data.get('medicine_id')
        countdown_seconds = int(data.get('countdown_seconds', 0))
        status = data.get('status', 'Pending')
        medicine = MedicineReminder.objects.get(id=medicine_id)
        medicine.countdown_seconds = countdown_seconds
        medicine.status = status
        medicine.save(update_fields=['countdown_seconds', 'status', 'updated_at'])
        return JsonResponse({'id': medicine.id, 'countdown_seconds': medicine.countdown_seconds, 'status': medicine.status})
    except MedicineReminder.DoesNotExist:
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
'''
write(views_path, views_py)

# Update urls.py
urls_path = root / 'eyeapp' / 'urls.py'
urls_py = '''from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('screen-health/', views.screen_health, name='screen_health'),
    path('camera-monitoring/', views.camera_monitoring, name='camera_monitoring'),
    path('wellness-tracker/', views.wellness_tracker, name='wellness_tracker'),
    path('medicine-reminder/', views.medicine_reminder, name='medicine_reminder'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('sw.js', views.service_worker, name='service_worker'),
    path('api/medicines/add/', views.add_medicine, name='add_medicine'),
    path('api/medicines/get/', views.get_medicines, name='get_medicines'),
    path('api/medicines/taken/', views.mark_medicine_taken, name='mark_medicine_taken'),
    path('api/medicines/delete/', views.delete_medicine, name='delete_medicine'),
    path('api/medicines/countdown/', views.update_medicine_countdown, name='update_medicine_countdown'),
]
'''
write(urls_path, urls_py)

print('Templates, views, and URLs updated successfully.')
