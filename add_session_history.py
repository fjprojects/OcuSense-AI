from pathlib import Path

root = Path.cwd()

# 1 models.py
p = root/'eyeapp/models.py'
t = p.read_text(encoding='utf-8')
if 'class MonitoringSession(models.Model):' not in t:
    t += '''\n\nclass MonitoringSession(models.Model):\n    duration_seconds = models.PositiveIntegerField(default=0)\n    total_blinks = models.PositiveIntegerField(default=0)\n    average_blink_rate = models.FloatField(default=0)\n    average_posture_score = models.FloatField(default=0)\n    distance_warnings = models.PositiveIntegerField(default=0)\n    low_blink_warnings = models.PositiveIntegerField(default=0)\n    started_at = models.DateTimeField()\n    ended_at = models.DateTimeField()\n    created_at = models.DateTimeField(auto_now_add=True)\n\n    class Meta:\n        ordering = ["-started_at"]\n\n    def __str__(self):\n        return f"Monitoring session {self.started_at:%Y-%m-%d %H:%M}"\n'''
p.write_text(t, encoding='utf-8')

# 2 serializers.py
p = root/'eyeapp/serializers.py'
t = p.read_text(encoding='utf-8')
t = t.replace('from .models import ContactMessage', 'from .models import ContactMessage, MonitoringSession')
if 'class MonitoringSessionSerializer' not in t:
    t += '''\n\nclass MonitoringSessionSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = MonitoringSession\n        fields = "__all__"\n        read_only_fields = ["id", "created_at"]\n'''
p.write_text(t, encoding='utf-8')

# 3 views.py imports and endpoints
p = root/'eyeapp/views.py'
t = p.read_text(encoding='utf-8')
t = t.replace('from .models import ContactMessage, MedicineReminder', 'from .models import ContactMessage, MedicineReminder, MonitoringSession')
t = t.replace('from .serializers import ContactMessageSerializer', 'from .serializers import ContactMessageSerializer, MonitoringSessionSerializer')
if 'def monitoring_sessions_api' not in t:
    insert = '''\n\n# =========================================================\n# MONITORING SESSION API\n# =========================================================\n\n@csrf_exempt\n@require_http_methods(["GET", "POST"])\ndef monitoring_sessions_api(request):\n    if request.method == "GET":\n        sessions = MonitoringSession.objects.all()[:100]\n        serializer = MonitoringSessionSerializer(sessions, many=True)\n        return JsonResponse({"sessions": serializer.data})\n\n    try:\n        data = json.loads(request.body or "{}")\n    except json.JSONDecodeError:\n        return JsonResponse({"error": "Invalid JSON data"}, status=400)\n\n    serializer = MonitoringSessionSerializer(data=data)\n    if serializer.is_valid():\n        session = serializer.save()\n        return JsonResponse(\n            MonitoringSessionSerializer(session).data,\n            status=201,\n        )\n\n    return JsonResponse({"errors": serializer.errors}, status=400)\n\n\n@csrf_exempt\n@require_http_methods(["DELETE"])\ndef monitoring_session_delete_api(request, session_id):\n    try:\n        session = MonitoringSession.objects.get(id=session_id)\n    except MonitoringSession.DoesNotExist:\n        return JsonResponse({"error": "Session not found"}, status=404)\n\n    session.delete()\n    return JsonResponse({"deleted": True})\n'''
    # insert before REST FRAMEWORK CONTACT VIEW section
    marker = '# =========================================================\n# REST FRAMEWORK CONTACT VIEW'
    t = t.replace(marker, insert + '\n\n' + marker)
p.write_text(t, encoding='utf-8')

# 4 urls.py
p = root/'eyeapp/urls.py'
t = p.read_text(encoding='utf-8')
if 'api/sessions/' not in t:
    marker = '    path("api/contact/", views.contact_api, name="contact_api"),\n'
    add = '''    path("api/sessions/", views.monitoring_sessions_api, name="monitoring-sessions"),\n    path(\n        "api/sessions/<int:session_id>/",\n        views.monitoring_session_delete_api,\n        name="monitoring-session-delete",\n    ),\n\n'''
    t = t.replace(marker, add + marker)
p.write_text(t, encoding='utf-8')

# 5 admin.py
p = root/'eyeapp/admin.py'
t = p.read_text(encoding='utf-8')
if 'MonitoringSession' not in t:
    t += '''\nfrom .models import MonitoringSession\n\n@admin.register(MonitoringSession)\nclass MonitoringSessionAdmin(admin.ModelAdmin):\n    list_display = (\n        "started_at",\n        "duration_seconds",\n        "total_blinks",\n        "average_blink_rate",\n        "average_posture_score",\n    )\n    ordering = ("-started_at",)\n'''
p.write_text(t, encoding='utf-8')

# 6 SessionHistory component
p = root/'frontend/src/components/SessionHistory.jsx'
p.write_text(r'''import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "./Toast";

const formatDuration = (seconds = 0) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const SessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sessions/");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load session history");
      }

      setSessions(data.sessions || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const summary = useMemo(() => {
    if (!sessions.length) {
      return { sessions: 0, time: 0, blinks: 0, posture: 0 };
    }

    const totalTime = sessions.reduce(
      (sum, session) => sum + session.duration_seconds,
      0
    );
    const totalBlinks = sessions.reduce(
      (sum, session) => sum + session.total_blinks,
      0
    );
    const averagePosture =
      sessions.reduce(
        (sum, session) => sum + Number(session.average_posture_score),
        0
      ) / sessions.length;

    return {
      sessions: sessions.length,
      time: totalTime,
      blinks: totalBlinks,
      posture: averagePosture,
    };
  }, [sessions]);

  const deleteSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete session");
      }

      setSessions((current) =>
        current.filter((session) => session.id !== sessionId)
      );
      showToast("Session deleted", "info");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="glass-card p-5">
          <p className="text-uppercase text-accent mb-3 small-note">
            Monitoring reports
          </p>
          <h1 className="section-heading mb-3">Session History</h1>
          <p className="small-note mb-0">
            Review your saved camera-monitoring sessions and eye-health trends.
          </p>
        </div>
      </div>

      <div className="col-md-3">
        <div className="glass-card p-4 h-100">
          <p className="small-note mb-1">Sessions</p>
          <h3>{summary.sessions}</h3>
        </div>
      </div>
      <div className="col-md-3">
        <div className="glass-card p-4 h-100">
          <p className="small-note mb-1">Total monitoring</p>
          <h3>{formatDuration(summary.time)}</h3>
        </div>
      </div>
      <div className="col-md-3">
        <div className="glass-card p-4 h-100">
          <p className="small-note mb-1">Total blinks</p>
          <h3>{summary.blinks}</h3>
        </div>
      </div>
      <div className="col-md-3">
        <div className="glass-card p-4 h-100">
          <p className="small-note mb-1">Average posture</p>
          <h3>{summary.posture.toFixed(0)}%</h3>
        </div>
      </div>

      <div className="col-12">
        <div className="glass-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Saved sessions</h5>
            <button className="btn btn-outline-light" onClick={loadSessions}>
              <i className="fas fa-rotate me-2"></i>Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border" role="status"></span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-5 small-note">
              No monitoring sessions saved yet. Start and stop the camera to
              create your first report.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Blinks</th>
                    <th>Avg rate</th>
                    <th>Posture</th>
                    <th>Warnings</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{new Date(session.started_at).toLocaleString()}</td>
                      <td>{formatDuration(session.duration_seconds)}</td>
                      <td>{session.total_blinks}</td>
                      <td>{Number(session.average_blink_rate).toFixed(1)}/min</td>
                      <td>{Number(session.average_posture_score).toFixed(0)}%</td>
                      <td>
                        Distance: {session.distance_warnings}<br />
                        Low blink: {session.low_blink_warnings}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteSession(session.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
''', encoding='utf-8')

# 7 App.js
p = root/'frontend/src/App.js'
t = p.read_text(encoding='utf-8')
if 'SessionHistory' not in t:
    t = t.replace('import CameraMonitor from "./components/CameraMonitor";', 'import CameraMonitor from "./components/CameraMonitor";\nimport SessionHistory from "./components/SessionHistory";')
    t = t.replace('''                <Route
                  path="/medicine-reminder"
                  element={<MedicineReminder />}
                />''', '''                <Route
                  path="/medicine-reminder"
                  element={<MedicineReminder />}
                />
                <Route
                  path="/session-history"
                  element={<SessionHistory />}
                />''')
p.write_text(t, encoding='utf-8')

# 8 Navbar
p = root/'frontend/src/components/Navbar.jsx'
t = p.read_text(encoding='utf-8')
if 'Session History' not in t:
    marker = '''            <li className="nav-item">
              <NavLink 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                } 
                to="/medicine-reminder"
              >
                Medicine Reminder
              </NavLink>
            </li>'''
    add = marker + '''
            <li className="nav-item">
              <NavLink
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                to="/session-history"
              >
                Session History
              </NavLink>
            </li>'''
    t = t.replace(marker, add)
p.write_text(t, encoding='utf-8')

# 9 CameraMonitor targeted modifications
p = root/'frontend/src/components/CameraMonitor.jsx'
t = p.read_text(encoding='utf-8')

# add refs
if 'sessionStartRef' not in t:
    marker = (
        '  const alertAudioRef = useRef(null);'
        if '  const alertAudioRef = useRef(null);' in t
        else '  const animationFrameRef = useRef(null);'
    )
    if marker not in t:
        raise SystemExit('Could not find CameraMonitor refs insertion point.')
    t = t.replace(marker, marker + '''
  const sessionStartRef = useRef(null);
  const postureTotalRef = useRef(0);
  const postureSampleCountRef = useRef(0);
  const warningCountsRef = useRef({
    distance: 0,
    lowBlink: 0
  });''', 1)

# increment warning counts in triggerSmartAlert
old = '''    if (issueDuration >= holdDurationMs && cooldownFinished) {
      showToast(message, type);'''
new = '''    if (issueDuration >= holdDurationMs && cooldownFinished) {
      if (key === "tooClose") {
        warningCountsRef.current.distance += 1;
      }

      if (key === "lowBlinkRate") {
        warningCountsRef.current.lowBlink += 1;
      }

      showToast(message, type);'''
if old in t:
    t = t.replace(old, new, 1)

# collect posture samples at final posture calculation
old = '''    setPosture(postureResult.posture);
    setPostureScore(postureResult.score);

    triggerSmartAlert('''
new = '''    setPosture(postureResult.posture);
    setPostureScore(postureResult.score);
    postureTotalRef.current += postureResult.score;
    postureSampleCountRef.current += 1;

    triggerSmartAlert('''
if old in t:
    t = t.replace(old, new, 1)

# add save function before STOP CAMERA
marker = '  // ==================== STOP CAMERA ===================='
if 'const saveMonitoringSession' not in t:
    func = '''  // ==================== SAVE MONITORING SESSION ====================
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

'''
    t = t.replace(marker, func + marker)

# call save at beginning of stopCamera before tracks are stopped
old = '''  const stopCamera = useCallback(async () => {
    if (animationFrameRef.current) {'''
new = '''  const stopCamera = useCallback(async () => {
    if (sessionStartRef.current) {
      try {
        await saveMonitoringSession();
        showToast("Monitoring session saved", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    }

    if (animationFrameRef.current) {'''
if old in t:
    t = t.replace(old, new, 1)

# reset sessionStartRef on stop
old = '''    setSessionStart(null);
    setSessionTime(0);'''
new = '''    setSessionStart(null);
    sessionStartRef.current = null;
    setSessionTime(0);'''
if old in t:
    t = t.replace(old, new, 1)

# stop callback deps
old = '  }, [showToast]);\n\n  // ==================== START CAMERA'
new = '  }, [saveMonitoringSession, showToast]);\n\n  // ==================== START CAMERA'
if old in t:
    t = t.replace(old, new, 1)

# set start ref and reset accumulators
old = '''      setIsCameraActive(true);
      setStatus("Calibrating...");
      setSessionStart(Date.now());'''
new = '''      const startedAt = Date.now();
      setIsCameraActive(true);
      setStatus("Calibrating...");
      setSessionStart(startedAt);
      sessionStartRef.current = startedAt;
      postureTotalRef.current = 0;
      postureSampleCountRef.current = 0;
      warningCountsRef.current = {
        distance: 0,
        lowBlink: 0
      };'''
if old in t:
    t = t.replace(old, new, 1)

p.write_text(t, encoding='utf-8')

# 10 migration
migration = root/'eyeapp/migrations/0005_monitoringsession.py'
if not migration.exists():
    migration.write_text('''from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("eyeapp", "0004_contactmessage"),
    ]

    operations = [
        migrations.CreateModel(
            name="MonitoringSession",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("duration_seconds", models.PositiveIntegerField(default=0)),
                ("total_blinks", models.PositiveIntegerField(default=0)),
                ("average_blink_rate", models.FloatField(default=0)),
                ("average_posture_score", models.FloatField(default=0)),
                ("distance_warnings", models.PositiveIntegerField(default=0)),
                ("low_blink_warnings", models.PositiveIntegerField(default=0)),
                ("started_at", models.DateTimeField()),
                ("ended_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-started_at"]},
        ),
    ]
''', encoding='utf-8')

print('Session history feature added.')
