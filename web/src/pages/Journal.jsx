import { useEffect, useState } from 'react';
import { api } from '../api';
import { toISODate } from '../dayPlan';

const SCALES = [
  { key: 'energy_level', label: 'Energie', low: 'erschöpft', high: 'topfit' },
  { key: 'soreness_level', label: 'Muskelkater', low: 'keiner', high: 'stark' },
  { key: 'stress_level', label: 'Stress', low: 'entspannt', high: 'angespannt' },
];

export default function Journal() {
  const isoDate = toISODate();
  const [form, setForm] = useState({
    sleep_hours: '',
    energy_level: null,
    soreness_level: null,
    stress_level: null,
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    api
      .getJournalByDate(isoDate)
      .then((existing) => {
        if (existing) {
          setForm({
            sleep_hours: existing.sleep_hours ?? '',
            energy_level: existing.energy_level,
            soreness_level: existing.soreness_level,
            stress_level: existing.stress_level,
            notes: existing.notes ?? '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [isoDate]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveJournal({
        log_date: isoDate,
        sleep_hours: form.sleep_hours === '' ? null : Number(form.sleep_hours),
        energy_level: form.energy_level,
        soreness_level: form.soreness_level,
        stress_level: form.stress_level,
        notes: form.notes || null,
      });
      setSavedAt(new Date());
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const todayFormatted = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="content">
      <div className="panel">
        <div className="panel-title">Tagesabschluss — {todayFormatted}</div>
        {loading ? (
          <div className="empty-state">Lade…</div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <span className="field-label">Schlaf (Stunden)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                placeholder="z.B. 7.5"
                value={form.sleep_hours}
                onChange={(e) => setForm((f) => ({ ...f, sleep_hours: e.target.value }))}
                style={{
                  width: '100%',
                  background: 'var(--bg-panel-raised)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '9px 10px',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 15,
                }}
              />
            </div>

            {SCALES.map((scale) => (
              <div key={scale.key} style={{ marginBottom: 18 }}>
                <span className="field-label">{scale.label}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setForm((f) => ({ ...f, [scale.key]: val }))}
                      className="btn"
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        background: form[scale.key] === val ? 'var(--brass)' : 'var(--bg-panel-raised)',
                        color: form[scale.key] === val ? '#16140f' : 'var(--muted)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--muted)',
                    marginTop: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <span>{scale.low}</span>
                  <span>{scale.high}</span>
                </div>
              </div>
            ))}

            <div>
              <span className="field-label">Notizen (optional)</span>
              <textarea
                rows={3}
                placeholder="Wie fühlst du dich, was fällt dir auf?"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                style={{
                  width: '100%',
                  background: 'var(--bg-panel-raised)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '9px 10px',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        )}
      </div>

      {!loading && (
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichere…' : 'Tageseintrag speichern'}
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
