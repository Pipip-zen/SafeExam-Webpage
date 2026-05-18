import { useEffect, useState } from 'react';
import axios from 'axios';
import ViolationCard from '../components/ViolationCard';

const VIOLATION_TYPES = [
  'Semua',
  'TAB_SWITCH',
  'WINDOW_BLUR',
  'EXIT_FULLSCREEN',
  'WEBCAM_DISABLED',
  'SUSPICIOUS_KEY',
  'PAGE_RELOAD_ATTEMPT',
];

function AdminDashboard() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');
  const [error, setError] = useState('');
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [imagePreviewViolation, setImagePreviewViolation] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchViolations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get('/api/violations');
      setViolations(response.data.data);
    } catch {
      setError(
        'Gagal mengambil data pelanggaran. Pastikan backend berjalan.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const handleDeleteViolation = async (violation) => {
    setDeletingId(violation.id);

    try {
      await axios.delete(`/api/violations/${violation.id}`);
      setViolations((prev) => prev.filter((item) => item.id !== violation.id));
      setSelectedViolation((current) =>
        current?.id === violation.id ? null : current
      );
      setDeleteTarget((current) =>
        current?.id === violation.id ? null : current
      );
    } catch {
      setError('Gagal menghapus pelanggaran. Coba lagi.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered =
    filter === 'Semua'
      ? violations
      : violations.filter((violation) => violation.violation_type === filter);

  const stats = [
    {
      label: 'Total Pelanggaran',
      value: violations.length,
      icon: '⚠️',
      color: '#ef4444',
    },
    {
      label: 'Pindah Tab',
      value: violations.filter((item) => item.violation_type === 'TAB_SWITCH')
        .length,
      icon: '🔀',
      color: '#6366f1',
    },
    {
      label: 'Keluar Fullscreen',
      value: violations.filter(
        (item) => item.violation_type === 'EXIT_FULLSCREEN'
      ).length,
      icon: '↙️',
      color: '#f59e0b',
    },
    {
      label: 'Tombol Mencurigakan',
      value: violations.filter(
        (item) => item.violation_type === 'SUSPICIOUS_KEY'
      ).length,
      icon: '⌨️',
      color: '#ec4899',
    },
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {deleteTarget && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(15, 23, 42, 0.72)', zIndex: 3100 }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white shadow-lg p-4"
            style={{ width: 'min(460px, 100%)', borderRadius: '20px' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h5 className="fw-bold mb-1">Hapus Pelanggaran?</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Tindakan ini akan menghapus data pelanggaran dan file bukti
                  gambar jika ada.
                </p>
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                ✕
              </button>
            </div>

            <div
              className="rounded-4 p-3 mb-4"
              style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
            >
              <div className="fw-semibold">{deleteTarget.student_name}</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                {deleteTarget.student_code}
              </div>
              <div className="mt-2" style={{ fontSize: '0.9rem' }}>
                {deleteTarget.violation_type}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
              >
                Batal
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteViolation(deleteTarget)}
                disabled={deletingId === deleteTarget.id}
              >
                {deletingId === deleteTarget.id ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {imagePreviewViolation?.evidence_image && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(2, 6, 23, 0.82)', zIndex: 3000 }}
          onClick={() => setImagePreviewViolation(null)}
        >
          <div
            className="position-relative"
            style={{ width: 'min(1400px, 100%)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="btn btn-light position-absolute top-0 end-0 m-3 rounded-circle"
              style={{ width: 42, height: 42, zIndex: 2 }}
              onClick={() => setImagePreviewViolation(null)}
            >
              ✕
            </button>
            <img
              src={imagePreviewViolation.evidence_image}
              alt="Bukti Pelanggaran Full"
              style={{
                width: '100%',
                maxHeight: '94vh',
                objectFit: 'contain',
                borderRadius: '20px',
                background: '#0f172a',
                boxShadow: '0 24px 80px rgba(0,0,0,0.42)',
              }}
            />
          </div>
        </div>
      )}

      {selectedViolation && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(15, 23, 42, 0.72)', zIndex: 2000 }}
          onClick={() => setSelectedViolation(null)}
        >
          <div
            className="bg-white shadow-lg"
            style={{
              width: 'min(900px, 100%)',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
              <div>
                <h5 className="mb-1 fw-bold">Detail Pelanggaran</h5>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                  ID #{selectedViolation.id}
                </div>
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedViolation(null)}
              >
                ✕
              </button>
            </div>

            <div className="row g-0">
              <div className="col-12 col-lg-7 bg-light">
                {selectedViolation.evidence_image ? (
                  <button
                    type="button"
                    className="p-0 border-0 bg-transparent w-100"
                    onClick={() => setImagePreviewViolation(selectedViolation)}
                  >
                    <img
                      src={selectedViolation.evidence_image}
                      alt="Bukti Pelanggaran"
                      style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: '560px',
                        objectFit: 'cover',
                      }}
                    />
                  </button>
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center h-100"
                    style={{ minHeight: '320px' }}
                  >
                    <span className="text-muted" style={{ fontSize: '3rem' }}>
                      🚫
                    </span>
                  </div>
                )}
              </div>

              <div className="col-12 col-lg-5">
                <div className="p-4">
                  <div className="mb-3">
                    <span
                      className={`badge badge-${selectedViolation.violation_type} px-3 py-2`}
                      style={{ borderRadius: '999px' }}
                    >
                      {selectedViolation.violation_type}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Peserta
                    </div>
                    <div className="fw-semibold">
                      {selectedViolation.student_name}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {selectedViolation.student_code}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Waktu Kejadian
                    </div>
                    <div className="fw-semibold">
                      {new Date(selectedViolation.occurred_at).toLocaleString(
                        'id-ID',
                        {
                          dateStyle: 'full',
                          timeStyle: 'medium',
                        }
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Deskripsi
                    </div>
                    <p className="mb-0" style={{ lineHeight: 1.6 }}>
                      {selectedViolation.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => setDeleteTarget(selectedViolation)}
                      disabled={deletingId === selectedViolation.id}
                    >
                      {deletingId === selectedViolation.id
                        ? 'Menghapus...'
                        : 'Hapus Pelanggaran'}
                    </button>
                    {selectedViolation.evidence_image && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setImagePreviewViolation(selectedViolation)}
                      >
                        Lihat Gambar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="navbar navbar-expand-lg shadow-sm" style={{ background: '#0f172a' }}>
        <div className="container-lg">
          <span className="navbar-brand fw-bold text-white">
            🎓 Admin Dashboard
          </span>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              Exam Proctoring System
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={fetchViolations}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </nav>

      <div className="container-lg py-4">
        <div className="row g-3 mb-4">
          {stats.map((stat) => (
            <div className="col-6 col-md-3" key={stat.label}>
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {stat.label}
                      </div>
                      <div
                        className="fw-bold"
                        style={{
                          fontSize: '1.8rem',
                          color: stat.color,
                          lineHeight: 1.2,
                        }}
                      >
                        {stat.value}
                      </div>
                    </div>
                    <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex gap-2 flex-wrap mb-4">
          {VIOLATION_TYPES.map((type) => (
            <button
              key={type}
              className={`btn btn-sm ${
                filter === type ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              style={{ borderRadius: '20px', fontSize: '0.8rem' }}
              onClick={() => setFilter(type)}
            >
              {type === 'Semua' ? '🗂 Semua' : type.replaceAll('_', ' ')}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Memuat data pelanggaran...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem' }}>✅</div>
            <h5 className="mt-3 text-muted">Tidak ada pelanggaran tercatat</h5>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              {filter !== 'Semua'
                ? 'Coba ubah filter atau jalankan sesi ujian terlebih dahulu.'
                : 'Belum ada sesi ujian yang berjalan.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
              Menampilkan {filtered.length} pelanggaran
              {filter !== 'Semua' ? ` dengan tipe "${filter}"` : ''}
            </p>
            <div className="row g-3">
              {filtered.map((violation) => (
                <div className="col-12 col-sm-6 col-lg-4" key={violation.id}>
                  <ViolationCard
                    violation={violation}
                    onView={setSelectedViolation}
                    onDelete={setDeleteTarget}
                    onImageView={setImagePreviewViolation}
                    deleting={deletingId === violation.id}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
