import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { OcrResult } from '../models/receipt.model';

export type OcrStep = 'idle' | 'analyzing' | 'reading' | 'identifying' | 'matching' | 'done' | 'error';

@Injectable({ providedIn: 'root' })
export class OcrService {
  private stepSubject = new BehaviorSubject<OcrStep>('idle');
  step$ = this.stepSubject.asObservable();

  async processImage(imageData: string): Promise<OcrResult> {
    const { createWorker } = await import('tesseract.js');

    this.stepSubject.next('analyzing');
    const worker = await createWorker('swe+eng', 1, {
      logger: (m: { status: string }) => {
        if (m.status === 'recognizing text') this.stepSubject.next('reading');
      },
    });

    this.stepSubject.next('reading');

    const { data: { text } } = await worker.recognize(imageData);
    await worker.terminate();

    this.stepSubject.next('identifying');
    const result = this.parseReceiptText(text);

    this.stepSubject.next('matching');
    result.items = result.items.map(item => ({
      ...item,
      confidence: this.calcConfidence(item.name),
    }));

    this.stepSubject.next('done');
    return result;
  }

  reset(): void {
    this.stepSubject.next('idle');
  }

  private parseReceiptText(text: string): OcrResult {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const store = lines[0] ?? 'Unknown Store';

    const priceRegex = /^(.+?)\s+(\d+[,.]?\d*)\s*$/;
    const items = lines
      .slice(2)
      .map(line => {
        const match = priceRegex.exec(line);
        if (!match) return null;
        const price = parseFloat(match[2].replace(',', '.'));
        if (isNaN(price) || price <= 0) return null;
        return { name: match[1].trim(), price, confidence: 0.9 };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, 20);

    return { store, items };
  }

  private calcConfidence(name: string): number {
    // Reject ASCII control chars, brackets, and symbols uncommon in receipt line items
    const suspicious = /[[\]{}|\\^~`!@#$%*_+=<>?]/;
    return suspicious.test(name) ? 0.88 : 0.97;
  }
}
