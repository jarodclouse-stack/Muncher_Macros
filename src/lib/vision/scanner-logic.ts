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
        const res = await fetch(`/api/vision?type=label&t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: base64Str, mediaType: 'image/jpeg' }),
          cache: 'no-store'
        });

        if (res.status === 404) {
          return resolve({ success: false, error: "AI Service Unavailable (404). This usually means the Vercel deployment is still in progress or the API route is missing. Please wait 30 seconds and try again." });
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
        const res = await fetch(`/api/vision?type=barcode&t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: base64Str, mediaType: 'image/jpeg' }),
          cache: 'no-store'
        });

        if (res.status === 404) {
          return resolve({ success: false, error: "AI OCR Service Unavailable (404). This usually means the Vercel deployment is still in progress. Please wait 30 seconds." });
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
    // 1. Try internal API first
    const internalRes = await fetch(`/api/food-search?q=${encodeURIComponent(code)}`);
    
    if (internalRes.ok) {
      const body = await internalRes.json();
      const results = body.foods || body.results || [];
      if (results.length > 0) {
        return { success: true, data: results[0], text: code };
      }
    }

    // 2. Fallback: Direct OpenFoodFacts Client Call (Mimics legacy behavior)
    console.log("Internal lookup failed or empty, trying direct OpenFoodFacts fallback...");
    const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}`);
    
    if (offRes.ok) {
      const data = await offRes.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        // Map OpenFoodFacts to internal Food format
        const mappedData = {
          name: p.product_name || "Unknown Product",
          brand: p.brands ? p.brands.split(',')[0] : "",
          serving: p.serving_size || "100g",
          cal: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
          p: p.nutriments?.proteins_100g || 0,
          c: p.nutriments?.carbohydrates_100g || 0,
          f: p.nutriments?.fat_100g || 0,
          fiber: p.nutriments?.fiber_100g || 0,
          barcode: code,
          _src: 'off'
        };
        return { success: true, data: mappedData, text: code };
      }
    }

    return { success: false, error: "No food found for this code in our database or OpenFoodFacts." };
  } catch (err) {
    console.error("Lookup failed", err);
    // Even on network error, try one last direct hit strictly for redundancy
    try {
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}`);
      const data = await offRes.json();
      if (data.status === 1) {
         // (mapping logic same as above - simplified for redundancy)
         return { success: true, text: code, data: { name: data.product.product_name, cal: 0, p:0, c:0, f:0, barcode: code } };
      }
    } catch {}
    
    return { success: false, error: "Network error: Failed to communicate with the search service." };
  }
};
