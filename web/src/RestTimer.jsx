import { useEffect, useRef, useState } from 'react';

const PRESETS = [60, 90, 120, 180];

export default function RestTimer() {
  const [remaining, setRemaining] = useState(null);
  const [total, setTotal] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      clearInterval(intervalRef.current);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r === null ? null : r - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [remaining === null]);

  function start(seconds) {
    clearInterval(intervalRef.current);
    setTotal(seconds);
    setRemaining(seconds);
  }

  function stop() {
    clearInterval(intervalRef.current);
    setRemaining(null);
    setTotal(null);
  }

  const isRunning = remaining !== null && remaining > 0;
  const isDone = remaining === 0;
  const progress = total ? Math.max(0, remaining) / total : 0;

  return (
    <div className="panel" style={{ position: 'sticky', bottom: 76, zIndex: 5 }}>
      {!isRunning && !isDone && (
        <>
          <div className="panel-title" style={{ marginBottom: 10 }}>
            Pausentimer
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PRESETS.map((s) => (
              <button key={s} className="btn btn-ghost" style={{ flex: 1 }} onClick={() => start(s)}>
                {s}s
              </button>
            ))}
          </div>
        </>
      )}
      {(isRunning || isDone) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 600,
              color: isDone ? 'var(--signal)' : 'var(--brass-bright)',
              minWidth: 64,
            }}
          >
            {isDone ? '0:00' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
          </div>
          <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: isDone ? 'var(--signal)' : 'var(--brass)',
                transition: 'width 1s linear',
              }}
            />
          </div>
          <button className="btn btn-ghost" onClick={stop}>
            {isDone ? 'OK' : 'Stopp'}
          </button>
        </div>
      )}
    </div>
  );
}
