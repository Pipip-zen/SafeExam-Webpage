function WebcamPreview({ student }) {
  const hasStudent = Boolean(student);

  return (
    <div className="webcam-preview">
      <div className="webcam-label">
        {hasStudent ? `Peserta: ${student.student_code}` : 'Webcam Preview'}
      </div>
      <div className="webcam-disabled-overlay">
        <strong>Webcam belum aktif</strong>
        <span>{hasStudent ? student.name : 'Menunggu data peserta'}</span>
      </div>
    </div>
  );
}

export default WebcamPreview;
