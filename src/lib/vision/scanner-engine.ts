import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export interface ScannerResult {
  type: 'barcode' | 'qr';
  value: string;
  format?: string;
}

export type ScannerConfig = {
  containerId: string;
  type: 'barcode' | 'qr' | 'both';
  onResult: (result: ScannerResult) => void;
  onError?: (error: string) => void;
  fps?: number;
  qrbox?: { width: number; height: number };
};

export class ScannerEngine {
  private scanner: Html5Qrcode | null = null;
  private consecutiveFailures = 0;
  private readonly MAX_FAILURES = 15;
  private isProcessing = false;
  private config: ScannerConfig;

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.scanner) return;

    this.scanner = new Html5Qrcode(this.config.containerId);
    this.consecutiveFailures = 0;
    this.isProcessing = false;

    const formats = this.getFormats();
    const startConfig = {
      fps: this.config.fps || 10,
      qrbox: this.config.qrbox || { width: 250, height: 250 },
      aspectRatio: 1.0,
      formatsToSupport: formats,
    };

    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        startConfig,
        (decodedText, result) => {
          if (this.isProcessing) return;
          this.isProcessing = true;

          const formatName = (result && result.result && result.result.format && result.result.format.formatName) || 'UNKNOWN';
          const type: 'barcode' | 'qr' = formatName.includes('QR') ? 'qr' : 'barcode';

          this.config.onResult({
            type,
            value: decodedText,
            format: formatName
          });
        },
        () => {
          this.consecutiveFailures++;
          if (this.consecutiveFailures >= this.MAX_FAILURES) {
            if (this.config.onError) {
              this.config.onError("Keep the code steady and ensure good lighting.");
            }
            this.consecutiveFailures = 0;
          }
        }
      );
    } catch (err) {
      console.error('ScannerEngine start error:', err);
      throw new Error('Camera initialization failed. Check permissions.');
    }
  }

  async stop(): Promise<void> {
    if (this.scanner && this.scanner.isScanning) {
      try {
        await this.scanner.stop();
        this.scanner = null;
      } catch {
        // Silently fail
      }
    }
  }

  private getFormats(): Html5QrcodeSupportedFormats[] {
    if (this.config.type === 'qr') return [Html5QrcodeSupportedFormats.QR_CODE];
    if (this.config.type === 'barcode') {
      return [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39
      ];
    }
    return [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128
    ];
  }
}
