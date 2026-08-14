import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { DAY_TYPE_LABEL, getTodayPlan, toISODate } from '../dayPlan';
import RestTimer from '../RestTimer';

const DAY_TAG_CLASS = { push: 'tag-push', pull: 'tag-pull', legs: 'tag-legs' };
const EQUIPMENT_LABEL = { free_weight: 'Frei', machine: 'Maschine', cable: 'Kabel', bodyweight: 'Körpergewicht' };

function emptySet() {
  return { weight_kg: '', reps: '', rpe: '' };
}

export default function Today() {
  const today = useMemo(() => new Date(), []);
  const plan = getTodayPlan(today);
  const isoDate = toISODate(today);

  const [dayType, setDayType] = useState(plan.type || 'push');
  const [allExercises, setAllExercises] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sets, setSets] = useState({}); // { exerciseId: [{weight_kg, reps, rpe}] }
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const [pickerValue, setPickerValue] = useState('');

  const saveTimeoutRef = useRef(null);
  const skipNextAutosave = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    skipNextAutosave.current = true;
    Promise.all([api.getExercises(dayType), api.getSessionByDate(isoDate, dayType).catch(() => null)]).then(
      ([exList, existing]) => {
        if (cancelled) return;
        setAllExercises(exList);

        const existingExerciseIds = [...new Set((existing?.sets || []).map((s) => s.exercise_id))];
        const defaultIds = exList.filter((e) => e.is_default_for_day).map((e) => e.id);
        const initialSelected = existingExerciseIds.length > 0
          ? [...new Set([...defaultIds.filter((id) => exList.find((e) => e.id === id)), ...existingExerciseIds])]
          : defaultIds;

        const initialSets = {};
        initialSelected.forEach((id) => {
          const ex = exList.find((e) => e.id === id);
          const existingSets = (existing?.sets || []).filter((s) => s.exercise_id === id);
          const targetCount = Math.max(ex?.target_sets || 3, existingSets.length);
          initialSets[id] = Array.from({ length: targetCount }, (_, i) => {
            const found = existingSets.find((s) => s.set_number === i + 1);
            return {
              weight_kg: found?.weight_kg ?? '',
              reps: found?.reps ?? '',
              rpe: found?.rpe ?? '',
            };
          });
        });

        setSelectedIds(initialSelected);
        setSets(initialSets);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [dayType, isoDate]);

  // Auto-Save (debounced) bei jeder Änderung — nur wenn wirklich Daten eingetragen sind
  useEffect(() => {
    if (loading) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    const hasAnyData = Object.values(sets).some((setList) =>
      setList.some((s) => s.weight_kg !== '' || s.reps !== '' || s.rpe !== '')
    );
    if (!hasAnyData) return;

    setSaveState('saving');
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persist();
    }, 900);
    return () => clearTimeout(saveTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, selectedIds]);

  async function persist() {
    try {
      const payloadSets = Object.entries(sets).flatMap(([exerciseId, setList]) =>
        setList
          .map((s, i) => ({
            exercise_id: Number(exerciseId),
            set_number: i + 1,
            weight_kg: s.weight_kg === '' ? null : Number(s.weight_kg),
            reps: s.reps === '' ? null : Number(s.reps),
            rpe: s.rpe === '' ? null : Number(s.rpe),
          }))
          .filter((s) => s.weight_kg !== null || s.reps !== null || s.rpe !== null)
      );

      // Nichts eingetragen -> keine leere Session anlegen
      if (payloadSets.length === 0) {
        setSaveState('idle');
        return;
      }

      await api.saveSession({ session_date: isoDate, day_type: dayType, sets: payloadSets });
      setSaveState('saved');
    } catch (err) {
      console.error(err);
      setSaveState('idle');
    }
  }

  function updateSet(exId, idx, field, value) {
    setSets((prev) => {
      const copy = { ...prev, [exId]: [...prev[exId]] };
      copy[exId][idx] = { ...copy[exId][idx], [field]: value };
      return copy;
    });
  }

  function addExercise(id) {
    const numId = Number(id);
    if (!numId || selectedIds.includes(numId)) return;
    const ex = allExercises.find((e) => e.id === numId);
    setSelectedIds((prev) => [...prev, numId]);
    setSets((prev) => ({ ...prev, [numId]: Array.from({ length: ex?.target_sets || 3 }, emptySet) }));
    setPickerValue('');
  }

  function removeExercise(id) {
    const hasData = (sets[id] || []).some((s) => s.weight_kg !== '' || s.reps !== '' || s.rpe !== '');
    if (hasData && !confirm('Für diese Übung sind schon Werte eingetragen. Trotzdem entfernen?')) return;
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setSets((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function addSetRow(exId) {
    setSets((prev) => ({ ...prev, [exId]: [...prev[exId], emptySet()] }));
  }

  const selectedExercises = selectedIds
    .map((id) => allExercises.find((e) => e.id === id))
    .filter(Boolean)
    .sort((a, b) => a.sort_order - b.sort_order);
  const availableToAdd = allExercises.filter((e) => !selectedIds.includes(e.id));
  const weekdayFormatted = today.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="content">
      <div className="panel">
        <div className="panel-title" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {weekdayFormatted}
            <span className={`tag ${DAY_TAG_CLASS[dayType]}`}>{DAY_TYPE_LABEL[dayType]}</span>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: saveState === 'saved' ? 'var(--ok)' : 'var(--muted)',
            }}
          >
            {saveState === 'saving' && 'speichert…'}
            {saveState === 'saved' && '✓ gespeichert'}
          </span>
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
        selectedExercises.map((ex) => (
          <div className="panel" key={ex.id}>
            <div className="exercise-row" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-meta">
                    {ex.muscle_group} · {EQUIPMENT_LABEL[ex.equipment_type]} · Ziel {ex.target_sets}×{ex.target_reps_min}-
                    {ex.target_reps_max}
                  </div>
                </div>
                <button
                  onClick={() => removeExercise(ex.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, padding: 4, cursor: 'pointer' }}
                  aria-label="Übung entfernen"
                >
                  ×
                </button>
              </div>
              <div className="set-grid">
                {sets[ex.id]?.map((s, idx) => (
                  <div className="set-row" style={{ gridTemplateColumns: '24px 1fr 1fr 0.7fr' }} key={idx}>
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
                    <div>
                      <span className="field-label">RPE</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="1"
                        max="10"
                        placeholder="–"
                        value={s.rpe}
                        onChange={(e) => updateSet(ex.id, idx, 'rpe', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 10, padding: '8px 14px', fontSize: 12 }}
                onClick={() => addSetRow(ex.id)}
              >
                + Satz
              </button>
            </div>
          </div>
        ))}

      {!loading && availableToAdd.length > 0 && (
        <div className="panel">
          <div className="panel-title">Übung hinzufügen</div>
          <select
            value={pickerValue}
            onChange={(e) => addExercise(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-panel-raised)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '10px',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
            }}
          >
            <option value="">Übung wählen…</option>
            {availableToAdd
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({EQUIPMENT_LABEL[e.equipment_type]})
                </option>
              ))}
          </select>
        </div>
      )}

      {!loading && <RestTimer />}
    </div>
  );
}
