const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const dbPath = path.resolve(
  __dirname,
  process.env.DB_PATH || './database/exam_proctoring.db'
);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    violation_type TEXT NOT NULL,
    description TEXT,
    evidence_image TEXT,
    occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
  )
`);

const count = db.prepare('SELECT COUNT(*) as count FROM students').get();

if (count.count === 0) {
  const insert = db.prepare(
    'INSERT INTO students (student_code, name) VALUES (?, ?)'
  );
  const students = [
    ['STD001', 'Andi Prasetyo'],
    ['STD002', 'Budi Santoso'],
    ['STD003', 'Citra Dewi'],
    ['STD004', 'Dina Rahayu'],
    ['STD005', 'Eko Nugroho'],
  ];

  students.forEach(([code, name]) => insert.run(code, name));
  console.log('Data peserta awal berhasil di-seed');
}

console.log('Database SQLite siap');

module.exports = db;
