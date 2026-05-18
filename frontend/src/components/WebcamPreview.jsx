import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const WebcamPreview = forwardRef(({ student, onViolation }, ref) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const readyTimeoutRef = useRef(null);
  const readinessPollRef = useRef(null);
  const attemptRef = useRef(0);
  const [webcamActive, setWebcamActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Menghubungkan kamera...');

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
    isActive: () => webcamActive && videoReady,
  }));

  useEffect(() => {
    startWebcam();

    return () => stopWebcam();
  }, []);

  const startWebcam = async () => {
    const attemptId = ++attemptRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
        audio: false,
      });

      if (attemptId !== attemptRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      streamRef.current = stream;
      setStatusMessage('Menghubungkan kamera...');
      setWebcamActive(true);
      setPermissionDenied(false);
      setVideoReady(false);

      if (videoRef.current) {
        const video = videoRef.current;

        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.srcObject = stream;

        try {
          await video.play();
        } catch (playError) {
          if (
            playError?.name !== 'AbortError' ||
            attemptId === attemptRef.current
          ) {
            console.error('Gagal memutar preview webcam:', playError);
            setStatusMessage('Preview kamera gagal diputar');
          }
        }
      }

      readinessPollRef.current = setInterval(() => {
        if (!videoRef.current || attemptId !== attemptRef.current) {
          return;
        }

        const video = videoRef.current;
        const hasFrame =
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          video.readyState >= 2 &&
          !video.paused;

        if (hasFrame) {
          clearInterval(readinessPollRef.current);
          clearTimeout(readyTimeoutRef.current);
          setVideoReady(true);
          setStatusMessage('');
        }
      }, 250);

      readyTimeoutRef.current = setTimeout(() => {
        if (
          videoRef.current &&
          (videoRef.current.videoWidth === 0 ||
            videoRef.current.videoHeight === 0)
        ) {
          setStatusMessage('Kamera terdeteksi, tapi preview belum muncul');
        }
      }, 4000);

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (attemptId !== attemptRef.current) {
          return;
        }

        setWebcamActive(false);
        setVideoReady(false);
        setStatusMessage('Kamera dihentikan');

        if (onViolation) {
          onViolation(
            'WEBCAM_DISABLED',
            'Kamera berhenti atau dinonaktifkan oleh sistem'
          );
        }
      });
    } catch (err) {
      if (attemptId !== attemptRef.current) {
        return;
      }

      setWebcamActive(false);
      setPermissionDenied(true);
      setVideoReady(false);
      setStatusMessage('Izin kamera ditolak atau device tidak tersedia');

      if (onViolation) {
        onViolation('WEBCAM_DISABLED', 'Izin kamera ditolak oleh peserta');
      }
    }
  };

  const stopWebcam = () => {
    attemptRef.current += 1;
    clearTimeout(readyTimeoutRef.current);
    clearInterval(readinessPollRef.current);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
    setVideoReady(false);
  };

  return (
    <div className="webcam-preview">
      <div className="webcam-label">Camera</div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '135px',
          objectFit: 'cover',
          display: webcamActive && videoReady ? 'block' : 'none',
        }}
      />
      {!webcamActive ? (
        <div className="webcam-disabled-overlay">
          <span style={{ fontSize: '1.5rem' }}>Camera Off</span>
          <span>{permissionDenied ? 'Izin Ditolak' : 'Kamera Nonaktif'}</span>
          {permissionDenied && (
            <button
              className="btn btn-sm btn-outline-light mt-1"
              style={{ fontSize: '10px', padding: '2px 8px' }}
              onClick={startWebcam}
            >
              Coba Lagi
            </button>
          )}
        </div>
      ) : !videoReady ? (
        <div className="webcam-disabled-overlay">
          <span style={{ fontSize: '1.1rem' }}>{statusMessage}</span>
          <span>Menunggu frame pertama tampil</span>
          <small style={{ color: '#fca5a5', textAlign: 'center' }}>
            {videoRef.current
              ? `state:${videoRef.current.readyState} size:${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
              : 'video belum siap'}
          </small>
        </div>
      ) : null}
    </div>
  );
});

WebcamPreview.displayName = 'WebcamPreview';

export default WebcamPreview;
