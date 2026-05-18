import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamPreview from '../components/WebcamPreview';

const QUESTIONS = [
  {
    id: 1,
    question: 'Apa kepanjangan dari HTML?',
    options: [
      'HyperText Markup Language',
      'High Transfer Markup Language',
      'HyperText Modeling Language',
      'High Text Markup Language',
    ],
  },
  {
    id: 2,
    question: 'Manakah yang merupakan bahasa pemrograman back-end?',
    options: ['HTML', 'CSS', 'Node.js', 'Bootstrap'],
  },
  {
    id: 3,
    question: 'Apa fungsi utama dari CSS?',
    options: [
      'Menambah logika program',
      'Mengatur tampilan halaman web',
      'Menghubungkan ke database',
      'Mengelola routing aplikasi',
    ],
  },
  {
    id: 4,
    question: 'Database manakah yang termasuk jenis NoSQL?',
    options: ['MySQL', 'PostgreSQL', 'SQLite', 'MongoDB'],
  },
  {
    id: 5,
    question: 'Apa itu API dalam pengembangan web?',
    options: [
      'Antarmuka grafis pengguna',
      'Application Programming Interface',
      'Automated Program Index',
      'Advanced Programming Input',
    ],
  },
];

const EXAM_DURATION = 30 * 60;

function ExamPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [examFinished, setExamFinished] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [violationLog, setViolationLog] = useState([]);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const webcamRef = useRef(null);
  const violationCooldown = useRef({});
  const pageLeavingRef = useRef(false);

  useEffect(() => {
    const savedStudent = sessionStorage.getItem('student');
    const examReady = sessionStorage.getItem('examReady');

    if (!savedStudent) {
      navigate('/login');
      return;
    }

    if (!examReady) {
      navigate('/prejoin');
      return;
    }

    setStudent(JSON.parse(savedStudent));
    setIsFullscreen(!!document.fullscreenElement);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinish();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (pageLeavingRef.current) {
        return;
      }

      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);

      if (!inFullscreen) {
        handleViolationDetected(
          'EXIT_FULLSCREEN',
          'Peserta keluar dari mode fullscreen'
        );
        setFullscreenExitCount((prev) => {
          const nextCount = prev + 1;

          if (nextCount >= 2) {
            forceExitExam();
            return nextCount;
          }

          setShowFullscreenWarning(true);
          return nextCount;
        });
      } else {
        setShowFullscreenWarning(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!student) {
      return;
    }

    const handleVisibility = () => {
      if (document.hidden) {
        handleViolationDetected(
          'TAB_SWITCH',
          'Peserta berpindah tab atau meminimalkan jendela browser'
        );
      }
    };

    const handleBlur = () => {
      handleViolationDetected(
        'WINDOW_BLUR',
        'Jendela browser kehilangan fokus'
      );
    };

    const suspiciousKeys = [
      { key: 'F12', check: (event) => event.key === 'F12' },
      { key: 'F5', check: (event) => event.key === 'F5' },
      {
        key: 'Ctrl+Shift+I',
        check: (event) =>
          event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i',
      },
      {
        key: 'Ctrl+Shift+J',
        check: (event) =>
          event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'j',
      },
      {
        key: 'Ctrl+Shift+C',
        check: (event) =>
          event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'c',
      },
      {
        key: 'Ctrl+T',
        check: (event) => event.ctrlKey && event.key.toLowerCase() === 't',
      },
      {
        key: 'Ctrl+N',
        check: (event) => event.ctrlKey && event.key.toLowerCase() === 'n',
      },
      {
        key: 'Ctrl+W',
        check: (event) => event.ctrlKey && event.key.toLowerCase() === 'w',
      },
      {
        key: 'Ctrl+R',
        check: (event) => event.ctrlKey && event.key.toLowerCase() === 'r',
      },
      {
        key: 'Cmd+R',
        check: (event) => event.metaKey && event.key.toLowerCase() === 'r',
      },
      { key: 'Alt+Tab', check: (event) => event.altKey && event.key === 'Tab' },
      { key: 'Win Key', check: (event) => event.key === 'Meta' },
    ];

    const handleKeyDown = (event) => {
      const matched = suspiciousKeys.find((entry) => entry.check(event));

      if (!matched) {
        return;
      }

      event.preventDefault();
      handleViolationDetected(
        'SUSPICIOUS_KEY',
        `Peserta menekan tombol mencurigakan: ${matched.key}`
      );
    };

    const handleBeforeUnload = (event) => {
      pageLeavingRef.current = true;
      event.preventDefault();
      event.returnValue = '';
      handleViolationDetected(
        'PAGE_RELOAD_ATTEMPT',
        'Peserta mencoba menutup atau reload halaman ujian'
      );
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [student]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
  };

  const timerClass = () => {
    if (timeLeft <= 300) {
      return 'exam-timer danger';
    }

    if (timeLeft <= 600) {
      return 'exam-timer warning';
    }

    return 'exam-timer';
  };

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleFinish = () => {
    pageLeavingRef.current = true;
    clearInterval(timerRef.current);
    setExamFinished(true);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const captureAndUpload = (violation) => {
    console.debug('captureAndUpload pending Task 13:', violation);
  };

  const handleViolationDetected = (violationType, description) => {
    const now = Date.now();

    if (
      violationCooldown.current[violationType] &&
      now - violationCooldown.current[violationType] < 5000
    ) {
      return;
    }

    violationCooldown.current[violationType] = now;

    console.warn(`[VIOLATION] ${violationType}: ${description}`);

    setToast({ type: violationType, description, id: now });
    window.setTimeout(() => {
      setToast((current) => (current?.id === now ? null : current));
    }, 4000);

    const violation = {
      type: violationType,
      description,
      occurred_at: new Date().toISOString(),
      student_id: student?.id,
    };

    setViolationLog((prev) => [...prev, violation]);
    captureAndUpload(violation);
  };

  const returnToFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    } catch (err) {
      console.warn('Fullscreen gagal:', err);
    }
  };

  const forceExitExam = () => {
    pageLeavingRef.current = true;
    clearInterval(timerRef.current);
    sessionStorage.removeItem('examReady');
    sessionStorage.removeItem('student');
    navigate('/login');
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  if (examFinished) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center exam-body">
        <div className="text-center">
          <div style={{ fontSize: '4rem' }}>OK</div>
          <h2 className="fw-bold mt-3">Ujian Selesai</h2>
          <p className="text-muted">
            Terima kasih, {student?.name}. Jawaban Anda telah dicatat.
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => {
              sessionStorage.clear();
              navigate('/login');
            }}
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-body pb-5" id="exam-content">
      {toast && (
        <div className="violation-toast alert alert-danger d-flex align-items-start gap-2 shadow">
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong>Pelanggaran Terdeteksi!</strong>
            <div style={{ fontSize: '0.85rem' }}>{toast.description}</div>
            <div
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginTop: '2px',
              }}
            >
              Kode: <code>{toast.type}</code>
            </div>
          </div>
        </div>
      )}

      {showFullscreenWarning && (
        <div className="fullscreen-overlay">
          <h3 className="fw-bold">Anda keluar dari mode fullscreen</h3>
          <p className="text-muted" style={{ maxWidth: '400px' }}>
            Klik tombol di bawah untuk kembali ke mode fullscreen dan
            melanjutkan ujian. Jika Anda menekan ESC sekali lagi, Anda akan
            keluar dari ujian.
          </p>
          <button
            className="btn btn-primary btn-lg px-5"
            onClick={returnToFullscreen}
          >
            Lanjutkan Ujian
          </button>
        </div>
      )}

      <div
        className="sticky-top"
        style={{
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          zIndex: 100,
        }}
      >
        <div className="container-lg py-3 d-flex align-items-center justify-content-between">
          <div>
            <span className="fw-bold" style={{ color: '#60a5fa' }}>
              Exam Proctoring
            </span>
            <span className="text-muted ms-3" style={{ fontSize: '0.85rem' }}>
              {student?.student_code} - {student?.name}
            </span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className={timerClass()}>Timer {formatTime(timeLeft)}</span>
            {!isFullscreen && (
              <span className="badge text-bg-warning text-dark">
                Tidak fullscreen
              </span>
            )}
            <button
              className="btn btn-outline-light btn-sm"
              onClick={handleFinish}
            >
              Selesai Ujian
            </button>
          </div>
        </div>
      </div>

      <div className="container-xl mt-4 exam-layout">
        <div className="exam-main-column">
          <div className="mb-4">
            <h5 className="fw-bold" style={{ color: '#e2e8f0' }}>
              Soal Ujian
            </h5>
            <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
              Kerjakan soal satu per satu. Jawaban tersimpan otomatis saat Anda
              memilih opsi.
            </p>
            <div className="exam-progress-meta">
              <span>
                Soal {currentQuestionIndex + 1} dari {QUESTIONS.length}
              </span>
              <span>{answeredCount} terjawab</span>
            </div>
          </div>

          <div className="question-card exam-question-stage">
            <div className="question-number mb-2">
              Soal {currentQuestionIndex + 1}
            </div>
            <p
              className="fw-semibold mb-4"
              style={{ color: '#f1f5f9', fontSize: '1.1rem' }}
            >
              {currentQuestion.question}
            </p>
            <div className="d-flex flex-column gap-2">
              {currentQuestion.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className="d-flex align-items-center gap-3 px-3 py-3 cursor-pointer exam-option"
                  style={{
                    background:
                      answers[currentQuestion.id] === optionIndex
                        ? '#1e40af'
                        : '#374151',
                    border: `2px solid ${
                      answers[currentQuestion.id] === optionIndex
                        ? '#3b82f6'
                        : 'transparent'
                    }`,
                  }}
                >
                  <input
                    type="radio"
                    name={`q${currentQuestion.id}`}
                    checked={answers[currentQuestion.id] === optionIndex}
                    onChange={() =>
                      handleAnswer(currentQuestion.id, optionIndex)
                    }
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <span style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="exam-nav-controls">
            <button
              className="btn btn-outline-light"
              disabled={currentQuestionIndex === 0}
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))
              }
            >
              Kembali
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(prev + 1, QUESTIONS.length - 1)
                )
              }
              disabled={currentQuestionIndex === QUESTIONS.length - 1}
            >
              Selanjutnya
            </button>
          </div>

          <div
            className="mt-4 p-3 rounded"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <small style={{ color: '#cbd5e1' }}>
              Jawaban tersimpan otomatis. Gunakan panel kanan untuk lompat ke
              soal tertentu, atau klik <strong>"Selesai Ujian"</strong> jika
              sudah selesai.
            </small>
          </div>
        </div>

        <aside className="exam-side-column">
          <div className="question-card exam-nav-panel">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <div className="question-number mb-1">Navigasi Soal</div>
                <small className="text-muted">Klik nomor untuk berpindah</small>
              </div>
              <span className="badge rounded-pill text-bg-primary">
                {answeredCount}/{QUESTIONS.length}
              </span>
            </div>
            <div className="question-grid">
              {QUESTIONS.map((question, index) => {
                const isActive = index === currentQuestionIndex;
                const isAnswered = answers[question.id] !== undefined;

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`question-jump-btn ${
                      isActive ? 'active' : ''
                    } ${isAnswered ? 'answered' : ''}`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="exam-nav-legend mt-4">
              <div>
                <span className="legend-dot current"></span>
                <small>Sedang dibuka</small>
              </div>
              <div>
                <span className="legend-dot answered"></span>
                <small>Sudah dijawab</small>
              </div>
              <div>
                <span className="legend-dot unanswered"></span>
                <small>Belum dijawab</small>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <WebcamPreview ref={webcamRef} onViolation={handleViolationDetected} />
    </div>
  );
}

export default ExamPage;
