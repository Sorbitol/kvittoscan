
import { TestBed } from '@angular/core/testing';
import { KrComponent } from './kr.component';

describe('KrComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [KrComponent] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function create(v: number, muted = false, size = 16) {
    const fixture = TestBed.createComponent(KrComponent);
    fixture.componentRef.setInput('v', v);
    fixture.componentRef.setInput('muted', muted);
    fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    return fixture;
  }

  it('should compute whole part correctly', () => {
    const f = create(847.50);
    expect(f.componentInstance.whole()).toBe('847');
  });

  it('should compute fraction correctly', () => {
    const f = create(847.50);
    expect(f.componentInstance.frac()).toBe('50');
  });

  it('should pad single-digit fractions with leading zero', () => {
    const f = create(19.05);
    expect(f.componentInstance.frac()).toBe('05');
  });

  it('should compute zero whole part', () => {
    const f = create(0);
    expect(f.componentInstance.whole()).toBe('0');
  });

  it('should compute zero frac part as 00', () => {
    const f = create(0);
    expect(f.componentInstance.frac()).toBe('00');
  });

  it('should round to 2 decimal places', () => {
    const f = create(10.999);
    expect(f.componentInstance.whole()).toBe('11');
    expect(f.componentInstance.frac()).toBe('00');
  });

  it('should compute whole for large number', () => {
    const f = create(6024);
    expect(f.componentInstance.whole()).toContain('6');
    expect(f.componentInstance.frac()).toBe('00');
  });
});
