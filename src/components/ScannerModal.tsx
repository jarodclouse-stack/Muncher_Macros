import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Scan, Keyboard, AlertCircle, Loader2 } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { lookupBarcode } from '../lib/vision/scanner-logic';

interface ScannerModalProps {
  type: 'barcode' | 'qr' | 'label';
  onClose: () => void;
  onResult: (data: any) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ type, onClose, onResult }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'interactive-scanner-region';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // Silently fail on stop
      }
    }
  }, []);

  const handleScanSuccess = useCallback(async (text: string) => {
    await stopScanner();
    setIsProcessing(true);
    try {
      const res = await lookupBarcode(text);
      if (res.success) {
        onResult(res.data);
        onClose();
      } else {
        setError(res.error || "Product not found in database. Try another item.");
        setIsProcessing(false);
        // Let user decide to retry or go manual
      }
    } catch (e) {
      setError("Database connection error. Using manual entry instead.");
      setIsProcessing(false);
    }
  }, [onClose, onResult]);

  const startScanner = useCallback(async () => {
    setError(null);
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: type === 'barcode' ? 150 : 250 },
        aspectRatio: 1.0,
        formatsToSupport: type === 'qr' 
          ? [Html5QrcodeSupportedFormats.QR_CODE]
          : [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128
            ]
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Quietly ignore frame errors until multiple failures
          // This is a continuous loop
        }
      );
    } catch (err) {
      console.error("Scanner start error:", err);
      setError("Camera access required. Please check permissions and lighting.");
    }
  }, [type, handleScanSuccess]);

  // --- Initialize Live Scanner ---
  useEffect(() => {
    if (!showManual && type !== 'label') {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [showManual, type, startScanner, stopScanner]);

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    setIsProcessing(true);
    setError(null);
    const result = await lookupBarcode(manualCode.trim());
    if (result.success) {
      onResult(result.data);
      onClose();
    } else {
      setError(result.error || 'Product not found. Please verify the code.');
      setIsProcessing(false);
    }
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', zIndex: 6000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Header */}
      <div style={{ width: '100%', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scan size={20} color="var(--theme-accent, #00C9FF)" />
            {type.toUpperCase()} SCANNER
          </h2>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '1px', marginTop: '4px' }}>
            {showManual ? 'MANUAL INPUT MODE' : 'LIVE DETECTION ACTIVE'}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Scanner Region */}
        {!showManual && (
          <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
            <div id={containerId} style={{ width: '100%', height: '100%' }}></div>
            
            {/* Visual Guide Overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ 
                 width: '260px', 
                 height: type === 'barcode' ? '160px' : '260px', 
                 border: '2px solid var(--theme-accent, #00C9FF)', 
                 borderRadius: '24px',
                 boxShadow: '0 0 0 4000px rgba(0,0,0,0.6)',
                 position: 'relative'
               }}>
                 {/* Decorative Corners */}
                 <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', borderRadius: '4px 0 0 0' }} />
                 <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '4px solid #fff', borderRight: '4px solid #fff', borderRadius: '0 4px 0 0' }} />
                 <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '4px solid #fff', borderLeft: '4px solid #fff', borderRadius: '0 0 0 4px' }} />
                 <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '4px solid #fff', borderRight: '4px solid #fff', borderRadius: '0 0 4px 0' }} />
                 
                 {/* Scanning Laser Animation */}
                 <div className="laser-line" style={{ 
                   position: 'absolute', 
                   top: 0, 
                   left: '10%', 
                   right: '10%', 
                   height: '2px', 
                   background: 'var(--theme-accent, #00C9FF)',
                   boxShadow: '0 0 15px var(--theme-accent, #00C9FF)',
                   animation: 'scan-anim 2s linear infinite'
                 }} />
               </div>
               <div style={{ marginTop: '24px', color: 'white', fontWeight: '700', fontSize: '13px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                 Center the {type} within the box
               </div>
            </div>
          </div>
        )}

        {/* Manual Input Container */}
        {showManual && (
          <div style={{ width: '85%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', letterSpacing: '1px' }}>ENTER BARCODE MANUALLY</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="Code under the bars..." 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--theme-border)', borderRadius: '14px', padding: '16px', color: 'white', fontSize: '16px', outline: 'none' }}
                />
                <button 
                  onClick={handleManualSubmit}
                  disabled={!manualCode.trim() || isProcessing}
                  style={{ background: 'var(--theme-accent, #00C9FF)', color: '#000', border: 'none', borderRadius: '14px', padding: '0 20px', fontWeight: '900', cursor: 'pointer' }}
                >
                  {isProcessing ? <Loader2 size={20} className="spin" /> : 'GO'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
             <Loader2 className="spin" size={64} color="var(--theme-accent, #00C9FF)" />
             <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>FETCHING DATA</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Scaling nutrient intelligence matrix...</div>
             </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div style={{ position: 'absolute', bottom: '100px', left: '24px', right: '24px', background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: '20px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', zIndex: 150, backdropFilter: 'blur(10px)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,107,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B6B', flexShrink: 0 }}>
              <AlertCircle size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#FF6B6B', fontWeight: '800', fontSize: '14px' }}>Scan Issues Detected</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: '1.4' }}>{error}</div>
            </div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
               <X size={18} />
            </button>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div style={{ width: '100%', padding: '24px 24px 48px 24px', display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => {
            setShowManual(!showManual);
            setError(null);
          }}
          style={{ flex: 1, padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
          {showManual ? <Scan size={20} /> : <Keyboard size={20} />}
          {showManual ? 'Back to Scanner' : 'Enter Manually'}
        </button>
        
        {!showManual && (
          <button 
            onClick={() => {
               stopScanner();
               onClose();
               // Here we could trigger a specific tab change or search trigger
            }}
            style={{ flex: 1, padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
            <Search size={20} /> Use Search
          </button>
        )}
      </div>

      <style>{`
        @keyframes scan-anim {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .laser-line {
          left: 5%;
          right: 5%;
          transition: all 0.3s;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
};
