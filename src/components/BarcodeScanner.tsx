import React, { useRef, useState } from 'react';
import { Camera, Loader2, AlertCircle, Hash, ArrowRight } from 'lucide-react';
import { scanBarcode, extractBarcodeDigits } from '../lib/vision/scanner-logic';
import { ImageCropperModal } from './ImageCropperModal';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  label?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScanSuccess, 
  onScanError,
  label = "Scan Barcode"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'ai-reading' | 'failed' | 'cropping'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
      setStatus('cropping');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processImage = async (imageBlob: Blob) => {
    setStatus('scanning');
    setError(null);
    setPendingImage(null);

    try {
      // PHASE 1: Standard Barcode Line Scan
      console.log("Stage 1: Attempting to read barcode lines from cropped image...");
      const scanResult = await scanBarcode(imageBlob);
      
      if (scanResult.success && scanResult.text) {
        onScanSuccess(scanResult.text);
        setStatus('idle');
        return;
      }

      // PHASE 2: AI Second Chance (Look at the numbers)
      console.log("Stage 1 failed. Stage 2: Asking AI to read numbers from cropped image...");
      setStatus('ai-reading');
      const aiResult = await extractBarcodeDigits(imageBlob);

      if (aiResult.success && aiResult.text) {
        onScanSuccess(aiResult.text);
        setStatus('idle');
      } else {
        throw new Error(aiResult.error || "Could not read barcode or numbers.");
      }
      
    } catch (err: any) {
      console.error("Scanning pipeline failed:", err);
      const errorMessage = typeof err === 'string' ? err : (err.message || "Failed to read barcode. Please enter it manually.");
      setError(errorMessage);
      setStatus('failed');
      if (onScanError) onScanError(errorMessage);
    }
  };

  const triggerCamera = () => {
    setError(null);
    setStatus('idle');
    fileInputRef.current?.click();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.length >= 5) {
      onScanSuccess(manualCode);
      setManualCode('');
      setStatus('idle');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
      <input 
        type="file" accept="image/*" capture="environment" 
        ref={fileInputRef} onChange={handleFileSelect} 
        style={{ display: 'none' }} 
      />

      {/* Main Trigger */}
      <button 
        onClick={triggerCamera}
        disabled={status === 'scanning' || status === 'ai-reading' || status === 'cropping'}
        className="action-bubble"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-xs)', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', width: '100%', aspectRatio: '1',
          cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
          opacity: (status === 'scanning' || status === 'ai-reading' || status === 'cropping') ? 0.7 : 1,
        }}
      >
        {(status === 'scanning' || status === 'ai-reading') ? (
          <Loader2 className="spin" size={28} color="var(--theme-accent)" />
        ) : (
          <Camera size={28} color="var(--theme-accent)" />
        )}
        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--theme-text)', textAlign: 'center', textTransform: 'uppercase' }}>
          {status === 'scanning' ? 'Scanning Lines...' : (status === 'ai-reading' ? 'AI Reading Numbers...' : label)}
        </span>
        
        {(status === 'scanning' || status === 'ai-reading') && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, height: '4px', background: 'var(--theme-accent)',
            animation: 'scan-progress 1.5s linear infinite', width: '100%'
          }} />
        )}
      </button>

      {/* Manual Fallback UI */}
      {(status === 'failed' || error) && (
        <div style={{ width: '100%', animation: 'slideDown 0.3s ease-out' }}>
          <div style={{ 
            fontSize: '11px', color: 'var(--theme-text-dim)', background: 'rgba(255,255,255,0.02)', 
            padding: '16px', borderRadius: '16px', border: '1px solid var(--theme-border)',
            display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-error)' }}>
              <AlertCircle size={14} />
              <span style={{ fontWeight: '700' }}>Could not read automatically</span>
            </div>
            
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Hash size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input 
                  type="text" pattern="[0-9]*" inputMode="numeric"
                  placeholder="Enter barcode numbers..."
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.replace(/\D/g, ''))}
                  style={{ 
                    width: '100%', padding: '10px 10px 10px 32px', background: 'var(--theme-input-bg)',
                    border: '1px solid var(--theme-border)', borderRadius: '12px', color: '#fff',
                    fontSize: '13px', outline: 'none'
                  }}
                />
              </div>
              <button 
                type="submit" disabled={manualCode.length < 5}
                style={{ 
                  padding: '10px 16px', background: manualCode.length >= 5 ? 'var(--theme-accent)' : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: '12px', color: '#000', cursor: 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                }}
              >
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {status === 'cropping' && pendingImage && (
        <ImageCropperModal 
          image={pendingImage}
          onCropComplete={processImage}
          onCancel={() => {
            setStatus('idle');
            setPendingImage(null);
          }}
        />
      )}

      <style>{`
        .action-bubble:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--theme-accent); }
        @keyframes scan-progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
