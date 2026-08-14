import { useEffect, useState } from 'react';
import { api } from '../api';
import { DAY_TYPE_LABEL } from '../dayPlan';

const DAY_TAG_CLASS = { push: 'tag-push', pull: 'tag-pull', legs: 'tag-legs' };

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSessions(30)
      .then((data) => setSessions(data.filter((s) => (s.sets || []).length > 0)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="content">
      <div className="panel">
        <div className="panel-title">Trainingsverlauf</div>
        {loading && <div className="empty-state">Lade…</div>}
        {!loading && sessions.length === 0 && (
          <div className="empty-state">Noch keine Trainings erfasst. Leg auf "Heute" los.</div>
        )}
        {!loading &&
          sessions.map((s) => {
            const bySet = groupByExercise(s.sets || []);
            return (
              <div className="session-card" key={s.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="session-date">
                    {new Date(s.session_date).toLocaleDateString('de-DE', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                  <span className={`tag ${DAY_TAG_CLASS[s.day_type] || ''}`}>
                    {DAY_TYPE_LABEL[s.day_type] || s.day_type}
                  </span>
                </div>
                {Object.entries(bySet).map(([name, setList]) => (
                  <div key={name} style={{ marginTop: 8, fontSize: 13 }}>
                    <strong>{name}</strong>{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                      {setList
                        .filter((x) => x.weight_kg || x.reps)
                        .map((x) => `${x.weight_kg ?? '-'}kg×${x.reps ?? '-'}${x.rpe ? ` @${x.rpe}` : ''}`)
                        .join('  ')}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function groupByExercise(sets) {
  return sets.reduce((acc, s) => {
    acc[s.exercise_name] = acc[s.exercise_name] || [];
    acc[s.exercise_name].push(s);
    return acc;
  }, {});
}
