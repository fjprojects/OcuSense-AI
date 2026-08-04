import React, { useCallback, useEffect, useMemo, useState } from "react";
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
