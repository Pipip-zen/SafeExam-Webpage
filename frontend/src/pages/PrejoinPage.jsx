import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamPreview from '../components/WebcamPreview';

function PrejoinPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [webcamStatus, setWebcamStatus] = useState({
    active: false,
    ready: false,
    permissionDenied: false,
    message: 'Menyiapkan kamera...',
  });
  const [startError, setStartError] = useState('');
  const [startingExam, setStartingExam] = useState(false);

  useEffect(() => {
    const savedStudent = sessionStorage.getItem('student');

    if (!savedStudent) {
      navigate('/login');
      return;
    }

    setStudent(JSON.parse(savedStudent));
  }, []);

  const handleStartExam = async () => {
    if (!webcamStatus.ready) {
      setStartError(
        'Izinkan kamera dan pastikan preview tampil sebelum mulai ujian.'
      );
      return;
    }

    setStartError('');
    setStartingExam(true);

    try {
      await document.documentElement.requestFullscreen();
      sessionStorage.setItem('examReady', 'true');
      navigate('/exam');
    } catch (err) {
      setStartError(
        'Browser menolak fullscreen. Izinkan fullscreen untuk mulai ujian.'
      );
      setStartingExam(false);
    }
  };

  return (
    <main
      className="prejoin-shell"
      style={{
        background:
          'radial-gradient(circle at top, rgba(59, 130, 246, 0.28), transparent 32%), linear-gradient(160deg, #081121 0%, #111827 55%, #030712 100%)',
      }}
    >
      <section className="prejoin-card">
        <div className="prejoin-copy">
          <span className="prejoin-kicker">Check Room</span>
          <h1>Periksa kamera sebelum masuk ke ruang ujian.</h1>
          <p>
            Peserta <strong>{student?.student_code}</strong> - {student?.name}
          </p>

          <div className="prejoin-rules">
            <div>
              <strong>1.</strong> Izinkan akses kamera di browser.
            </div>
            <div>
              <strong>2.</strong> Pastikan preview kamera benar-benar muncul.
            </div>
            <div>
              <strong>3.</strong> Klik <strong>Mulai Ujian</strong> untuk masuk fullscreen dan memulai ujian.
            </div>
          </div>

          <div className="prejoin-status-card">
            <div className="prejoin-status-line">
              <span
                className={`status-dot ${webcamStatus.ready ? 'ok' : 'warn'}`}
              ></span>
              <span>{webcamStatus.message}</span>
            </div>
            <small className="text-muted">
              {webcamStatus.permissionDenied
                ? 'Akses kamera ditolak. Anda tidak bisa lanjut sampai izin diberikan.'
                : webcamStatus.ready
                  ? 'Preview kamera aktif. Anda bisa mulai ujian.'
                  : 'Sistem masih menunggu preview kamera.'}
            </small>
          </div>

          {startError && (
            <div className="alert alert-danger mt-3 mb-0">{startError}</div>
          )}

          {webcamStatus.permissionDenied && (
            <div className="alert alert-warning mt-3 mb-0">
              <strong>Izin kamera diblokir browser.</strong> Klik ikon kamera
              atau ikon gembok di address bar, ubah akses kamera menjadi
              <strong> Allow</strong>, lalu reload halaman atau klik
              <strong> Coba Lagi</strong>.
            </div>
          )}

          <div className="d-flex gap-3 flex-wrap mt-4">
            <button
              className="btn btn-light"
              onClick={() => {
                sessionStorage.removeItem('student');
                sessionStorage.removeItem('examReady');
                navigate('/login');
              }}
            >
              Ganti Peserta
            </button>
            <button
              className="btn btn-primary btn-lg px-4"
              disabled={!webcamStatus.ready || startingExam}
              onClick={handleStartExam}
            >
              {startingExam ? 'Memulai...' : 'Mulai Ujian'}
            </button>
          </div>
        </div>

        <div className="prejoin-preview-panel">
          <div className="prejoin-preview-frame">
            <WebcamPreview floating={false} onStatusChange={setWebcamStatus} />
          </div>
        </div>
      </section>
    </main>
  );
}

export default PrejoinPage;
