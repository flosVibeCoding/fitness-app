const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Fehler ${res.status}`);
  }
  return res.json();
}

export const api = {
  getExercises: (dayType) => request(`/exercises${dayType ? `?day_type=${dayType}` : ''}`),
  getExerciseHistory: (id) => request(`/exercises/${id}/history`),
  getSessionByDate: (date, dayType) => request(`/sessions/by-date?date=${date}&day_type=${dayType}`),
  getSessions: (limit = 20) => request(`/sessions?limit=${limit}`),
  saveSession: (payload) => request('/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  getBodyweight: (limit = 90) => request(`/bodyweight?limit=${limit}`),
  addBodyweight: (payload) => request('/bodyweight', { method: 'POST', body: JSON.stringify(payload) }),
  getJournalByDate: (date) => request(`/journal/by-date?date=${date}`),
  saveJournal: (payload) => request('/journal', { method: 'POST', body: JSON.stringify(payload) }),
};
