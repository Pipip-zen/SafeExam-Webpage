const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const students = db
      .prepare('SELECT * FROM students ORDER BY name ASC')
      .all();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const student = db
      .prepare('SELECT * FROM students WHERE id = ?')
      .get(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: 'Peserta tidak ditemukan' });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  const { student_code, name } = req.body;

  if (!student_code || !name) {
    return res.status(400).json({
      success: false,
      message: 'student_code dan name wajib diisi',
    });
  }

  try {
    const result = db
      .prepare('INSERT INTO students (student_code, name) VALUES (?, ?)')
      .run(student_code, name);
    const newStudent = db
      .prepare('SELECT * FROM students WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: newStudent });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res
        .status(409)
        .json({ success: false, message: 'Kode peserta sudah digunakan' });
    }

    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
