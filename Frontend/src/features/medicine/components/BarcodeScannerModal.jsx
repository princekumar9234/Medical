import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Keyboard, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
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
  const scannerRef = useRef(null);
  const containerId = 'barcode-scanner-viewport';

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    let isMounted = true;
    setCameraError(null);
    setIsInitializing(true);
    setHasScanned(false);

    const startScanner = async () => {
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

        html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxWidth = Math.floor(minEdge * 0.75);
            const boxHeight = Math.floor(boxWidth * 0.6); // Aspect ratio suitable for barcodes
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: 1.333333,
        };

        // Prefer rear camera on mobile devices
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!isMounted || hasScanned) return;
            setHasScanned(true);

            // Play audio feedback if supported
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.value = 880; // High tone beep
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.12);
            } catch {
              // Ignore audio errors
            }

            // Stop scanner immediately
            html5QrCode
              .stop()
              .then(() => {
                onScanSuccess(decodedText.trim());
              })
              .catch(() => {
                onScanSuccess(decodedText.trim());
              });
          },
          () => {
            // Frame scanned but no barcode detected in this frame (silent pass)
          }
        );

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err) {
        if (!isMounted) return;
        setIsInitializing(false);

        const errMsg = String(err?.message || err).toLowerCase();
        if (errMsg.includes('permission') || errMsg.includes('notallowed')) {
          setCameraError('Camera access was denied. Please allow camera permission in your browser or enter the barcode manually.');
        } else if (errMsg.includes('notfound') || errMsg.includes('device') || errMsg.includes('no camera')) {
          setCameraError('No camera found on this device. Please connect a webcam or use manual barcode entry.');
        } else if (errMsg.includes('secure') || errMsg.includes('https')) {
          setCameraError('Camera access requires a secure connection (HTTPS or localhost). Please enter the barcode manually.');
        } else {
          setCameraError('Camera unavailable or in use by another application. Please enter the barcode manually.');
        }
      }
    };

    // Small delay to ensure DOM container is mounted
    const timer = setTimeout(() => {
      startScanner();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        try {
          scannerRef.current.clear();
        } catch {
          // ignore clear error
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Live Barcode Scanner
              </h3>
              <p className="text-[11px] text-slate-500">
                Point your camera at any medicine or pharma product barcode
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scanner Viewport Container */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center bg-slate-950 relative min-h-[300px] sm:min-h-[360px]">
          
          {/* HTML5 QR Code Mount Element */}
          <div
            id={containerId}
            className="w-full h-full max-h-[380px] overflow-hidden rounded-2xl flex items-center justify-center [&_video]:rounded-2xl [&_video]:object-cover"
          />

          {/* Loading Indicator */}
          {isInitializing && !cameraError && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-white z-10">
              <RefreshCw className="h-7 w-7 text-emerald-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-300">
                Requesting camera access & initializing optics...
              </p>
            </div>
          )}

          {/* Error Message View */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-10 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm font-bold text-rose-300">Camera Access Error</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cameraError}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  if (onManualEntryClick) onManualEntryClick();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-xl text-xs flex items-center gap-2"
              >
                <Keyboard className="h-4 w-4" />
                Enter Barcode Manually
              </Button>
            </div>
          )}

          {/* Custom Overlay Scanning Reticle */}
          {!isInitializing && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10">
              {/* Target Scan Frame */}
              <div className="w-[74%] max-w-[280px] h-[140px] rounded-xl border-2 border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.35)] relative overflow-hidden flex items-center justify-center">
                {/* Corner accents */}
                <span className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-400"></span>
                <span className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-400"></span>
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-400"></span>
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-400"></span>

                {/* Sweeping Laser Line Animation */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse"></div>
              </div>

              {/* Instructions Prompt */}
              <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Place the medicine barcode inside the frame</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onManualEntryClick) onManualEntryClick();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-colors"
          >
            <Keyboard className="h-4 w-4 text-emerald-600" />
            Enter Barcode Manually
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100 font-medium py-2 px-5 rounded-xl text-xs"
          >
            Close Scanner
          </Button>
        </div>

      </div>
    </div>
  );
};

export default BarcodeScannerModal;
