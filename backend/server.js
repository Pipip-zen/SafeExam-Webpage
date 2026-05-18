require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const studentsRouter = require('./routes/students');
const violationsRouter = require('./routes/violations');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/students', studentsRouter);
app.use('/api/violations', violationsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Exam Proctoring API is running' });
});

app.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
});
