// Mo/Mi/Fr Gym-Split (Push/Pull/Legs), Di/Do Volleyball, ab 23.09. zusätzlich Mi Hallenfußball
export const WEEKDAY_PLAN = {
  1: { type: 'push', label: 'Push Day' }, // Montag
  2: { type: null, label: 'Volleyball' }, // Dienstag
  3: { type: 'pull', label: 'Pull Day' }, // Mittwoch
  4: { type: null, label: 'Volleyball' }, // Donnerstag
  5: { type: 'legs', label: 'Leg Day' }, // Freitag
  6: { type: null, label: 'Frei / Aktive Erholung' }, // Samstag
  0: { type: null, label: 'Frei / Aktive Erholung' }, // Sonntag
};

export const DAY_TYPE_LABEL = {
  push: 'Push Day',
  pull: 'Pull Day',
  legs: 'Leg Day',
};

export function getTodayPlan(date = new Date()) {
  return WEEKDAY_PLAN[date.getDay()];
}

export function toISODate(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}
