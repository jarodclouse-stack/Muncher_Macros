import React, { useRef, useState } from 'react';
import { Loader2, AlertCircle, ArrowRight, FileText, Barcode, Search, Clipboard, Crown } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { scanBarcode, extractBarcodeDigits, scanNutritionLabel } from '../lib/vision/scanner-logic';
import { ImageCropperModal } from './ImageCropperModal';

interface BarcodeScannerProps {
  onScanSuccess: (result: string | any) => void;
  onScanError?: (error: string) => void;
  /** When set, skips the mode-picker UI and goes straight to camera for this type. */
  initialScanType?: 'nutrition' | 'barcode';
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  initialScanType
}) => {
  const { setIsScannerActive } = useDiary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'ai-reading' | 'failed' | 'cropping' | 'selecting-source'>('idle');
  const [scanType, setScanType] = useState<'nutrition' | 'barcode' | null>(initialScanType ?? null);
  const [error, setError] = useState<string | null>(null);
  const [scanDetail, setScanDetail] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [detectedText, setDetectedText] = useState<string | null>(null);
  
  React.useEffect(() => {
    setIsScannerActive(true);
    return () => setIsScannerActive(false);
  }, [setIsScannerActive]);

  // Auto-open camera when a scan type is pre-selected
  React.useEffect(() => {
    if (initialScanType) {
      // Small delay so the file input is mounted
      const t = setTimeout(() => triggerNativePicker(), 120);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setScanDetail(null);
    setDetectedText(null);
    const objectUrl = URL.createObjectURL(file);
    setPendingImage(objectUrl);
    setStatus('cropping');
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processImage = async (imageBlob: Blob) => {
    try {
      if (scanType === 'barcode') {
        setStatus('scanning');
        const scanResult = await scanBarcode(imageBlob);
        if (scanResult.success && scanResult.text) {
          onScanSuccess(scanResult.text);
          setStatus('idle');
          setScanType(null);
        } else {
          // Try AI fallback for barcodes specifically
          setStatus('ai-reading');
          const aiResult = await extractBarcodeDigits(imageBlob);
          if (aiResult.success && aiResult.text) {
            onScanSuccess(aiResult.text);
            setStatus('idle');
            setScanType(null);
          } else {
            setScanDetail(aiResult.detail || null);
            throw new Error(aiResult.error || "Could not read code. Ensure it is clear.");
          }
        }
      } 
      else if (scanType === 'nutrition') {
        setStatus('ai-reading');
        const labelResult = await scanNutritionLabel(imageBlob);
        if (labelResult.success && labelResult.data) {
          onScanSuccess(labelResult.data);
          setStatus('idle');
          setScanType(null);
        } else {
          setScanDetail(labelResult.detail || null);
          throw new Error(labelResult.error || "Could not extract nutrition. Try a clearer photo.");
        }
      }
      
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : (err.message || "Failed to read. Please enter manually.");
      setError(errorMessage);
      setStatus('failed');
      if (onScanError) onScanError(errorMessage);
    }
  };

  const triggerNativePicker = () => {
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      // Adding accept="image/*" naturally prompts iOS/Android to show the native 3 options
      fileInputRef.current.setAttribute('accept', 'image/*');
      fileInputRef.current.click();
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanDigits = text.replace(/[^\d]/g, '');
      if (cleanDigits.length >= 5) {
        setManualCode(cleanDigits);
        setError(null);
      } else {
        setError("Clipboard did not contain a valid barcode (must be at least 5 digits).");
      }
    } catch (err) {
      setError("Unable to read clipboard automatically. Please long-press and paste into the input box instead!");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.length >= 5) {
      onScanSuccess(manualCode);
      setManualCode('');
      setStatus('idle');
      setScanType(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', width: '100%', minHeight: '260px' }}>
      <input 
        type="file" accept="image/*" 
        ref={fileInputRef} onChange={handleFileSelect} 
        style={{ display: 'none' }} 
      />

      {/* Step 1: Selection Phase */}
      {status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%', animation: 'slideDown 0.3s ease-out' }}>
          {initialScanType ? (
            /* Compact re-scan button when type is pre-selected */
            <button
              onClick={() => { setScanType(initialScanType); triggerNativePicker(); }}
              style={{ width: '100%', padding: '20px', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)', borderRadius: '20px', color: 'var(--theme-accent)', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              {initialScanType === 'nutrition' ? <FileText size={20} /> : <Barcode size={20} />}
              Tap to {initialScanType === 'nutrition' ? 'scan nutrition label' : 'scan barcode'}
            </button>
          ) : (
            <>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-xs)' }}>
            <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>Select Scan Mode</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', width: '100%' }}>
            <ScanCategoryBtn
              icon={<FileText size={24} />}
              label="Nutrition Label"
              onClick={() => { setScanType('nutrition'); triggerNativePicker(); }}
            />
            <ScanCategoryBtn
              icon={<Barcode size={24} />}
              label="Barcode"
              onClick={() => { setScanType('barcode'); triggerNativePicker(); }}
            />
          </div>
            </>
          )}

          {initialScanType !== 'nutrition' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 8px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--theme-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Or Enter Barcode Manually</div>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: '#FF6B6B', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {initialScanType !== 'nutrition' && <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" placeholder="Enter barcode number..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', padding: '14px 75px 14px 14px', background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)', borderRadius: '16px', color: 'var(--theme-text)', fontSize: '13px', fontWeight: '600', outline: 'none' }}
              />
              <button 
                type="button"
                onClick={handlePasteClipboard}
                style={{ position: 'absolute', right: '12px', padding: '6px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--theme-accent)', fontSize: '9px', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}
              >
                <Clipboard size={10} /> Paste
              </button>
            </div>
            <button 
              type="submit" 
              disabled={manualCode.length < 5}
              style={{ 
                padding: '12px 20px', background: manualCode.length >= 5 ? 'var(--theme-accent)' : 'var(--theme-panel-dim)', 
                borderRadius: '16px', border: 'none', color: '#000',
                transition: 'all 0.2s', cursor: manualCode.length >= 5 ? 'pointer' : 'not-allowed',
                opacity: manualCode.length >= 5 ? 1 : 0.5
              }}
            >
              <ArrowRight size={22} strokeWidth={3} />
            </button>
          </form>}
        </div>
      )}

      {/* Processing Phase */}
      {(status === 'scanning' || status === 'ai-reading') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '40px 0', width: '100%' }}>
           <div style={{ position: 'relative' }}>
              <div style={{ background: 'rgba(0, 201, 255, 0.1)', padding: '20px', borderRadius: '50%' }}>
                <Loader2 size={32} className="spin" color="var(--theme-accent)" />
              </div>
           </div>
           <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--theme-accent)', letterSpacing: '2px' }}>{status === 'scanning' ? 'DECODING...' : 'AI ANALYSIS...'}</div>
           </div>
        </div>
      )}

      {/* Error Phase */}
      {(status === 'failed' || error) && (
        <div style={{ width: '100%', animation: 'slideDown 0.3s ease-out' }}>
          {scanDetail === 'QUOTA_EXCEEDED' ? (
            /* Quota upgrade card */
            <div style={{
              padding: '24px', borderRadius: '24px', border: '1px solid rgba(212,175,55,0.35)',
              background: 'rgba(212,175,55,0.07)', display: 'flex', flexDirection: 'column', gap: '16px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37' }}>
                <Crown size={20} />
                <span style={{ fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Limit Reached</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--theme-text-dim)', margin: 0, lineHeight: '1.5', fontWeight: '600' }}>
                {error}
              </p>
              <button
                onClick={() => {
                  // Navigate to Settings tab — dispatch a custom event the shell can listen to
                  window.dispatchEvent(new CustomEvent('navigate-to-settings'));
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px 20px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5D76E 50%, #D4AF37 100%)',
                  color: '#000', fontWeight: '900', fontSize: '13px', letterSpacing: '0.5px',
                  boxShadow: '0 4px 20px rgba(212,175,55,0.4)', transition: 'all 0.2s'
                }}
              >
                <Crown size={15} />
                Upgrade to Pro — $9.99/mo
              </button>
            </div>
          ) : (
          <div style={{
            padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,107,107,0.2)',
            background: 'rgba(255,107,107,0.05)', display: 'flex', flexDirection: 'column', gap: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF6B6B' }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Scanning Interrupted</span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--theme-text-dim)', margin: 0, lineHeight: '1.4', fontWeight: '600' }}>
              {scanType === 'nutrition'
                ? (error?.includes('404') || error?.includes('Network')
                   ? "The AI Scan Service is currently unreachable. Please try a different scan type or check back later."
                   : "AI analysis failed. Please ensure the label is well-lit and occupies the whole frame.")
                : (error?.includes('404') || error?.includes('Network')
                   ? "The database service is currently offline. You can still try a manual search below."
                   : error || "We couldn't read the code. Please ensure it's well-lit and not blurry.")}
            </p>

            {scanType !== 'nutrition' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="text" placeholder="Enter barcode manually..."
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value.replace(/\D/g, ''))}
                      style={{ width: '100%', padding: '14px 75px 14px 14px', background: 'var(--theme-input-bg)', border: '1px solid var(--theme-border)', borderRadius: '16px', color: 'var(--theme-text)', fontSize: '13px', fontWeight: '600', outline: 'none' }}
                    />
                    <button 
                      type="button"
                      onClick={handlePasteClipboard}
                      style={{ position: 'absolute', right: '12px', padding: '6px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--theme-accent)', fontSize: '9px', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}
                    >
                      <Clipboard size={10} /> Paste
                    </button>
                  </div>
                  <button 
                    type="submit" 
                    disabled={manualCode.length < 5}
                    style={{ 
                      padding: '12px 20px', background: manualCode.length >= 5 ? 'var(--theme-accent)' : 'var(--theme-panel-dim)', 
                      borderRadius: '16px', border: 'none', color: '#000',
                      transition: 'all 0.2s', cursor: manualCode.length >= 5 ? 'pointer' : 'not-allowed',
                      opacity: manualCode.length >= 5 ? 1 : 0.5
                    }}
                  >
                    <ArrowRight size={22} strokeWidth={3} />
                  </button>
                </form>

                {detectedText && (
                  <button 
                    onClick={() => { onScanSuccess(detectedText); setStatus('idle'); setScanType(null); }}
                    style={{ 
                      width: '100%', padding: '14px', background: 'var(--theme-accent)', border: 'none', 
                      borderRadius: '16px', color: '#000', fontWeight: '900', fontSize: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: '0 4px 15px rgba(0,201,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px'
                    }}
                  >
                    <Search size={18} /> SEARCH FOR {detectedText}
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => { setScanType(null); setStatus('idle'); setError(null); setScanDetail(null); }}
                style={{ flex: 1, padding: '12px', background: 'var(--theme-panel-dim)', border: '1px solid var(--theme-border)', borderRadius: '14px', color: 'var(--theme-text)', fontWeight: '800', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                {scanType === 'nutrition' ? 'TRY AGAIN' : 'PHOTO AGAIN'}
              </button>
              <button 
                onClick={() => { setScanType(null); setStatus('idle'); setError(null); setScanDetail(null); setIsScannerActive(false); }} 
                style={{ flex: 1, padding: '12px', background: 'none', border: '1px solid transparent', borderRadius: '14px', color: 'var(--theme-accent)', fontWeight: '800', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                EXIT SCANNER
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Cropper Modal */}
      {status === 'cropping' && pendingImage && (
        <ImageCropperModal 
          image={pendingImage}
          scanType={scanType}
          onCropComplete={processImage}
          onCancel={() => {
            setStatus('idle');
            setPendingImage(null);
          }}
        />
      )}
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const ScanCategoryBtn = ({ icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    style={{
      flex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '12px', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)',
      borderRadius: '24px', padding: '32px 16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      color: '#fff'
    }}
  >
    <div style={{ background: 'rgba(0, 201, 255, 0.1)', padding: '16px', borderRadius: '50%', color: 'var(--theme-accent)' }}>
      {icon}
    </div>
    <div style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>{label}</div>
  </button>
);
