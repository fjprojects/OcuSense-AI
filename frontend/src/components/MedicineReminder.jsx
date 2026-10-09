import React, { useState } from 'react';
import { useToast } from './Toast';
import { useMedicines } from './MedicineProvider';
import { enableReminderSound } from '../services/notifications';

const emptyMedicine = { name: '', dosage: '', repeat: true, time: '' };

const MedicineReminder = () => {
  const { medicines, isLoading, error, refresh, add, remove, toggle, taken } = useMedicines();
  const [newMedicine, setNewMedicine] = useState(emptyMedicine);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const perform = async (action, message) => {
    setBusy(true);
    try {
      await action();
      showToast(message, 'success');
    } catch (problem) {
      showToast(problem.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const addMedicine = async event => {
    event.preventDefault();
    if (!newMedicine.name.trim() || !newMedicine.time) {
      showToast('Enter a medicine name and alarm time', 'error');
      return;
    }
    await enableReminderSound().catch(() => {});
    await perform(async () => {
      await add({
        medicine_name: newMedicine.name.trim(), dosage: newMedicine.dosage.trim(),
        alarm_time: newMedicine.time, repeat: newMedicine.repeat,
        timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });
      setNewMedicine(emptyMedicine);
    }, 'Medicine reminder saved');
  };

  const enableAlerts = async () => {
    await enableReminderSound().catch(() => {});
    if (!('Notification' in window)) {
      showToast('In-app alerts are available while this app is open', 'info');
      return;
    }
    const permission = await Notification.requestPermission();
    showToast(permission === 'granted' ? 'Notifications enabled' : 'In-app alerts remain enabled', 'info');
  };

  return (
    <div className="row gy-4">
      <div className="col-lg-8">
        <div className="glass-card p-5 mb-4">
          <p className="text-uppercase text-accent mb-3 small-note">Medicine Reminder</p>
          <h1 className="section-heading mb-3">Track your eye care medication</h1>
          <p className="small-note">Save reminders for this browser and receive alerts while the app is open.</p>
          <button className="btn btn-outline-light" onClick={enableAlerts}>Enable alerts</button>
        </div>

        <div className="glass-card p-4 mb-4">
          <h5 className="mb-3">Add New Medicine</h5>
          <form className="row g-3" onSubmit={addMedicine}>
            <div className="col-md-6">
              <label htmlFor="medicine-name" className="small-note">Medicine name</label>
              <input id="medicine-name" type="text" maxLength={100} required
                className="form-control bg-transparent text-white border-light"
                value={newMedicine.name}
                onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label htmlFor="medicine-dosage" className="small-note">Dosage (optional)</label>
              <input id="medicine-dosage" type="text" maxLength={100}
                className="form-control bg-transparent text-white border-light"
                value={newMedicine.dosage}
                onChange={e => setNewMedicine({ ...newMedicine, dosage: e.target.value })} />
            </div>
            <div className="col-md-5">
              <label htmlFor="medicine-frequency" className="small-note">Frequency</label>
              <select id="medicine-frequency" className="form-select"
                value={newMedicine.repeat ? 'daily' : 'once'}
                onChange={e => setNewMedicine({ ...newMedicine, repeat: e.target.value === 'daily' })}>
                <option value="daily">Daily</option>
                <option value="once">One time</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="medicine-time" className="small-note">Alarm time (your local time)</label>
              <input id="medicine-time" type="time" required
                className="form-control bg-transparent text-white border-light"
                value={newMedicine.time}
                onChange={e => setNewMedicine({ ...newMedicine, time: e.target.value })} />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button type="submit" className="btn btn-accent w-100" disabled={busy}>Save reminder</button>
            </div>
          </form>
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3">Your Medicines</h5>
          {error && <div role="alert" className="alert alert-danger">{error}
            <button className="btn btn-link" onClick={refresh}>Retry</button>
          </div>}
          {isLoading ? <p className="small-note">Loading reminders…</p> :
            medicines.length === 0 ? <p className="small-note text-center">No medicines added yet.</p> :
            medicines.map(medicine => (
              <div key={medicine.id} className="glass-card p-3 mb-2">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <strong style={{ color: medicine.paused ? '#adb5bd' : '#4ad7a8' }}>{medicine.medicine_name}</strong>
                    <div className="small-note">
                      {medicine.dosage && medicine.dosage + ' · '}
                      {medicine.repeat ? 'Repeating' : 'One time'} · {medicine.paused ? 'Paused' :
                        'Next: ' + new Date(medicine.next_reminder_time).toLocaleString()}
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-sm btn-success" disabled={busy || medicine.paused}
                      onClick={() => perform(() => taken(medicine.id), 'Medicine marked taken')}>
                      Taken
                    </button>
                    <button className="btn btn-sm btn-warning" disabled={busy}
                      onClick={() => perform(() => toggle(medicine), medicine.paused ? 'Reminder resumed' : 'Reminder paused')}>
                      {medicine.paused ? 'Resume' : 'Pause'}
                    </button>
                    <button className="btn btn-sm btn-danger" disabled={busy}
                      aria-label={'Delete ' + medicine.medicine_name}
                      onClick={() => perform(() => remove(medicine.id), 'Medicine removed')}>
                      <i className="fas fa-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className="col-lg-4">
        <div className="glass-card p-4 h-100">
          <h5 className="mb-3">Your reminders</h5>
          <p className="small-note">Reminders are saved in the database for this browser session.
            Keep the app open to receive scheduled alerts. Pausing a reminder suppresses its alerts.</p>
          <p className="small-note">Clearing browser cookies ends access to this browser's saved reminders.</p>
        </div>
      </div>
    </div>
  );
};

export default MedicineReminder;
