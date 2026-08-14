import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { DAY_TYPE_LABEL, getTodayPlan, toISODate } from '../dayPlan';

const DAY_TAG_CLASS = { push: 'tag-push', pull: 'tag-pull', legs: 'tag-legs' };

export default function Today() {
  const today = useMemo(() => new Date(), []);
  const plan = getTodayPlan(today);
  const isoDate = toISODate(today);

  const [dayType, setDayType] = useState(plan.type || 'push');
  const [exercises, setExercises] = useState([]);
  const [sets, setSets] = useState({}); // { exerciseId: [{weight_kg, reps}] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getExercises(dayType), api.getSessionByDate(isoDate, dayType).catch(() => null)]).then(
      ([exList, existing]) => {
        if (cancelled) return;
        setExercises(exList);
        const initial = {};
        exList.forEach((ex) => {
          const existingSets = existing?.sets?.filter((s) => s.exercise_id === ex.id) || [];
          initial[ex.id] = Array.from({ length: ex.target_sets }, (_, i) => {
            const found = existingSets.find((s) => s.set_number === i + 1);
            return { weight_kg: found?.weight_kg ?? '', reps: found?.reps ?? '' };
          });
        });
        setSets(initial);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [dayType, isoDate]);

  function updateSet(exId, idx, field, value) {
    setSets((prev) => {
      const copy = { ...prev, [exId]: [...prev[exId]] };
      copy[exId][idx] = { ...copy[exId][idx], [field]: value };
      return copy;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        session_date: isoDate,
        day_type: dayType,
        sets: Object.entries(sets).flatMap(([exerciseId, setList]) =>
          setList
            .map((s, i) => ({
              exercise_id: Number(exerciseId),
              set_number: i + 1,
              weight_kg: s.weight_kg === '' ? null : Number(s.weight_kg),
              reps: s.reps === '' ? null : Number(s.reps),
            }))
            .filter((s) => s.weight_kg !== null || s.reps !== null)
        ),
      };
      await api.saveSession(payload);
      setSavedAt(new Date());
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const weekdayFormatted = today.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="content">
      <div className="panel">
        <div className="panel-title">
          {weekdayFormatted}
          <span className={`tag ${DAY_TAG_CLASS[dayType]}`}>{DAY_TYPE_LABEL[dayType]}</span>
        </div>
        {!plan.type && (
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -6 }}>
            Heute ist laut Plan {plan.label.toLowerCase()} — du kannst trotzdem einen Gym-Tag nachtragen:
          </p>
        )}
        <div className="stat-row">
          {['push', 'pull', 'legs'].map((dt) => (
            <button
              key={dt}
              className="btn btn-ghost"
              style={{
                flex: 1,
                borderColor: dayType === dt ? 'var(--brass)' : 'var(--line)',
                color: dayType === dt ? 'var(--brass-bright)' : 'var(--muted)',
              }}
              onClick={() => setDayType(dt)}
            >
              {DAY_TYPE_LABEL[dt]}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="empty-state">Lade Übungen…</div>}

      {!loading &&
        exercises.map((ex) => (
          <div className="panel" key={ex.id}>
            <div className="exercise-row" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div className="exercise-name">{ex.name}</div>
              <div className="exercise-meta">
                {ex.muscle_group} · Ziel {ex.target_sets}×{ex.target_reps_min}-{ex.target_reps_max}
              </div>
              <div className="set-grid">
                {sets[ex.id]?.map((s, idx) => (
                  <div className="set-row" key={idx}>
                    <div className="set-number">{idx + 1}</div>
                    <div>
                      <span className="field-label">kg</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={s.weight_kg}
                        onChange={(e) => updateSet(ex.id, idx, 'weight_kg', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Wdh.</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={s.reps}
                        onChange={(e) => updateSet(ex.id, idx, 'reps', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

      {!loading && (
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichere…' : 'Training speichern'}
        </button>
      )}
      {savedAt && (
        <p style={{ textAlign: 'center', color: 'var(--ok)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          Gespeichert um {savedAt.toLocaleTimeString('de-DE')}
        </p>
      )}
    </div>
  );
}
