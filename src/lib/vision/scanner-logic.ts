import { BrowserBarcodeReader, BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { apiFetch } from '../api';

// Shared reader instances with aggressive decoding hints
const hints = new Map<DecodeHintType, any>();
hints.set(DecodeHintType.TRY_HARDER, true);
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.UPC_A, 
  BarcodeFormat.UPC_E, 
  BarcodeFormat.EAN_13, 
  BarcodeFormat.EAN_8, 
  BarcodeFormat.CODE_128
]);

const barcodeReader = new BrowserBarcodeReader();
const multiFormatReader = new BrowserMultiFormatReader(hints);

export interface ScanResult {
  success: boolean;
  text?: string;
  data?: any;
  error?: string;
  detail?: string;
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
    } catch {
      // Fallback to MultiFormatReader with aggressive hints (configured in constructor)
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
 * Processes a Nutrition Label by calling the AI API
 */
export const scanNutritionLabel = async (imageBlob: Blob): Promise<ScanResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Str = (reader.result as string).split(',')[1];
        const res = await apiFetch(`/api/ai-label?t=${Date.now()}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'vision', type: 'label', base64: base64Str, mediaType: 'image/jpeg' }),
          cache: 'no-store'
        });

        if (res.status === 404 && !res.headers.get('content-type')?.includes('json')) {
          return resolve({ success: false, error: "AI Vision Route Missing (404). Please try again in 30 seconds." });
        }

        const body = await res.json();

        if (res.status === 429) {
          return resolve({ success: false, error: body.error || 'Daily AI scan limit reached.', detail: body.code });
        }

        if (res.ok && body.food) {
          resolve({ success: true, data: body.food });
        } else {
          resolve({
            success: false,
            error: body.error || 'Failed to extract nutritional data.',
            detail: body.detail
          });
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
        const res = await apiFetch(`/api/ai-barcode?t=${Date.now()}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'vision', type: 'barcode', base64: base64Str, mediaType: 'image/jpeg' }),
          cache: 'no-store'
        });

        if (res.status === 404 && !res.headers.get('content-type')?.includes('json')) {
          return resolve({ success: false, error: "AI OCR Route Missing (404). Please try again in 30 seconds." });
        }

        const body = await res.json();

        if (res.status === 429) {
          return resolve({ success: false, error: body.error || 'Daily AI scan limit reached.', detail: body.code });
        }

        if (res.ok && body.code) {
          resolve({ success: true, text: body.code });
        } else {
          resolve({
            success: false,
            error: body.error || 'Failed to decode barcode numbers.',
            detail: body.detail
          });
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
 * Centralized Barcode Lookup Logic
 */
export const lookupBarcode = async (code: string): Promise<ScanResult> => {
  try {
    // 1. Try internal API first
    const internalRes = await apiFetch('/api/db-search', {
      method: 'POST',
      body: JSON.stringify({ query: code })
    });
    
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
        const n = p.nutriments || {};

        // Prefer per-serving values when available; fall back to per-100g.
        // OPF stores both: "energy-kcal_serving" and "energy-kcal_100g".
        const servingG = parseFloat(p.serving_quantity || '0') || null;
        const scale = servingG ? servingG / 100 : 1;

        const calServing = n['energy-kcal_serving'] ?? (n['energy-kcal_100g'] != null ? n['energy-kcal_100g'] * scale : null);
        const pServing   = n['proteins_serving']      ?? (n['proteins_100g']      != null ? n['proteins_100g']      * scale : null);
        const cServing   = n['carbohydrates_serving'] ?? (n['carbohydrates_100g'] != null ? n['carbohydrates_100g'] * scale : null);
        const fServing   = n['fat_serving']           ?? (n['fat_100g']           != null ? n['fat_100g']           * scale : null);
        const fbServing  = n['fiber_serving']         ?? (n['fiber_100g']         != null ? n['fiber_100g']         * scale : null);

        const mappedData = {
          name: p.product_name || "Unknown Product",
          brand: p.brands ? p.brands.split(',')[0] : "",
          serving: p.serving_size || (servingG ? `${servingG}g` : "100g"),
          sQty: servingG || 100,
          sUnit: 'g',
          cal: Math.round(calServing ?? 0),
          p: Math.round((pServing ?? 0) * 10) / 10,
          c: Math.round((cServing ?? 0) * 10) / 10,
          f: Math.round((fServing ?? 0) * 10) / 10,
          fb: Math.round((fbServing ?? 0) * 10) / 10,
          barcode: code,
          _src: 'off'
        };

        // Quality check: if calories are suspiciously low for a non-water food,
        // the OPF entry is likely incomplete. Try AI lookup as a better source.
        const nameLC = mappedData.name.toLowerCase();
        const isProbablyWater = ['water', 'seltzer', 'sparkling', 'club soda'].some(w => nameLC.includes(w));
        if (mappedData.cal < 5 && !isProbablyWater) {
          // Let the caller fall through to AI lookup by returning failure
          console.warn(`[barcode] OPF data quality too low for ${code} (${mappedData.cal} kcal) — skipping`);
          return { success: false, error: "Food data from barcode database is incomplete. Try scanning the nutrition label instead." };
        }

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
