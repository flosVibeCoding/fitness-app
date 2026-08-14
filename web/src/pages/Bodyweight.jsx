import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import { toISODate } from '../dayPlan';

export default function Bodyweight() {
  const [logs, setLogs] = useState([]);
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    api
      .getBodyweight(90)
      .then(setLogs)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSave() {
    if (!weight) return;
    setSaving(true);
    try {
      await api.addBodyweight({ log_date: toISODate(), weight_kg: Number(weight) });
      setWeight('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const chartData = logs.map((l) => ({
    date: new Date(l.log_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    weight: Number(l.weight_kg),
  }));
  const latest = logs[logs.length - 1];
  const first = logs[0];
  const delta = latest && first ? (Number(latest.weight_kg) - Number(first.weight_kg)).toFixed(1) : null;

  return (
    <div className="content">
      <div className="panel">
        <div className="panel-title">Körpergewicht eintragen</div>
        <div className="set-row" style={{ gridTemplateColumns: '1fr auto' }}>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="z.B. 76.8"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !weight}>
            Sichern
          </button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10, fontFamily: 'var(--font-mono)' }}>
          Manuell für jetzt · Renpho-Sync folgt in Step 3
        </p>
      </div>

      <div className="panel">
        <div className="panel-title">Verlauf (90 Tage)</div>
        {loading && <div className="empty-state">Lade…</div>}
        {!loading && logs.length === 0 && <div className="empty-state">Noch keine Einträge.</div>}
        {!loading && logs.length > 0 && (
          <>
            <div className="stat-row">
              <div className="stat">
                <div className="stat-value">{Number(latest.weight_kg).toFixed(1)}</div>
                <div className="stat-label">Aktuell (kg)</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ color: delta < 0 ? 'var(--ok)' : 'var(--signal)' }}>
                  {delta > 0 ? '+' : ''}
                  {delta}
                </div>
                <div className="stat-label">Trend (kg)</div>
              </div>
            </div>
            <div style={{ height: 180, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="#8c8577" fontSize={11} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#8c8577" fontSize={11} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={{ background: '#1c1a17', border: '1px solid #35312b', fontSize: 12 }}
                    labelStyle={{ color: '#ede9e1' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#b08d57" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
