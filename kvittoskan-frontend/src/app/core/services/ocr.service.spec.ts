
import { TestBed } from '@angular/core/testing';
import { OcrService } from './ocr.service';

describe('OcrService', () => {
  let service: OcrService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [OcrService] });
    service = TestBed.inject(OcrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with idle step', () => {
    let step: string | undefined;
    service.step$.subscribe(s => (step = s));
    expect(step).toBe('idle');
  });

  it('should reset to idle', () => {
    service.reset();
    let step: string | undefined;
    service.step$.subscribe(s => (step = s));
    expect(step).toBe('idle');
  });

  it('should calculate low confidence for suspicious characters', () => {
    // Access private method via type cast for testing
    const svc = service as unknown as { calcConfidence: (name: string) => number };
    const normal = svc.calcConfidence('Kaffe Zoégas');
    const suspicious = svc.calcConfidence('K@ffe [Z0égas]');
    expect(normal).toBeGreaterThan(suspicious);
  });

  it('should parse receipt text with items and prices', () => {
    const svc = service as unknown as { parseReceiptText: (text: string) => { store: string; items: Array<{ name: string; price: number }> } };
    const text = 'ICA MAXI\nKUNGSGATAN 32\nKaffe 89.00\nMjölk 19.50\nBananer 24.90';
    const result = svc.parseReceiptText(text);
    expect(result.store).toBe('ICA MAXI');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.some(i => i.price === 89.00)).toBe(true);
  });
});
