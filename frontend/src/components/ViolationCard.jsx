const VIOLATION_LABELS = {
  TAB_SWITCH: { label: 'Pindah Tab', icon: '🔀' },
  WINDOW_BLUR: { label: 'Kehilangan Fokus', icon: '🪟' },
  EXIT_FULLSCREEN: { label: 'Keluar Fullscreen', icon: '↙️' },
  WEBCAM_DISABLED: { label: 'Kamera Mati', icon: '📵' },
  SUSPICIOUS_KEY: { label: 'Tombol Mencurigakan', icon: '⌨️' },
  PAGE_RELOAD_ATTEMPT: { label: 'Coba Reload', icon: '🔄' },
};

function ViolationCard({ violation, onView, onDelete, onImageView, deleting }) {
  const meta = VIOLATION_LABELS[violation.violation_type] || {
    label: violation.violation_type,
    icon: '⚠️',
  };
  const time = new Date(violation.occurred_at).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const imageUrl = violation.evidence_image ? `${violation.evidence_image}` : null;

  return (
    <div className="violation-card bg-white">
      {imageUrl ? (
        <button
          type="button"
          className="p-0 border-0 bg-transparent w-100"
          onClick={() => onImageView(violation)}
        >
          <img src={imageUrl} alt="Bukti Pelanggaran" className="evidence-img" />
        </button>
      ) : (
        <div className="evidence-img d-flex align-items-center justify-content-center bg-light">
          <span className="text-muted" style={{ fontSize: '2rem' }}>
            🚫
          </span>
        </div>
      )}

      <div className="p-3">
        <div className="mb-2">
          <span
            className={`badge badge-${violation.violation_type} px-2 py-1`}
            style={{ fontSize: '0.75rem', borderRadius: '6px' }}
          >
            {meta.icon} {meta.label}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 mb-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
            style={{
              width: 32,
              height: 32,
              background: '#1a56db',
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          >
            {violation.student_name?.charAt(0)}
          </div>
          <div>
            <div
              className="fw-semibold"
              style={{ fontSize: '0.9rem', lineHeight: 1.2 }}
            >
              {violation.student_name}
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {violation.student_code}
            </div>
          </div>
        </div>

        <p
          className="text-muted mb-2"
          style={{ fontSize: '0.8rem', lineHeight: 1.4 }}
        >
          {violation.description}
        </p>

        <div
          className="d-flex align-items-center gap-1 text-muted"
          style={{ fontSize: '0.75rem' }}
        >
          <span>🕐</span>
          <span>{time}</span>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => onView(violation)}>
            Detail
          </button>
          <button
            className="btn btn-sm btn-outline-danger flex-fill"
            onClick={() => onDelete(violation)}
            disabled={deleting}
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViolationCard;
