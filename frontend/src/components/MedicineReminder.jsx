import React, { useState } from 'react';
import PageHeader from './PageHeader';
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
    <>
      <PageHeader eyebrow="A little help remembering" title="Medicine reminders"
        description="Keep your schedule in one place and receive alerts while this app is open."
        actions={<button className="btn btn-outline-light" onClick={enableAlerts}><i className="fas fa-bell" aria-hidden="true" />Enable alerts</button>} />
      <div className="medicine-layout">
        <section className="glass-card">
          <div className="card-heading"><h2><i className="fas fa-plus" aria-hidden="true" />Add a reminder</h2></div>
          <form className="medicine-form" onSubmit={addMedicine}>
            <div>
              <label htmlFor="medicine-name" className="form-label">Medicine name</label>
              <input id="medicine-name" type="text" maxLength={100} required className="form-control"
                placeholder="e.g. Eye drops" value={newMedicine.name}
                onChange={event => setNewMedicine({ ...newMedicine, name: event.target.value })} />
            </div>
            <div>
              <label htmlFor="medicine-dosage" className="form-label">Dosage (optional)</label>
              <input id="medicine-dosage" type="text" maxLength={100} className="form-control"
                placeholder="e.g. 1 drop" value={newMedicine.dosage}
                onChange={event => setNewMedicine({ ...newMedicine, dosage: event.target.value })} />
            </div>
            <div className="form-pair">
              <div>
                <label htmlFor="medicine-frequency" className="form-label">Frequency</label>
                <select id="medicine-frequency" className="form-select" value={newMedicine.repeat ? 'daily' : 'once'}
                  onChange={event => setNewMedicine({ ...newMedicine, repeat: event.target.value === 'daily' })}>
                  <option value="daily">Daily</option><option value="once">One time</option>
                </select>
              </div>
              <div>
                <label htmlFor="medicine-time" className="form-label">Alarm time (your local time)</label>
                <input id="medicine-time" type="time" required className="form-control" value={newMedicine.time}
                  onChange={event => setNewMedicine({ ...newMedicine, time: event.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-accent w-100" disabled={busy}>Save reminder</button>
          </form>
        </section>
        <section className="glass-card">
          <div className="card-heading"><h2>Your reminders</h2><span className="status-pill neutral">{medicines.length} saved</span></div>
          {error && <div role="alert" className="alert alert-danger">{error}<button className="btn btn-link" onClick={refresh}>Retry</button></div>}
          {isLoading ? <p className="small-note">Loading reminders…</p> : medicines.length === 0 ?
            <div className="empty-state"><i className="fas fa-pills" aria-hidden="true" /><p>No medicines added yet.</p><p className="small-note">Add a name and a time to create your first reminder.</p></div> :
            medicines.map(medicine => (
              <article key={medicine.id} className="reminder-row">
                <div className="reminder-row-top">
                  <strong className="reminder-name">{medicine.medicine_name}</strong>
                  <span className={'status-pill' + (medicine.paused ? ' neutral' : '')}>{medicine.paused ? 'Paused' : 'Active'}</span>
                </div>
                <div className="reminder-meta">
                  {medicine.dosage && <div>{medicine.dosage}</div>}
                  <div>{medicine.repeat ? 'Daily' : 'One time'} · {medicine.paused ? 'Alerts paused' : 'Next: ' + new Date(medicine.next_reminder_time).toLocaleString()}</div>
                </div>
                <div className="reminder-actions">
                  <button className="btn btn-accent" disabled={busy || medicine.paused}
                    onClick={() => perform(() => taken(medicine.id), 'Medicine marked taken')}>Taken</button>
                  <button className="btn btn-outline-light" disabled={busy}
                    onClick={() => perform(() => toggle(medicine), medicine.paused ? 'Reminder resumed' : 'Reminder paused')}>{medicine.paused ? 'Resume' : 'Pause'}</button>
                  <button className="btn btn-outline-danger" disabled={busy} aria-label={'Delete ' + medicine.medicine_name}
                    onClick={() => perform(() => remove(medicine.id), 'Medicine removed')}><i className="fas fa-trash" aria-hidden="true" /></button>
                </div>
              </article>
            ))}
        </section>
      </div>
      <p className="small-note reminder-note"><i className="fas fa-circle-info me-1" aria-hidden="true" />Keep this app open for scheduled alerts. Clearing cookies ends access to this browser's saved reminders.</p>
    </>
  );
};

export default MedicineReminder;
