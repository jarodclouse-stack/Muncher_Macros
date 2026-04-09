import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Scan, Keyboard, AlertCircle, Loader2, Camera } from 'lucide-react';
import { lookupBarcode, scanBarcode, scanNutritionLabel, type ScanResult } from '../lib/vision/scanner-logic';

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

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsProcessing(true);
    setError(null);

    try {
      // Process image based on type
      let scanRes: ScanResult;
      
      if (type === 'label') {
        scanRes = await scanNutritionLabel(file);
      } else {
        // Try barcode/QR
        scanRes = await scanBarcode(file);
        if (!scanRes.success && type === 'barcode') {
           // Fallback to label if barcode fails in mixed mode, but here we just try barcode
        }
      }

      if (scanRes.success) {
        if (type === 'label') {
          onResult(scanRes.data);
          onClose();
        } else if (scanRes.text) {
          const lookup = await lookupBarcode(scanRes.text);
          if (lookup.success) {
            onResult(lookup.data);
            onClose();
          } else {
            setError(lookup.error || 'Barcode recognized but not found in database.');
          }
        }
      } else {
        setError(scanRes.error || "No data detected in photo. Try another angle or manual entry.");
      }
    } catch (err) {
      setError("Processing error. Try manual entry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    // Auto-trigger camera on mount if not manual
    if (!showManual && type !== 'label') {
      triggerCamera();
    }
  }, [showManual, type]);

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
      
      {/* Hidden File Input for Native Camera */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageChange} 
        accept="image/*" 
        capture="environment" 
        style={{ display: 'none' }} 
      />

      {/* Header */}
      <div style={{ width: '100%', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scan size={20} color="var(--theme-accent, #00C9FF)" />
            NATIVE {type.toUpperCase()} SCAN
          </h2>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '1px', marginTop: '4px' }}>
            {showManual ? 'MANUAL INPUT' : 'SYSTEM CAMERA READY'}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Preview / Instructions */}
        {!showManual && (
          <div 
            onClick={triggerCamera}
            style={{ 
              width: '85%', 
              maxWidth: '350px', 
              aspectRatio: '3/4', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '32px', 
              border: '2px dashed var(--theme-border)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}>
            {previewUrl ? (
              <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isProcessing ? 0.3 : 1 }} alt="Captured" />
            ) : (
              <>
                <div style={{ padding: '20px', borderRadius: '50%', background: 'var(--theme-accent-dim)', marginBottom: '16px' }}>
                  <Scan size={40} color="var(--theme-accent)" />
                </div>
                <div style={{ fontWeight: '800', color: 'white', fontSize: '16px' }}>TAP TO TAKE PHOTO</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '8px', textAlign: 'center', padding: '0 20px' }}>
                   Use the phone's native camera for the best focus and results.
                </div>
              </>
            )}

            {isProcessing && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                <Loader2 className="spin" size={48} color="var(--theme-accent)" />
                <div style={{ marginTop: '16px', color: 'white', fontWeight: '900', letterSpacing: '2px', fontSize: '12px' }}>PROCESSING MATRIX...</div>
              </div>
            )}
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

        {/* Error Feedback */}
        {error && (
          <div style={{ position: 'absolute', bottom: '20px', left: '24px', right: '24px', background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: '20px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', zIndex: 150, backdropFilter: 'blur(10px)' }}>
             <AlertCircle size={22} color="#FF6B6B" />
             <div style={{ flex: 1, color: 'white', fontSize: '13px', fontWeight: '600' }}>{error}</div>
             <X size={18} onClick={() => setError(null)} style={{ cursor: 'pointer', opacity: 0.5 }} />
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
          {showManual ? 'Back to Camera' : 'Manual Entry'}
        </button>
        
        {!showManual && (
          <button 
            onClick={triggerCamera}
            style={{ flex: 1, padding: '16px', borderRadius: '18px', background: 'var(--theme-accent)', color: '#000', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
            <Camera size={20} /> Open Camera
          </button>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
};
