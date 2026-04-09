import React, { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Loader2, AlertCircle } from 'lucide-react';

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
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      // Initialize scanner
      // The element "reader" is required but we can use an invisible div or just instantiate it for file scanning
      const html5QrCode = new Html5Qrcode("barcode-scanner-engine");
      
      const decodedText = await html5QrCode.scanFile(file, true);
      onScanSuccess(decodedText);
      setIsScanning(false);
      
      // Cleanup
      html5QrCode.clear();
    } catch (err: any) {
      console.error("Scan Error:", err);
      const errorMessage = typeof err === 'string' ? err : "No barcode or QR code detected. Please try a clearer photo.";
      setError(errorMessage);
      if (onScanError) onScanError(errorMessage);
      setIsScanning(false);
    } finally {
      // Clear input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
      {/* Hidden inputs & engine anchor */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        style={{ display: 'none' }} 
      />
      <div id="barcode-scanner-engine" style={{ display: 'none' }}></div>

      {/* Trigger Button */}
      <button 
        onClick={triggerCamera}
        disabled={isScanning}
        className="action-bubble"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-xs)',
          background: 'var(--theme-panel)',
          border: '1px solid var(--theme-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
          width: '100%',
          aspectRatio: '1',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: isScanning ? 0.7 : 1,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {isScanning ? (
          <Loader2 className="spin" size={24} color="var(--theme-accent)" />
        ) : (
          <Camera size={24} color="var(--theme-accent)" />
        )}
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text)', textAlign: 'center' }}>
          {isScanning ? 'Processing...' : label}
        </span>
        
        {/* Progress pulse if scanning */}
        {isScanning && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: 'var(--theme-accent)',
            animation: 'scan-progress 2s linear infinite',
            width: '100%'
          }} />
        )}
      </button>

      {/* Feedback Messages */}
      {error && (
        <div style={{ 
          fontSize: '10px', 
          color: 'var(--theme-error)', 
          background: 'var(--theme-error-dim)', 
          padding: '6px 10px', 
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '4px'
        }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <style>{`
        .action-bubble:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: var(--theme-accent);
          background: var(--theme-accent-dim);
        }
        @keyframes scan-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
