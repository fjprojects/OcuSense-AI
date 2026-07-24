import React, { useState } from "react";
import { useToast } from "./Toast";

const MedicineReminder = () => {
  const [medicines, setMedicines] = useState([
    {
      id: 1,
      name: "Eye Drops",
      dosage: "2 drops",
      frequency: "Twice daily",
      time: "09:00",
      active: true,
    },
    {
      id: 2,
      name: "Vitamin A",
      dosage: "1 tablet",
      frequency: "Daily",
      time: "20:00",
      active: true,
    },
  ]);

  const [newMedicine, setNewMedicine] = useState({
    name: "",
    dosage: "",
    frequency: "",
    time: "",
  });

  const { showToast } = useToast();

  const addMedicine = () => {
    if (
      !newMedicine.name.trim() ||
      !newMedicine.dosage.trim() ||
      !newMedicine.frequency.trim() ||
      !newMedicine.time
    ) {
      showToast("Please fill all fields", "error");
      return;
    }

    const medicineToAdd = {
      id: Date.now(),
      name: newMedicine.name.trim(),
      dosage: newMedicine.dosage.trim(),
      frequency: newMedicine.frequency.trim(),
      time: newMedicine.time,
      active: true,
    };

    setMedicines((previousMedicines) => [
      ...previousMedicines,
      medicineToAdd,
    ]);

    setNewMedicine({
      name: "",
      dosage: "",
      frequency: "",
      time: "",
    });

    showToast("Medicine added successfully!", "success");
  };

  const toggleMedicine = (id) => {
    setMedicines((previousMedicines) =>
      previousMedicines.map((medicine) =>
        medicine.id === id
          ? {
              ...medicine,
              active: !medicine.active,
            }
          : medicine
      )
    );

    showToast("Medicine status updated", "info");
  };

  const deleteMedicine = (id) => {
    setMedicines((previousMedicines) =>
      previousMedicines.filter((medicine) => medicine.id !== id)
    );

    showToast("Medicine removed", "error");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      addMedicine();
    }
  };

  return (
    <div className="row gy-4">
      <div className="col-lg-8">
        <div className="glass-card p-5 mb-4">
          <p className="text-uppercase text-accent mb-3 small-note">
            Medicine Reminder
          </p>

          <h1 className="section-heading mb-3">
            Track your eye care medication
          </h1>

          <p className="small-note mb-0">
            Schedule reminders for eye care medication and track alerts.
          </p>
        </div>

        <div className="glass-card medicine-form-card p-4 mb-4">
          <h5 className="mb-3">Add New Medicine</h5>

          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small-note">
                Medicine name
              </label>

              <input
                type="text"
                className="form-control medicine-input"
                placeholder="Medicine name"
                value={newMedicine.name}
                onChange={(event) =>
                  setNewMedicine((previousMedicine) => ({
                    ...previousMedicine,
                    name: event.target.value,
                  }))
                }
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small-note">
                Dosage
              </label>

              <input
                type="text"
                className="form-control medicine-input"
                placeholder="Dosage"
                value={newMedicine.dosage}
                onChange={(event) =>
                  setNewMedicine((previousMedicine) => ({
                    ...previousMedicine,
                    dosage: event.target.value,
                  }))
                }
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small-note">
                Frequency
              </label>

              <input
                type="text"
                className="form-control medicine-input"
                placeholder="Frequency"
                value={newMedicine.frequency}
                onChange={(event) =>
                  setNewMedicine((previousMedicine) => ({
                    ...previousMedicine,
                    frequency: event.target.value,
                  }))
                }
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small-note">
                Time
              </label>

              <input
                type="time"
                className="form-control medicine-input"
                value={newMedicine.time}
                onChange={(event) =>
                  setNewMedicine((previousMedicine) => ({
                    ...previousMedicine,
                    time: event.target.value,
                  }))
                }
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="col-md-1">
              <button
                type="button"
                className="btn medicine-add-btn w-100 fw-bold"
                onClick={addMedicine}
                title="Add medicine"
                aria-label="Add medicine"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3">Your Medicines</h5>

          {medicines.length === 0 ? (
            <p className="small-note text-center mb-0">
              No medicines added yet.
            </p>
          ) : (
            medicines.map((medicine) => (
              <div
                key={medicine.id}
                className="glass-card p-3 mb-3"
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <strong
                      style={{
                        color: medicine.active
                          ? "#4ad7a8"
                          : "#94a3b8",
                      }}
                    >
                      {medicine.name}
                    </strong>

                    <span className="small-note ms-md-3 d-block d-md-inline mt-1 mt-md-0">
                      {medicine.dosage} - {medicine.frequency} at{" "}
                      {medicine.time}
                    </span>
                  </div>

                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-sm fw-semibold"
                      onClick={() => toggleMedicine(medicine.id)}
                      style={{
                        backgroundColor: medicine.active
                          ? "#facc15"
                          : "#22c55e",
                        borderColor: medicine.active
                          ? "#facc15"
                          : "#22c55e",
                        color: medicine.active
                          ? "#111827"
                          : "#ffffff",
                      }}
                    >
                      <i
                        className={`fas ${
                          medicine.active
                            ? "fa-pause"
                            : "fa-play"
                        } me-1`}
                      ></i>

                      {medicine.active ? "Pause" : "Resume"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-danger fw-semibold"
                      onClick={() => deleteMedicine(medicine.id)}
                    >
                      <i className="fas fa-trash me-1"></i>
                      Delete
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
            <li className="mb-3">
              <i className="fas fa-circle-notch text-accent me-2"></i>
              Add new medicines
            </li>

            <li className="mb-3">
              <i className="fas fa-circle-notch text-accent me-2"></i>
              Schedule reminders
            </li>

            <li className="mb-3">
              <i className="fas fa-circle-notch text-accent me-2"></i>
              Pause or resume tracking
            </li>

            <li>
              <i className="fas fa-circle-notch text-accent me-2"></i>
              Delete medicines
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MedicineReminder;