import React, { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X, Check, ZoomIn, Crop } from 'lucide-react';

interface ImageCropperModalProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [aspect, setAspect] = useState<number | undefined>(1);

  const onCropChange = useCallback((c: { x: number, y: number }) => setCrop(c), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);
  
  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (error) => reject(error));
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    // AI OPTIMIZATION: Cap resolution at 2048px to stay under API limits while keeping texture
    const MAX_SIZE = 2048;
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;

    if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / targetWidth, MAX_SIZE / targetHeight);
      targetWidth *= ratio;
      targetHeight *= ratio;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve, reject) => {
      // Normalize to high-quality JPEG for fastest AI processing
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Canvas is empty'));
        else resolve(blob);
      }, 'image/jpeg', 0.92);
    });
  };

  const onConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
        <div style={{ color: '#fff', fontWeight: '800', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Crop Scan Target</div>
        <div style={{ width: '36px' }} /> {/* Spacer to keep title centered */}
      </div>

      {/* Cropper Container */}
      <div style={{ flex: 1, position: 'relative', background: '#111' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={onCropChange}
          onCropComplete={handleCropComplete}
          onZoomChange={onZoomChange}
        />
      </div>

      {/* Bottom Controls */}
      <div style={{
        padding: '30px', background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button 
            onClick={() => setAspect(1)}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer',
              background: aspect === 1 ? 'var(--theme-accent)' : 'rgba(255,255,255,0.05)',
              border: aspect === 1 ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: aspect === 1 ? '#000' : '#fff',
              transition: 'all 0.2s'
            }}>
            SQUARE (LABEL/QR)
          </button>
          <button 
            onClick={() => setAspect(undefined)}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer',
              background: aspect === undefined ? 'var(--theme-accent)' : 'rgba(255,255,255,0.05)',
              border: aspect === undefined ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: aspect === undefined ? '#000' : '#fff',
              transition: 'all 0.2s',
              textAlign: 'center'
            }}>
            FREEFORM (ANY)
          </button>
          
          <button 
            onClick={onConfirm}
            style={{ 
              flex: 1.2, padding: '10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer',
              background: 'var(--theme-accent)', border: 'none', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 15px rgba(0,201,255,0.3)', transition: 'all 0.2s'
            }}>
            <Check size={18} /> ACCEPT
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <ZoomIn size={18} color="rgba(255,255,255,0.5)" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onZoomChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--theme-accent)' }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700' }}>
          <Crop size={14} /> PINCH OR DRAG TO ISOLATE BARCODE/LABEL
        </div>
      </div>
    </div>
  );
};
