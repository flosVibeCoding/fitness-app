-- Fitness Coach App - Schema
-- Single-user app (Flo), analog Kickbase-Tool Aufbau

CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  day_type TEXT NOT NULL CHECK (day_type IN ('push', 'pull', 'legs', 'mobility')),
  muscle_group TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  target_sets INT NOT NULL DEFAULT 3,
  target_reps_min INT NOT NULL DEFAULT 8,
  target_reps_max INT NOT NULL DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id SERIAL PRIMARY KEY,
  session_date DATE NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN ('push', 'pull', 'legs', 'mobility', 'custom')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_date, day_type)
);

CREATE TABLE IF NOT EXISTS session_sets (
  id SERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id INT NOT NULL REFERENCES exercises(id),
  set_number INT NOT NULL,
  weight_kg NUMERIC(5,2),
  reps INT,
  rpe NUMERIC(3,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_sets_session ON session_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_session_sets_exercise ON session_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(session_date);

-- Step 3 (spaeter aktiv): Koerpergewicht-Tracking
CREATE TABLE IF NOT EXISTS bodyweight_logs (
  id SERIAL PRIMARY KEY,
  log_date DATE NOT NULL UNIQUE,
  weight_kg NUMERIC(5,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'renpho')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3 (spaeter aktiv): Tages-Tagebuch
CREATE TABLE IF NOT EXISTS daily_journal (
  id SERIAL PRIMARY KEY,
  log_date DATE NOT NULL UNIQUE,
  sleep_hours NUMERIC(3,1),
  energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
  soreness_level INT CHECK (soreness_level BETWEEN 1 AND 5),
  stress_level INT CHECK (stress_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: Push/Pull/Legs Split fuer Recomp (Mo/Mi/Fr)
INSERT INTO exercises (name, day_type, muscle_group, sort_order, target_sets, target_reps_min, target_reps_max) VALUES
  ('Bankdrücken', 'push', 'Brust', 1, 4, 6, 10),
  ('Schulterdrücken', 'push', 'Schultern', 2, 3, 8, 12),
  ('Dips', 'push', 'Trizeps/Brust', 3, 3, 8, 12),
  ('Seitheben', 'push', 'Schultern', 4, 3, 12, 15),
  ('Trizepsdrücken (Kabel)', 'push', 'Trizeps', 5, 3, 10, 15),
  ('Klimmzüge', 'pull', 'Rücken', 1, 4, 6, 10),
  ('Rudern vorgebeugt', 'pull', 'Rücken', 2, 3, 8, 12),
  ('Latzug', 'pull', 'Rücken', 3, 3, 10, 12),
  ('Face Pulls', 'pull', 'Schultern hinten', 4, 3, 12, 15),
  ('Bizepscurls', 'pull', 'Bizeps', 5, 3, 10, 15),
  ('Kniebeugen', 'legs', 'Beine', 1, 4, 6, 10),
  ('Rumänisches Kreuzheben', 'legs', 'Beinrückseite', 2, 3, 8, 12),
  ('Beinpresse', 'legs', 'Beine', 3, 3, 10, 12),
  ('Wadenheben', 'legs', 'Waden', 4, 3, 12, 20),
  ('Plank / Core', 'legs', 'Core', 5, 3, 30, 60)
ON CONFLICT (name) DO NOTHING;
