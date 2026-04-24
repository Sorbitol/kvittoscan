
import { TestBed } from '@angular/core/testing';
import { FormatDatePipe } from './format-date.pipe';
import { LangService } from '@core/services/lang.service';

describe('FormatDatePipe', () => {
  let pipe: FormatDatePipe;
  let langService: LangService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [FormatDatePipe, LangService] });
    pipe = TestBed.inject(FormatDatePipe);
    langService = TestBed.inject(LangService);
  });

  it('should format date in Swedish', () => {
    langService.set('sv');
    expect(pipe.transform('2026-04-22')).toBe('22 apr');
  });

  it('should format date in English', () => {
    langService.set('en');
    expect(pipe.transform('2026-04-22')).toBe('22 Apr');
  });

  it('should use Swedish month names', () => {
    langService.set('sv');
    expect(pipe.transform('2026-05-01')).toBe('1 maj');
    expect(pipe.transform('2026-06-15')).toBe('15 jun');
  });

  it('should use English month names', () => {
    langService.set('en');
    expect(pipe.transform('2026-05-01')).toBe('1 May');
    expect(pipe.transform('2026-06-15')).toBe('15 Jun');
  });

  it('should handle January correctly', () => {
    langService.set('sv');
    expect(pipe.transform('2026-01-01')).toBe('1 jan');
  });

  it('should handle December correctly', () => {
    langService.set('en');
    expect(pipe.transform('2026-12-31')).toBe('31 Dec');
  });
});
