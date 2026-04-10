import React, { useRef, useState } from 'react';
import { Camera, Loader2, AlertCircle, Hash, ArrowRight, Plus, FileText, Barcode, QrCode, Sparkles } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { scanBarcode, extractBarcodeDigits, scanQRCode } from '../lib/vision/scanner-logic';
import { ImageCropperModal } from './ImageCropperModal';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScanSuccess, 
  onScanError
}) => {
  const { setIsScannerActive } = useDiary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'ai-reading' | 'failed' | 'cropping' | 'selecting-source'>('idle');
  const [scanType, setScanType] = useState<'nutrition' | 'barcode' | 'qr' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  
  React.useEffect(() => {
    setIsScannerActive(true);
    return () => setIsScannerActive(false);
  }, [setIsScannerActive]);

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
      if (scanType === 'qr') {
        const qrResult = await scanQRCode(imageBlob);
        if (qrResult.success && qrResult.text) {
          onScanSuccess(qrResult.text);
          setStatus('idle');
          setScanType(null);
          return;
        }
      }

      const scanResult = await scanBarcode(imageBlob);
      if (scanResult.success && scanResult.text) {
        onScanSuccess(scanResult.text);
        setStatus('idle');
        setScanType(null);
        return;
      }

      setStatus('ai-reading');
      const aiResult = await extractBarcodeDigits(imageBlob);
      if (aiResult.success && aiResult.text) {
        onScanSuccess(aiResult.text);
        setStatus('idle');
        setScanType(null);
      } else {
        throw new Error(aiResult.error || "Could not read code. Ensure it is clear.");
      }
      
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : (err.message || "Failed to read. Please enter manually.");
      setError(errorMessage);
      setStatus('failed');
      if (onScanError) onScanError(errorMessage);
    }
  };

  const triggerCamera = () => {
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const triggerUpload = () => {
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', minHeight: '260px' }}>
      <input 
        type="file" accept="image/*" 
        ref={fileInputRef} onChange={handleFileSelect} 
        style={{ display: 'none' }} 
      />

      {/* Step 1: Selection Phase */}
      {!scanType && status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', animation: 'slideDown 0.3s ease-out' }}>
          <ScanCategoryBtn 
            icon={<FileText size={20} />} 
            label="Nutrition Label" 
            sub="Scan facts for AI analysis"
            onClick={() => { setScanType('nutrition'); setStatus('selecting-source'); }} 
          />
          <ScanCategoryBtn 
            icon={<Barcode size={20} />} 
            label="Barcode" 
            sub="Scan product code for lookup"
            onClick={() => { setScanType('barcode'); setStatus('selecting-source'); }} 
          />
          <ScanCategoryBtn 
            icon={<QrCode size={20} />} 
            label="QR Code" 
            sub="Scan digital information"
            onClick={() => { setScanType('qr'); setStatus('selecting-source'); }} 
          />
        </div>
      )}

      {/* Step 2: Source Selection Phase */}
      {scanType && status === 'selecting-source' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
               <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--theme-accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>SOURCE FOR {scanType}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
              <button 
                onClick={triggerCamera}
                className="action-bubble"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', background: 'var(--theme-panel)', border: '1px solid var(--theme-border)',
                  borderRadius: '16px', padding: '32px 16px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Camera size={26} color="var(--theme-accent)" />
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>Take Photo</span>
              </button>

              <button 
                onClick={triggerUpload}
                className="action-bubble"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)',
                  borderRadius: '16px', padding: '32px 16px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Plus size={26} color="var(--theme-accent)" />
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>Upload Image</span>
              </button>
            </div>
            
            <button 
              onClick={() => { setScanType(null); setStatus('idle'); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase', marginTop: '10px' }}
            >
              Back to types
            </button>
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
             <div style={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}>{status === 'scanning' ? 'DECODING...' : 'AI ANALYSIS...'}</div>
           </div>
        </div>
      )}

      {/* Error Phase */}
      {(status === 'failed' || error) && (
        <div style={{ width: '100%' }}>
          <div style={{ 
            padding: '20px', borderRadius: '24px', border: '1px solid var(--theme-border)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF6B6B' }}>
              <AlertCircle size={16} />
              <span style={{ fontWeight: '800' }}>READ ERROR</span>
            </div>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" placeholder="Enter barcode..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff' }}
              />
              <button type="submit" style={{ padding: '12px', background: 'var(--theme-accent)', borderRadius: '14px', border: 'none' }}><ArrowRight size={20} /></button>
            </form>
            <button onClick={() => { setScanType(null); setStatus('idle'); setError(null); }} style={{ color: 'var(--theme-accent)', background: 'none', border: 'none', fontWeight: '800' }}>TRY AGAIN</button>
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
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const ScanCategoryBtn = ({ icon, label, sub, onClick }: any) => (
  <button 
    onClick={onClick}
    className="action-bubble"
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
      padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)',
      borderRadius: '24px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
    }}
  >
    <div style={{ background: 'rgba(0, 201, 255, 0.1)', padding: '12px', borderRadius: '16px', color: 'var(--theme-accent)' }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{sub}</div>
    </div>
    <ArrowRight size={18} color="rgba(255,255,255,0.2)" />
  </button>
);
