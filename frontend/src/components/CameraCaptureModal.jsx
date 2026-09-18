import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';

export const CameraCaptureModal = ({ isOpen, onClose, onCapturePhoto }) => {
  const [stream, setStream] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setPhotoDataUrl(null);
      setCameraError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setPhotoDataUrl(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      // Exact error requirement from Requirement 10:
      setCameraError('Unable to access camera. Please allow camera permission or upload an image instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  const handleUsePhoto = () => {
    if (photoDataUrl) {
      // Convert Data URL to standard File object
      fetch(photoDataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapturePhoto(file, photoDataUrl);
          onClose();
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              Vehicle Camera Capture
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Content */}
        <div className="p-5 bg-slate-900 flex flex-col items-center justify-center min-h-[360px] relative">
          {cameraError ? (
            <div className="p-6 bg-red-950/80 border border-red-800 rounded-lg text-center max-w-md">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-200 text-sm font-medium">
                {cameraError}
              </p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-md shadow-sm"
              >
                Retry Camera Access
              </button>
            </div>
          ) : photoDataUrl ? (
            /* Snapshot Preview */
            <div className="w-full flex flex-col items-center">
              <img
                src={photoDataUrl}
                alt="Captured Vehicle Area"
                className="max-h-[380px] w-auto object-contain rounded-md border border-slate-700 shadow-md"
              />
              <span className="text-xs text-slate-400 mt-2">
                Photo captured. Verify clarity and damage visibility.
              </span>
            </div>
          ) : (
            /* Live Video Stream */
            <div className="w-full flex flex-col items-center relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => videoRef.current && videoRef.current.play()}
                className="max-h-[380px] w-full object-cover rounded-md border border-slate-800"
              />
              {/* Automotive framing reticle */}
              <div className="absolute inset-4 pointer-events-none border border-white/20 rounded flex items-center justify-center">
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/50 bg-black/40 px-2 py-0.5 rounded">
                  Align Vehicle Panel
                </span>
              </div>
            </div>
          )}

          {/* Hidden Canvas for capture rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {photoDataUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="btn-secondary flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Use Photo
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={Boolean(cameraError)}
                className="btn-primary flex items-center gap-2 px-6"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
