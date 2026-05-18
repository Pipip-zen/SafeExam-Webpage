const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

require('dotenv').config();

const router = express.Router();
const SUPPORTED_VIOLATION_TYPES = [
  'TAB_SWITCH',
  'SUSPICIOUS_KEY',
];

const uploadDir = path.resolve(
  __dirname,
  '..',
  process.env.UPLOAD_DIR || './uploads/evidence'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `evidence_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Hanya file gambar yang diizinkan'), false);
  },
});

router.post('/', upload.single('evidence_image'), (req, res) => {
  const { student_id, violation_type, description, occurred_at } = req.body;

  if (!student_id || !violation_type) {
    return res.status(400).json({
      success: false,
      message: 'student_id dan violation_type wajib diisi',
    });
  }

  if (!SUPPORTED_VIOLATION_TYPES.includes(violation_type)) {
    return res.status(400).json({
      success: false,
      message: 'Jenis pelanggaran tidak didukung',
    });
  }

  const student = db
    .prepare('SELECT * FROM students WHERE id = ?')
    .get(student_id);

  if (!student) {
    return res
      .status(404)
      .json({ success: false, message: 'Peserta tidak ditemukan' });
  }

  const evidenceImagePath = req.file
    ? `/uploads/evidence/${req.file.filename}`
    : null;
  const occurredAt = occurred_at || new Date().toISOString();

  try {
    const result = db
      .prepare(`
        INSERT INTO violations (student_id, violation_type, description, evidence_image, occurred_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        student_id,
        violation_type,
        description || '',
        evidenceImagePath,
        occurredAt
      );

    res.status(201).json({
      success: true,
      message: 'Pelanggaran berhasil dicatat',
      data: { id: result.lastInsertRowid, evidenceImagePath },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const placeholders = SUPPORTED_VIOLATION_TYPES.map(() => '?').join(', ');
    const violations = db
      .prepare(`
        SELECT
          v.id,
          v.violation_type,
          v.description,
          v.evidence_image,
          v.occurred_at,
          s.id as student_id,
          s.student_code,
          s.name as student_name
        FROM violations v
        JOIN students s ON v.student_id = s.id
        WHERE v.violation_type IN (${placeholders})
        ORDER BY v.occurred_at DESC
      `)
      .all(...SUPPORTED_VIOLATION_TYPES);

    res.json({ success: true, data: violations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const violation = db
      .prepare('SELECT * FROM violations WHERE id = ?')
      .get(req.params.id);

    if (!violation) {
      return res
        .status(404)
        .json({ success: false, message: 'Pelanggaran tidak ditemukan' });
    }

    if (violation.evidence_image) {
      const evidencePath = path.resolve(
        __dirname,
        '..',
        violation.evidence_image.replace(/^\//, '')
      );

      if (fs.existsSync(evidencePath)) {
        fs.unlinkSync(evidencePath);
      }
    }

    db.prepare('DELETE FROM violations WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      message: 'Pelanggaran berhasil dihapus',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
