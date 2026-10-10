const API_URL = (process.env.REACT_APP_API_URL || '/api').replace(/\/$/, '');
let csrfRequest;

async function csrfToken() {
  if (!csrfRequest) {
    csrfRequest = fetch(API_URL + '/csrf/', {
      credentials: 'same-origin', cache: 'no-store'
    }).then(async response => {
      if (!response.ok) throw new Error('Could not initialize a secure session');
      const data = await response.json();
      return data.csrfToken;
    }).catch(error => {
      csrfRequest = null;
      throw error;
    });
  }
  return csrfRequest;
}

async function request(path, { method = 'GET', data, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    headers['X-CSRFToken'] = await csrfToken();
  }
  const response = await fetch(API_URL + path, {
    method, headers, credentials: 'same-origin', cache: 'no-store',
    ...(data === undefined ? {} : { body: JSON.stringify(data) })
  });
  if (response.status === 403 && method !== 'GET' && retry) {
    csrfRequest = null;
    return request(path, { method, data, retry: false });
  }
  if (!(response.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('The server could not complete this request (' + response.status + ')');
  }
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || body.message || 'Request failed');
  return body;
}

export const api = {
  getMedicines: () => request('/medicines/get/'),
  saveMedicine: data => request('/medicines/add/', { method: 'POST', data }),
  deleteMedicine: id => request('/medicines/delete/', { method: 'POST', data: { medicine_id: id } }),
  markMedicineTaken: id => request('/medicines/taken/', { method: 'POST', data: { medicine_id: id } }),
  updateMedicine: (id, paused) => request('/medicines/update/', {
    method: 'POST', data: { medicine_id: id, paused }
  }),
  claimMedicineAlert: medicine => request('/medicines/notify/', {
    method: 'POST', data: { medicine_id: medicine.id, next_reminder_time: medicine.next_reminder_time }
  }),
  sendContact: data => request('/contact/', { method: 'POST', data }),
  // Retained helpers for integrations; unsupported endpoints return a clear JSON 404.
  saveSession: data => request('/sessions/', { method: 'POST', data }),
  getSessions: () => request('/sessions/'),
  saveHydration: data => request('/hydration/', { method: 'POST', data }),
  getHydration: () => request('/hydration/')
};
