
import { TestBed } from '@angular/core/testing';
import { LangService } from './lang.service';

describe('LangService', () => {
  let service: LangService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [LangService] });
    service = TestBed.inject(LangService);
  });

  it('should default to sv', () => {
    expect(service.lang()).toBe('sv');
  });

  it('should toggle between sv and en', () => {
    service.toggle();
    expect(service.lang()).toBe('en');
    service.toggle();
    expect(service.lang()).toBe('sv');
  });

  it('should set lang explicitly', () => {
    service.set('en');
    expect(service.lang()).toBe('en');
  });

  it('should persist lang to localStorage', () => {
    service.set('en');
    expect(localStorage.getItem('kvittoskan_lang')).toBe('en');
  });

  it('should translate sv correctly', () => {
    service.set('sv');
    expect(service.t('Hem', 'Home')).toBe('Hem');
  });

  it('should translate en correctly', () => {
    service.set('en');
    expect(service.t('Hem', 'Home')).toBe('Home');
  });
});
