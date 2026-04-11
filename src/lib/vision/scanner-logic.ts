import { BrowserBarcodeReader, BrowserMultiFormatReader } from '@zxing/library';

// Shared reader instances
const barcodeReader = new BrowserBarcodeReader();
const multiFormatReader = new BrowserMultiFormatReader();

export interface ScanResult {
  success: boolean;
  text?: string;
  data?: any;
  error?: string;
}


/**
 * Strict URL check to prevent websites from being processed as food
 */
const isURL = (text: string): boolean => {
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
  const commonTlds = /\.(com|net|org|edu|gov|io|co|digital|net|us|info|me)\b/i;
  
  // Specific check: Is this a SmartLabel or product details URL?
  if (text.includes('smartlabel.') || text.includes('/product/')) return false;

  return urlPattern.test(text) || commonTlds.test(text) || text.includes('://');
};

/**
 * Decodes a barcode from a Blob/File
 */
export const scanBarcode = async (imageBlob: Blob): Promise<ScanResult> => {
  const url = URL.createObjectURL(imageBlob);
  try {
    // Try BarcodeReader first
    try {
      const result = await barcodeReader.decodeFromImageUrl(url);
      const text = result.getText();
      if (isURL(text)) return { success: false, error: "Result is a web link. Only food codes are allowed." };
      return { success: true, text };
    } catch (e) {
      // Fallback to MultiFormatReader which is more aggressive
      const result = await multiFormatReader.decodeFromImageUrl(url);
      const text = result.getText();
      if (isURL(text)) return { success: false, error: "Result is a web link. Only food codes are allowed." };
      return { success: true, text };
    }
  } catch (err) {
    console.error("Barcode scan failed", err);
    return { success: false, error: "No barcode detected. Try a clearer photo or enter the code manually." };
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Decodes a QR Code from a Blob/File (using MultiFormatReader for best results)
 */
export const scanQRCode = async (imageBlob: Blob): Promise<ScanResult> => {
  const url = URL.createObjectURL(imageBlob);
  try {
    const result = await multiFormatReader.decodeFromImageUrl(url);
    const text = result.getText();
    
    // Check if it's a URL (common in QR codes)
    if (isURL(text)) {
      return { success: false, error: "Result is a web link. This app requires nutrition labels, barcodes, or food-specific QR codes." };
    }

    // Extraction logic: If it's a product URL, extract the GTIN/UPC
    const gtinMatch = text.match(/\/(\d{12,14})\/?$/);
    if (gtinMatch) return { success: true, text: gtinMatch[1].replace(/^0+/, '') };

    return { success: true, text };
  } catch (err) {
    console.error("QR scan failed", err);
    return { success: false, error: "No QR code detected." };
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Processes a Nutrition Label by calling the AI API
 */
export const scanNutritionLabel = async (imageBlob: Blob): Promise<ScanResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Str = (reader.result as string).split(',')[1];
        const res = await fetch('/api/ai-label', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: base64Str, mediaType: 'image/jpeg' })
        });

        if (res.status === 404) {
          return resolve({ success: false, error: "AI Service Unavailable (404). This feature requires a backend server or Vercel deployment." });
        }

        const body = await res.json();
        
        if (res.ok && body.food) {
          resolve({ success: true, data: body.food });
        } else {
          resolve({ success: false, error: body.error || 'Failed to extract nutritional data.' });
        }
      } catch (err) {
        console.error("AI Label scan failed", err);
        resolve({ success: false, error: "Network error during AI analysis. Ensure your local server is running." });
      }
    };
    reader.onerror = () => resolve({ success: false, error: "Failed to read image file." });
    reader.readAsDataURL(imageBlob);
  });
};

/**
 * Extracts barcode numbers via AI OCR if standard scanning fails
 */
export const extractBarcodeDigits = async (imageBlob: Blob): Promise<ScanResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Str = (reader.result as string).split(',')[1];
        const res = await fetch('/api/ai-barcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: base64Str, mediaType: 'image/jpeg' })
        });

        if (res.status === 404) {
          return resolve({ success: false, error: "AI OCR Service Unavailable (404). Backend deployment required for fallback reading." });
        }

        const body = await res.json();
        
        if (res.ok && body.code) {
          resolve({ success: true, text: body.code });
        } else {
          resolve({ success: false, error: body.error || 'AI could not read the numbers either.' });
        }
      } catch (err) {
        console.error("AI Barcode read failed", err);
        resolve({ success: false, error: "Network error during AI analysis." });
      }
    };
    reader.onerror = () => resolve({ success: false, error: "Failed to read image file." });
    reader.readAsDataURL(imageBlob);
  });
};

/**
 * Centralized Barcode/QR Lookup Logic
 */
export const lookupBarcode = async (code: string): Promise<ScanResult> => {
  try {
    const res = await fetch(`/api/food-search?q=${encodeURIComponent(code)}`);
    
    if (res.status === 404) {
      return { success: false, error: "Search Service Unavailable (404). This requires a backend configuration or Vercel deployment." };
    }

    if (!res.ok) {
        return { success: false, error: `Search failed with status ${res.status}.` };
    }

    const body = await res.json();
    const results = body.foods || body.results || [];

    if (results.length > 0) {
      return { success: true, data: results[0], text: code };
    } else {
      return { success: false, error: "No food found for this code in our database." };
    }
  } catch (err) {
    console.error("Lookup failed", err);
    return { success: false, error: "Network error: Failed to communicate with the search service." };
  }
};
