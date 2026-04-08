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
 * Decodes a barcode from a Blob/File
 */
export const scanBarcode = async (imageBlob: Blob): Promise<ScanResult> => {
  const url = URL.createObjectURL(imageBlob);
  try {
    // Try BarcodeReader first
    try {
      const result = await barcodeReader.decodeFromImageUrl(url);
      return { success: true, text: result.getText() };
    } catch (e) {
      // Fallback to MultiFormatReader which is more aggressive
      const result = await multiFormatReader.decodeFromImageUrl(url);
      return { success: true, text: result.getText() };
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
    return { success: true, text: result.getText() };
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
          body: JSON.stringify({ base64: base64Str, mediaType: imageBlob.type })
        });

        if (res.status === 529) {
          return resolve({ success: false, error: "Server Busy (Overloaded). The AI is currently at capacity. Please try again in 5-10 seconds." });
        }

        const body = await res.json();
        
        if (res.ok && body.food) {
          resolve({ success: true, data: body.food });
        } else {
          resolve({ success: false, error: body.error || 'Failed to extract nutritional data.' });
        }
      } catch (err) {
        console.error("AI Label scan failed", err);
        resolve({ success: false, error: "Network error during AI analysis. Check your connection and try again." });
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
    const body = await res.json();
    const results = body.foods || body.results || [];

    if (results.length > 0) {
      return { success: true, data: results[0], text: code };
    } else {
      return { success: false, error: "No food found for this code in our database." };
    }
  } catch (err) {
    console.error("Lookup failed", err);
    return { success: false, error: "Failed to communicate with the food database." };
  }
};
