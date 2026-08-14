require('dotenv').config();
const express = require('express');
const cors = require('cors');

const exercisesRouter = require('./routes/exercises');
const sessionsRouter = require('./routes/sessions');
const bodyweightRouter = require('./routes/bodyweight');
const journalRouter = require('./routes/journal');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/exercises', exercisesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/bodyweight', bodyweightRouter);
app.use('/api/journal', journalRouter);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Fitness API läuft auf Port ${PORT}`);
});
