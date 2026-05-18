# 🎓 Safe Exam Web

Sistem ujian online termonitoring berbasis web untuk demo projek akhir.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React + Vite + Bootstrap |
| Backend | Node.js + Express.js |
| Database | SQLite (`better-sqlite3`) |
| Upload | Multer |
| Screenshot | `html2canvas` |

## Prasyarat

- Node.js >= 18
- NPM >= 9

## Cara Menjalankan

### 1. Clone & Install

```bash
git clone <repo-url>
cd exam-proctoring-demo
npm run install:all
```

### 2. Jalankan Aplikasi

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

### 3. Buka Aplikasi

| Halaman | URL |
|---------|-----|
| Login Peserta | `http://localhost:3000/login` |
| Halaman Prejoin | `http://localhost:3000/prejoin` |
| Halaman Ujian | `http://localhost:3000/exam` |
| Dashboard Admin | `http://localhost:3000/admin` |

## Struktur Folder

```text
exam-proctoring-demo/
├── package.json              # Root runner
├── frontend/                 # React + Vite
│   ├── public/               # Favicon / static assets
│   └── src/
│       ├── components/       # WebcamPreview, ViolationCard
│       ├── pages/            # LoginPage, PrejoinPage, ExamPage, AdminDashboard
│       └── styles/           # main.css
└── backend/                  # Express.js
    ├── server.js
    ├── db.js                 # SQLite setup + seed
    ├── routes/               # students.js, violations.js
    ├── database/             # exam_proctoring.db (auto-created)
    └── uploads/evidence/     # Screenshot bukti (auto-created)
```

## Fitur Utama

- Login peserta dari daftar data siswa
- Halaman prejoin untuk cek kamera sebelum ujian
- Ujian mode fullscreen dengan preview webcam
- Dashboard admin untuk melihat, preview, dan hapus bukti pelanggaran
- Screenshot otomatis saat pelanggaran browser terdeteksi

## Fitur Deteksi Pelanggaran

| Kode | Trigger |
|------|---------|
| `TAB_SWITCH` | Peserta berpindah tab atau meminimalkan browser |
| `SUSPICIOUS_KEY` | Tombol mencurigakan seperti `F12`, `Ctrl+Shift+I`, `Ctrl+T`, `Ctrl+W`, `Ctrl+R`, dll |

## Data Peserta Default

Database otomatis di-seed dengan 5 peserta:

| Kode | Nama |
|------|------|
| `STD001` | Andi Prasetyo |
| `STD002` | Budi Santoso |
| `STD003` | Citra Dewi |
| `STD004` | Dina Rahayu |
| `STD005` | Eko Nugroho |

## Catatan

- Aplikasi ini adalah MVP untuk demo projek akhir, bukan sistem produksi.
- Database SQLite dan folder upload dibuat otomatis saat backend pertama kali dijalankan.
- Backend sekarang menerima log pelanggaran untuk `TAB_SWITCH` dan `SUSPICIOUS_KEY`.
- Fullscreen tetap diwajibkan saat ujian, tetapi tidak lagi disimpan sebagai tipe pelanggaran di dashboard.
