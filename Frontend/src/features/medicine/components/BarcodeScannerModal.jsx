import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Camera,
  Keyboard,
  AlertCircle,
  RefreshCw,
  Sparkles,
  SwitchCamera,
  CheckCircle2,
} from 'lucide-react';
import Button from '../../../components/ui/Button';

export const BarcodeScannerModal = ({
  isOpen,
  onClose,
  onScanSuccess,
  onManualEntryClick,
}) => {
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasScanned, setHasScanned] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const scannerRef = useRef(null);
  const containerId = 'barcode-scanner-viewport';

  // Helper to play subtle success beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio autoplay might be blocked
    }
  };

  const stopScannerInstance = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      try {
        scannerRef.current.clear();
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
    }
  }, []);

  const initAndStartCamera = useCallback(
    async (cameraIndex = 0) => {
      setIsInitializing(true);
      setCameraError(null);
      setHasScanned(false);

      await stopScannerInstance();

      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        // Discover all video devices
        let cameraList = [];
        try {
          cameraList = await Html5Qrcode.getCameras();
          if (cameraList && cameraList.length > 0) {
            setCameras(cameraList);
          }
        } catch (camErr) {
          console.warn('Could not list cameras directly:', camErr);
        }

        // Camera selection logic — prioritize exact BACK / REAR camera
        let selectedCameraConfig = null;

        if (cameraList.length > 0) {
          // If specific index requested (user clicked switch camera)
          if (cameraIndex > 0 && cameraIndex < cameraList.length) {
            selectedCameraConfig = cameraList[cameraIndex].id;
          } else {
            // Find back / rear camera explicitly by label
            const rearIndex = cameraList.findIndex((c) => {
              const label = (c.label || '').toLowerCase();
              return (
                label.includes('back') ||
                label.includes('rear') ||
                label.includes('environment') ||
                label.includes('facing back') ||
                label.includes('0, facing back')
              );
            });

            if (rearIndex !== -1) {
              selectedCameraConfig = cameraList[rearIndex].id;
              setActiveCameraIndex(rearIndex);
            } else {
              // On phones, back camera is typically the last device
              const fallbackIndex = cameraList.length - 1;
              selectedCameraConfig = cameraList[fallbackIndex].id;
              setActiveCameraIndex(fallbackIndex);
            }
          }
        } else {
          // Fallback to environment facingMode constraints
          selectedCameraConfig = { facingMode: { ideal: 'environment' } };
        }

        const config = {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxWidth = Math.min(Math.floor(minEdge * 0.88), 340);
            const boxHeight = Math.floor(boxWidth * 0.55); // Rectangular frame ideal for medicine barcodes
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: window.innerWidth < 640 ? 1.0 : 1.333333,
        };

        await html5QrCode.start(
          selectedCameraConfig,
          config,
          (decodedText) => {
            if (hasScanned) return;
            setHasScanned(true);
            playBeep();

            // Give tiny delay for user to see success state
            setTimeout(async () => {
              await stopScannerInstance();
              onScanSuccess(decodedText.trim());
            }, 300);
          },
          () => {
            // Frame passed without detection
          }
        );

        setIsInitializing(false);
      } catch (err) {
        setIsInitializing(false);
        const errMsg = String(err?.message || err).toLowerCase();
        if (errMsg.includes('permission') || errMsg.includes('notallowed')) {
          setCameraError(
            'Camera permission is denied. Please grant camera permission in your browser or enter the barcode manually.'
          );
        } else if (
          errMsg.includes('notfound') ||
          errMsg.includes('device') ||
          errMsg.includes('no camera')
        ) {
          setCameraError('No active camera found. Please enter barcode manually.');
        } else if (errMsg.includes('secure') || errMsg.includes('https')) {
          setCameraError('Camera access requires HTTPS or localhost.');
        } else {
          setCameraError(
            'Could not open rear camera. Tap below to switch camera or enter manually.'
          );
        }
      }
    },
    [hasScanned, onScanSuccess, stopScannerInstance]
  );

  // Switch camera handler (toggle between available cameras)
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIndex = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIndex);
    initAndStartCamera(nextIndex);
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      initAndStartCamera(0);
    }, 200);

    return () => {
      clearTimeout(timer);
      stopScannerInstance();
    };
  }, [isOpen, initAndStartCamera, stopScannerInstance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-hidden select-none">
      {/* 
        Custom CSS injection to suppress HTML5-QRCode internal default white borders
        and ensure the custom scanner reticle is the only laser frame shown.
      */}
      <style>{`
        #${containerId} {
          border: none !important;
          background: #020617 !important;
        }
        #${containerId}__scan_region {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        #${containerId}__scan_region svg,
        #${containerId}__scan_region > div:empty {
          display: none !important;
        }
        #${containerId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0.75rem;
        }
        @keyframes laserSweep {
          0% { top: 6%; opacity: 0.4; }
          50% { opacity: 1; }
          100% { top: 92%; opacity: 0.4; }
        }
        .animate-laser {
          animation: laserSweep 2s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Main Modal Container — Fullscreen on mobile, sleek floating card on desktop */}
      <div className="bg-slate-950 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2">
                Medicine Barcode Scanner
              </h3>
              <p className="text-[11px] text-slate-400">
                Back Camera Active • Point at any medicine barcode
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Flip / Switch Camera Button (if multiple cameras available) */}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                title="Switch Camera"
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close Scanner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Camera Viewport Body */}
        <div className="relative flex-1 flex flex-col items-center justify-center bg-black overflow-hidden min-h-[320px] sm:min-h-[380px]">
          
          {/* HTML5 QR Code Mount Element */}
          <div
            id={containerId}
            className="w-full h-full flex items-center justify-center overflow-hidden"
          />

          {/* Loading Camera State */}
          {isInitializing && !cameraError && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-white z-20">
              <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">Opening Rear Camera...</p>
                <p className="text-xs text-slate-400 mt-1">Focusing optics for medicine scanning</p>
              </div>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white z-20 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <p className="text-sm font-bold text-rose-300">Camera Unavailable</p>
                <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                {cameras.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <SwitchCamera className="h-4 w-4" /> Try Alternate Camera
                  </button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    if (onManualEntryClick) onManualEntryClick();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Keyboard className="h-4 w-4" /> Enter Manually
                </Button>
              </div>
            </div>
          )}

          {/* Unified Scanner Overlay Frame */}
          {!isInitializing && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
              {/* Medicine Barcode Viewfinder Box */}
              <div className="w-[84%] max-w-[320px] h-[160px] sm:h-[180px] rounded-2xl border border-emerald-400/40 relative flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                
                {/* 4 Heavy Corner Brackets */}
                <span className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-xl" />
                <span className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-xl" />
                <span className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-xl" />
                <span className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-xl" />

                {/* Animated Horizontal Laser Beam */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-laser" />

                {/* Scanned Success Badge */}
                {hasScanned && (
                  <div className="absolute inset-0 bg-emerald-600/60 backdrop-blur-xs flex items-center justify-center rounded-2xl animate-in zoom-in-90 duration-150">
                    <div className="flex items-center gap-2 bg-emerald-950/90 text-white px-3.5 py-2 rounded-xl border border-emerald-400 shadow-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-bounce" />
                      <span className="text-xs font-bold uppercase tracking-wider">Barcode Detected!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guidance Prompt */}
              <div className="mt-5 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium flex items-center gap-1.5 shadow-lg">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Place medicine barcode inside the frame</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onManualEntryClick) onManualEntryClick();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700/80 transition cursor-pointer"
          >
            <Keyboard className="h-4 w-4 text-emerald-400" />
            Enter Barcode Manually
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 py-2.5 px-5 rounded-xl transition cursor-pointer"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
};

export default BarcodeScannerModal;
