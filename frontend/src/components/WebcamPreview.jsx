import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const WebcamPreview = forwardRef(
  ({ onViolation, onStatusChange, floating = true }, ref) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const readinessPollRef = useRef(null);
    const readyTimeoutRef = useRef(null);
    const attemptRef = useRef(0);
    const [webcamActive, setWebcamActive] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [permissionState, setPermissionState] = useState('prompt');
    const [videoReady, setVideoReady] = useState(false);
    const [statusMessage, setStatusMessage] = useState(
      'Menghubungkan kamera...'
    );

    useImperativeHandle(ref, () => ({
      getVideoElement: () => videoRef.current,
      isActive: () => webcamActive && videoReady,
    }));

    useEffect(() => {
      startWebcam();

      return () => stopWebcam();
    }, []);

    useEffect(() => {
      let permissionStatus;

      const syncPermission = async () => {
        if (!navigator.permissions?.query) {
          return;
        }

        try {
          permissionStatus = await navigator.permissions.query({
            name: 'camera',
          });
          setPermissionState(permissionStatus.state);
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
          };
        } catch (err) {
          // Some browsers do not support querying camera permission.
        }
      };

      syncPermission();

      return () => {
        if (permissionStatus) {
          permissionStatus.onchange = null;
        }
      };
    }, []);

    useEffect(() => {
      if (!onStatusChange) {
        return;
      }

      onStatusChange({
        active: webcamActive,
        ready: webcamActive && videoReady,
        permissionDenied,
        message: statusMessage,
      });
    }, [onStatusChange, webcamActive, videoReady, permissionDenied, statusMessage]);

    const startWebcam = async () => {
      const attemptId = ++attemptRef.current;

      clearInterval(readinessPollRef.current);
      clearTimeout(readyTimeoutRef.current);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
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
        setWebcamActive(true);
        setPermissionDenied(false);
        setPermissionState('granted');
        setVideoReady(false);
        setStatusMessage('Menghubungkan kamera...');

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;

          try {
            await video.play();
          } catch (playError) {
            if (playError?.name !== 'AbortError') {
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
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0 &&
            !video.paused;

          if (hasFrame) {
            clearInterval(readinessPollRef.current);
            clearTimeout(readyTimeoutRef.current);
            setVideoReady(true);
            setStatusMessage('Preview kamera aktif');
          }
        }, 200);

        readyTimeoutRef.current = setTimeout(() => {
          if (
            videoRef.current &&
            (videoRef.current.videoWidth === 0 ||
              videoRef.current.videoHeight === 0)
          ) {
            setStatusMessage('Kamera terdeteksi, tapi preview belum muncul');
          }
        }, 4000);

        const [track] = stream.getVideoTracks();

        if (track) {
          track.addEventListener('ended', () => {
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
        }
      } catch (err) {
        if (attemptId !== attemptRef.current) {
          return;
        }

        setWebcamActive(false);
        setPermissionDenied(true);
        setPermissionState('denied');
        setVideoReady(false);
        setStatusMessage(
          'Izin kamera ditolak atau device tidak tersedia'
        );

        if (onViolation) {
          onViolation('WEBCAM_DISABLED', 'Izin kamera ditolak oleh peserta');
        }
      }
    };

    const stopWebcam = () => {
      attemptRef.current += 1;
      clearInterval(readinessPollRef.current);
      clearTimeout(readyTimeoutRef.current);

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
      setStatusMessage('Kamera nonaktif');
    };

    return (
      <div className={`webcam-preview${floating ? '' : ' webcam-preview-inline'}`}>
        <div className="webcam-label">Camera</div>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: floating ? '135px' : '315px',
            objectFit: 'cover',
            display: webcamActive && videoReady ? 'block' : 'none',
          }}
        />

        {!webcamActive ? (
        <div className="webcam-disabled-overlay">
          <span style={{ fontSize: '1.4rem' }}>Camera Off</span>
          <span>{permissionDenied ? 'Izin Ditolak' : 'Kamera Nonaktif'}</span>
        </div>
        ) : !videoReady ? (
          <div className="webcam-disabled-overlay">
            <span style={{ fontSize: '1.05rem' }}>{statusMessage}</span>
            <span>Menunggu frame pertama tampil</span>
          </div>
        ) : null}
      </div>
    );
  }
);

WebcamPreview.displayName = 'WebcamPreview';

export default WebcamPreview;
