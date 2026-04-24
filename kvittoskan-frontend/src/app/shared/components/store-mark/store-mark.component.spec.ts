
import { TestBed } from '@angular/core/testing';
import { StoreMarkComponent } from './store-mark.component';

describe('StoreMarkComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StoreMarkComponent] });
  });

  function create(name: string, category = '', size = 40) {
    const fixture = TestBed.createComponent(StoreMarkComponent);
    fixture.componentRef.setInput('name', name);
    fixture.componentRef.setInput('category', category);
    fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    return fixture;
  }

  it('should display the first letter of the store name', () => {
    const f = create('ICA Maxi', 'Groceries');
    expect((f.nativeElement as HTMLElement).textContent?.trim()).toBe('I');
  });

  it('should use grocery palette for Groceries category', () => {
    const f = create('ICA', 'Groceries');
    const el = (f.nativeElement as HTMLElement).querySelector('.store-mark') as HTMLElement;
    expect(el.style.background).toBe('rgb(237, 240, 228)');
  });

  it('should use health palette for Health category', () => {
    const f = create('Apotek', 'Health');
    const el = (f.nativeElement as HTMLElement).querySelector('.store-mark') as HTMLElement;
    expect(el.style.background).toBe('rgb(239, 230, 236)');
  });

  it('should use fallback palette for unknown category', () => {
    const f = create('Test Store', 'Unknown');
    const el = (f.nativeElement as HTMLElement).querySelector('.store-mark') as HTMLElement;
    expect(el.style.background).toBe('rgb(238, 236, 229)');
  });

  it('should show ? for empty store name', () => {
    const f = create('', '');
    expect((f.nativeElement as HTMLElement).textContent?.trim()).toBe('?');
  });

  it('should apply custom size as inline style', () => {
    const f = create('Test', '', 56);
    const el = (f.nativeElement as HTMLElement).querySelector('.store-mark') as HTMLElement;
    expect(el.style.width).toBe('56px');
    expect(el.style.height).toBe('56px');
  });

  it('should use Swedish category mat & dryck palette', () => {
    const f = create('ICA', 'Mat & dryck');
    const el = (f.nativeElement as HTMLElement).querySelector('.store-mark') as HTMLElement;
    expect(el.style.background).toBe('rgb(237, 240, 228)');
  });
});
