import React, { useState } from 'react';
import { useToast } from './Toast';

const MedicineReminder = () => {
  const [medicines, setMedicines] = useState([
    { id: 1, name: 'Eye Drops', dosage: '2 drops', frequency: 'Twice daily', time: '09:00', active: true },
    { id: 2, name: 'Vitamin A', dosage: '1 tablet', frequency: 'Daily', time: '20:00', active: true }
  ]);
  const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', frequency: '', time: '' });
  const { showToast } = useToast();

  const addMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.frequency || !newMedicine.time) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setMedicines([...medicines, { 
      id: Date.now(), 
      ...newMedicine, 
      active: true 
    }]);
    setNewMedicine({ name: '', dosage: '', frequency: '', time: '' });
    showToast('✅ Medicine added successfully!', 'success');
  };

  const toggleMedicine = (id) => {
    setMedicines(medicines.map(med => 
      med.id === id ? { ...med, active: !med.active } : med
    ));
    showToast('🔄 Medicine status updated', 'info');
  };

  const deleteMedicine = (id) => {
    setMedicines(medicines.filter(med => med.id !== id));
    showToast('🗑️ Medicine removed', 'error');
  };

  return (
    <div className="row gy-4">
      <div className="col-lg-8">
        <div className="glass-card p-5 mb-4">
          <p className="text-uppercase text-accent mb-3 small-note">Medicine Reminder</p>
          <h1 className="section-heading mb-3">Track your eye care medication</h1>
          <p className="small-note">Schedule reminders for eye care medication and track alerts.</p>
        </div>

        <div className="glass-card p-4 mb-4">
          <h5 className="mb-3">Add New Medicine</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control bg-transparent text-white border-light"
                placeholder="Medicine name"
                value={newMedicine.name}
                onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control bg-transparent text-white border-light"
                placeholder="Dosage"
                value={newMedicine.dosage}
                onChange={(e) => setNewMedicine({...newMedicine, dosage: e.target.value})}
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control bg-transparent text-white border-light"
                placeholder="Frequency"
                value={newMedicine.frequency}
                onChange={(e) => setNewMedicine({...newMedicine, frequency: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <input
                type="time"
                className="form-control bg-transparent text-white border-light"
                value={newMedicine.time}
                onChange={(e) => setNewMedicine({...newMedicine, time: e.target.value})}
              />
            </div>
            <div className="col-md-1">
              <button className="btn btn-accent w-100" onClick={addMedicine}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3">Your Medicines</h5>
          {medicines.length === 0 ? (
            <p className="small-note text-center">No medicines added yet.</p>
          ) : (
            medicines.map(med => (
              <div key={med.id} className="glass-card p-3 mb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong style={{ color: med.active ? '#4ad7a8' : '#6c757d' }}>
                      {med.name}
                    </strong>
                    <span className="small-note ms-3">
                      {med.dosage} - {med.frequency} at {med.time}
                    </span>
                  </div>
                  <div>
                    <button
                      className={`btn btn-sm ${med.active ? 'btn-warning' : 'btn-success'} me-2`}
                      onClick={() => toggleMedicine(med.id)}
                    >
                      {med.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteMedicine(med.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="col-lg-4">
        <div className="glass-card p-4 h-100">
          <h5 className="mb-3">Key capabilities</h5>
          <ul className="list-unstyled small-note mb-0">
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Add new medicines</li>
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Schedule reminders</li>
            <li className="mb-3"><i className="fas fa-circle-notch text-accent me-2"></i>Pause/Resume tracking</li>
            <li><i className="fas fa-circle-notch text-accent me-2"></i>Delete medicines</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MedicineReminder;