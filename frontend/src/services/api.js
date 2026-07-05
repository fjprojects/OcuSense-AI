const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const api = {
  // Sessions
  async saveSession(data) {
    const response = await fetch(`${API_URL}/sessions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async getSessions() {
    const response = await fetch(`${API_URL}/sessions/`);
    return response.json();
  },

  // Hydration
  async saveHydration(data) {
    const response = await fetch(`${API_URL}/hydration/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async getHydration() {
    const response = await fetch(`${API_URL}/hydration/`);
    return response.json();
  },

  // Medicines
  async saveMedicine(data) {
    const response = await fetch(`${API_URL}/medicines/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async getMedicines() {
    const response = await fetch(`${API_URL}/medicines/`);
    return response.json();
  },

  async deleteMedicine(id) {
    const response = await fetch(`${API_URL}/medicines/${id}/`, {
      method: 'DELETE'
    });
    return response.json();
  }
};