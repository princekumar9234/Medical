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
  Zap,
  ZapOff,
  Image as ImageIcon,
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
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [fileScanError, setFileScanError] = useState(null);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerId = 'barcode-scanner-viewport';

  // Audio beep feedback
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio autoplay restrictions
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
    setIsTorchOn(false);
    setTorchSupported(false);
  }, []);

  const handleScanDecoded = useCallback(
    async (decodedText) => {
      if (hasScanned) return;
      setHasScanned(true);
      playBeep();

      setTimeout(async () => {
        await stopScannerInstance();
        onScanSuccess(decodedText.trim());
      }, 350);
    },
    [hasScanned, onScanSuccess, stopScannerInstance]
  );

  const initAndStartCamera = useCallback(
    async (cameraIndex = 0) => {
      setIsInitializing(true);
      setCameraError(null);
      setHasScanned(false);
      setFileScanError(null);

      await stopScannerInstance();

      try {
        // Support ALL formats including 2D DATA_MATRIX (standard on medicine strips)
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.DATA_MATRIX, // CRITICAL FOR MEDICINES
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.PDF_417,
          Html5QrcodeSupportedFormats.AZTEC,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ];

        // Enable browser native BarcodeDetector API for hardware-accelerated detection
        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = html5QrCode;

        // Discover video cameras
        let cameraList = [];
        try {
          cameraList = await Html5Qrcode.getCameras();
          if (cameraList && cameraList.length > 0) {
            setCameras(cameraList);
          }
        } catch (camErr) {
          console.warn('Could not list cameras:', camErr);
        }

        // Camera selection logic
        let selectedCameraConfig = null;

        if (cameraList.length > 0) {
          if (cameraIndex > 0 && cameraIndex < cameraList.length) {
            selectedCameraConfig = cameraList[cameraIndex].id;
          } else {
            // Find back camera explicitly
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
              const fallbackIndex = cameraList.length - 1;
              selectedCameraConfig = cameraList[fallbackIndex].id;
              setActiveCameraIndex(fallbackIndex);
            }
          }
        } else {
          selectedCameraConfig = { facingMode: { ideal: 'environment' } };
        }

        // Square/Adaptive qrbox scanning zone to read 2D DataMatrix AND 1D Barcodes
        const config = {
          fps: 25,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            // Generous square area so both 2D Data Matrix and 1D barcodes scan instantly
            const size = Math.min(Math.floor(minEdge * 0.84), 360);
            return { width: size, height: size };
          },
          aspectRatio: window.innerWidth < 640 ? 1.0 : 1.333333,
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            focusMode: 'continuous',
          },
        };

        await html5QrCode.start(
          selectedCameraConfig,
          config,
          (decodedText) => {
            handleScanDecoded(decodedText);
          },
          () => {
            // Frame search pass
          }
        );

        // Check torch capability
        try {
          const track = html5QrCode.getRunningTrackCameraCapabilities?.();
          if (track && typeof track.torchFeature === 'function') {
            setTorchSupported(track.torchFeature().isSupported());
          }
        } catch (e) {
          // ignore
        }

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
    [handleScanDecoded, stopScannerInstance]
  );

  // Switch camera
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIndex = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIndex);
    initAndStartCamera(nextIndex);
  };

  // Toggle torch
  const handleToggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextTorch = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Scan from photo upload fallback
  const handleFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanError(null);
    setIsInitializing(true);

    try {
      await stopScannerInstance();

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanDecoded(decodedText);
    } catch (err) {
      setIsInitializing(false);
      setFileScanError('No barcode or 2D code found in the image. Please try another photo or enter manually.');
      // Restart live camera
      initAndStartCamera(activeCameraIndex);
    }
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
      {/* Scoped CSS overrides for HTML5-QRCode viewports */}
      <style>{`
        #${containerId} {
          border: none !important;
          background: #020617 !important;
        }
        #${containerId}__scan_region {
          border: 2px dashed rgba(52, 211, 153, 0.45) !important;
          border-radius: 1.25rem !important;
          outline: none !important;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.25) !important;
        }
        #${containerId}__scan_region svg {
          display: none !important;
        }
        #${containerId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        @keyframes laserSweepVertical {
          0% { top: 4%; opacity: 0.3; }
          50% { opacity: 1; }
          100% { top: 96%; opacity: 0.3; }
        }
        .animate-laser-sweep {
          animation: laserSweepVertical 1.8s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Main Modal — Fullscreen on mobile devices, rounded dialog on desktop */}
      <div className="bg-slate-950 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2">
                Medicine Barcode & QR Scanner
              </h3>
              <p className="text-[11px] text-slate-400">
                DataMatrix • Barcode • QR Code supported
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Torch Toggle (if supported) */}
            {torchSupported && (
              <button
                type="button"
                onClick={handleToggleTorch}
                title={isTorchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isTorchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              </button>
            )}

            {/* Switch Camera Button */}
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

        {/* Viewport Area */}
        <div className="relative flex-1 flex flex-col items-center justify-center bg-black overflow-hidden min-h-[340px] sm:min-h-[400px]">
          
          {/* HTML5 QR Code Mount Element */}
          <div
            id={containerId}
            className="w-full h-full flex items-center justify-center overflow-hidden"
          />

          {/* Loading Camera State */}
          {isInitializing && !cameraError && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-white z-20">
              <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-slate-200">Starting Scanner Optics...</p>
                <p className="text-xs text-slate-400 mt-1">Calibrating for 2D DataMatrix and Barcodes</p>
              </div>
            </div>
          )}

          {/* Camera Error View */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white z-20 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <p className="text-sm font-bold text-rose-300">Camera Notice</p>
                <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                {cameras.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <SwitchCamera className="h-4 w-4" /> Switch Lens
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
              
              {/* Central Viewfinder Frame (Generous square for 2D DataMatrix & 1D Barcodes) */}
              <div className="w-[80%] max-w-[290px] aspect-square rounded-2xl border-2 border-emerald-400/80 relative flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.3)]">
                
                {/* 4 Corner Markers */}
                <span className="absolute -top-1 -left-1 w-6 h-6 border-t-[4px] border-l-[4px] border-emerald-400 rounded-tl-xl" />
                <span className="absolute -top-1 -right-1 w-6 h-6 border-t-[4px] border-r-[4px] border-emerald-400 rounded-tr-xl" />
                <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-[4px] border-l-[4px] border-emerald-400 rounded-bl-xl" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-[4px] border-r-[4px] border-emerald-400 rounded-br-xl" />

                {/* Sweeping Laser Beam */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-laser-sweep" />

                {/* Scanned Success Feedback */}
                {hasScanned && (
                  <div className="absolute inset-0 bg-emerald-600/70 backdrop-blur-xs flex items-center justify-center rounded-2xl animate-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-2 bg-slate-950/90 text-white px-4 py-2.5 rounded-xl border border-emerald-400 shadow-2xl">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-bounce" />
                      <span className="text-xs font-bold uppercase tracking-wider">Code Scanned!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guidance Tips */}
              <div className="mt-4 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium flex items-center gap-1.5 shadow-lg text-center max-w-[90%]">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Hold phone 10-15 cm away to avoid reflection & focus clearly</span>
              </div>

              {/* Error Notice if Photo Scan Failed */}
              {fileScanError && (
                <div className="mt-2 px-3 py-1 bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[10px] rounded-lg">
                  {fileScanError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 shrink-0 z-20">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Hidden Photo Upload Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileScan}
            />

            {/* Upload Photo Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-700/80 transition cursor-pointer"
              title="Upload image containing medicine barcode"
            >
              <ImageIcon className="h-4 w-4 text-emerald-400" />
              Scan Photo
            </button>

            {/* Manual Entry Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onManualEntryClick) onManualEntryClick();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-700/80 transition cursor-pointer"
            >
              <Keyboard className="h-4 w-4 text-emerald-400" />
              Enter Manually
            </button>
          </div>

          {/* Close Scanner Button */}
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
