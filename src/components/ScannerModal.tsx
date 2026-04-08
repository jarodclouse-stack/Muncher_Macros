import React, { useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, Camera, Image as ImageIcon, Check, RefreshCw, Loader2, Scissors } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { scanBarcode, scanQRCode, scanNutritionLabel, lookupBarcode } from '../lib/vision/scanner-logic';

interface ScannerModalProps {
  type: 'barcode' | 'qr' | 'label';
  onClose: () => void;
  onResult: (data: any) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ type, onClose, onResult }) => {
  const [source, setSource] = useState<'camera' | 'upload' | 'manual' | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Camera Logic ---
  const startCamera = async () => {
    setSource('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Stop stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      
      setImage(dataUrl);
      setIsCropping(true);
    }
  };

  // --- Upload Logic ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Cropper Logic ---
  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const handleCropSave = async () => {
    if (!image || !croppedAreaPixels) return;
    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const { width, height, x, y } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, x, y, width, height, 0, 0, width, height);
      
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg'));
      setLastBlob(blob);
      setIsCropping(false);
      processImage(blob);
    } catch (e) {
      setError("Failed to crop image.");
    }
  };

  // --- Final Processing ---
  const processImage = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);
    try {
      let result;
      if (type === 'barcode') {
        const scanRes = await scanBarcode(blob);
        if (scanRes.success && scanRes.text) {
          result = await lookupBarcode(scanRes.text);
        } else {
          result = scanRes;
        }
      } else if (type === 'qr') {
        const scanRes = await scanQRCode(blob);
        if (scanRes.success && scanRes.text) {
          result = await lookupBarcode(scanRes.text);
        } else {
          result = scanRes;
        }
      } else {
        result = await scanNutritionLabel(blob);
      }

      if (result.success) {
        onResult(result.data);
        onClose();
      } else {
        setError(result.error || "Scan failed. Please try a clearer photo or enter manually.");
        setIsProcessing(false);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    setIsProcessing(true);
    setError(null);
    const result = await lookupBarcode(manualCode.trim());
    if (result.success) {
      onResult(result.data);
      onClose();
    } else {
      setError(result.error || 'Could not find a product with that barcode. Please try a different code.');
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setIsCropping(false);
    setError(null);
    setSource(null);
    setLastBlob(null);
    setManualCode('');
  };

  const retryLastScan = () => {
    if (lastBlob) {
      setError(null);
      processImage(lastBlob);
    } else {
      reset();
    }
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(15px)', zIndex: 6000, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s' }}>
      
      {/* Header */}
      <div style={{ width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {type === 'barcode' && <Scissors size={20} color="#00C9FF" />}
          {type === 'qr' && <RefreshCw size={20} color="#FCC419" />}
          {type === 'label' && <Camera size={20} color="#92FE9D" />}
          {type.toUpperCase()} SCAN
        </h2>
        <button onClick={() => {
          if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
          }
          onClose();
        }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
      </div>

      <div style={{ flex: 1, width: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        
        {!source && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '85%', maxWidth: '340px' }}>
            <button onClick={startCamera} style={{ background: 'var(--theme-accent, #00C9FF)', color: '#000', padding: '16px', borderRadius: '18px', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,201,255,0.2)' }}>
              <Camera size={24} /> Take Live Photo
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.15)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}>
              <ImageIcon size={24} /> Choose Existing
            </button>
            
            {(type === 'barcode' || type === 'qr') && (
              <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textAlign: 'center', letterSpacing: '1px' }}>OR ENTER MANUALLY</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter numbers..." 
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '14px', outline: 'none' }}
                  />
                  <button 
                    onClick={handleManualSubmit}
                    disabled={!manualCode.trim()}
                    style={{ background: manualCode.trim() ? 'var(--theme-success, #92FE9D)' : 'rgba(255,255,255,0.1)', color: manualCode.trim() ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '12px', padding: '0 16px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    GO
                  </button>
                </div>
              </div>
            )}
            
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
          </div>
        )}

        {source === 'camera' && !image && (
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <button onClick={capturePhoto} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', border: '8px solid rgba(255,255,255,0.3)', cursor: 'pointer' }} />
            </div>
            {/* Guide Overlay */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: type === 'label' ? '350px' : '150px', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '12px', boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)' }}>
               <div style={{ position: 'absolute', top: '-30px', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '10px', fontWeight: '700', letterSpacing: '1px' }}>CENTER {type.toUpperCase()} HERE</div>
            </div>
          </div>
        )}

        {isCropping && image && (
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={type === 'label' ? 0.7 : 1.5}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
            <div style={{ position: 'absolute', bottom: '100px', left: '20px', right: '20px' }}>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ position: 'absolute', bottom: '30px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button onClick={reset} style={{ background: 'rgba(255,107,107,0.1)', color: '#FF6B6B', padding: '12px 24px', borderRadius: '14px', border: '1px solid rgba(255,107,107,0.3)', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCropSave} style={{ background: 'var(--theme-success, #92FE9D)', color: '#000', padding: '12px 32px', borderRadius: '14px', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(146,254,157,0.2)' }}>
                <Check size={20} /> Use Photo
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', zIndex: 100 }}>
            <Loader2 className="spin" size={56} color="var(--theme-accent, #00C9FF)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '20px', marginBottom: '8px' }}>Analyzing...</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Matching with our food database</div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', zIndex: 200 }}>
            <div style={{ width: '100%', maxWidth: '300px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,107,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B6B' }}>
                <X size={24} />
              </div>
              <div style={{ color: '#FF6B6B', textAlign: 'center', fontWeight: '600', fontSize: '15px', lineHeight: '1.5' }}>{error}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                {lastBlob && (
                   <button onClick={retryLastScan} style={{ background: 'var(--theme-accent, #00C9FF)', color: '#000', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                     <RefreshCw size={18} /> Retry analysis
                   </button>
                )}
                <button onClick={reset} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  {type === 'label' ? 'Take New Photo' : 'Try Again / Enter Manual'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>,
    document.body
  );
};
