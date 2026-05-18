import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('/api/students')
      .then((res) => {
        setStudents(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Gagal mengambil data peserta. Pastikan backend berjalan.');
        setLoading(false);
      });
  }, []);

  const handleLogin = () => {
    if (!selectedId) {
      setError('Pilih peserta terlebih dahulu');
      return;
    }

    const student = students.find((s) => s.id === parseInt(selectedId, 10));

    if (!student) {
      return;
    }

    sessionStorage.setItem('student', JSON.stringify(student));
    navigate('/exam');
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #1a56db 0%, #1e429f 100%)' }}
    >
      <div
        className="card shadow-lg"
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '16px',
          border: 'none',
        }}
      >
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div className="mb-3" style={{ fontSize: '3rem' }}>
              🎓
            </div>
            <h2 className="fw-bold mb-1" style={{ color: '#111827' }}>
              Exam Proctoring
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
              Sistem Ujian Online Termonitoring
            </p>
          </div>

          <div
            className="alert alert-info py-2 px-3 mb-4"
            style={{ fontSize: '0.85rem', borderRadius: '8px' }}
          >
            <strong>⚠️ Perhatian:</strong> Sistem akan meminta akses kamera dan
            mode fullscreen saat ujian dimulai.
          </div>

          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted small">Memuat data peserta...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="form-label fw-semibold text-dark">
                  Pilih Peserta
                </label>
                <select
                  className="form-select form-select-lg"
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setError('');
                  }}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="">-- Pilih nama Anda --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.student_code} - {student.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div
                  className="alert alert-danger py-2 px-3 mb-3"
                  style={{ fontSize: '0.85rem', borderRadius: '8px' }}
                >
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary btn-lg w-100 fw-semibold"
                onClick={handleLogin}
                style={{
                  borderRadius: '10px',
                  backgroundColor: '#1a56db',
                  border: 'none',
                  padding: '12px',
                }}
              >
                Masuk ke Ruang Ujian →
              </button>
            </>
          )}

          <div className="text-center mt-4">
            <a
              href="/admin"
              className="text-muted"
              style={{ fontSize: '0.8rem', textDecoration: 'none' }}
            >
              🔐 Buka Dashboard Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
