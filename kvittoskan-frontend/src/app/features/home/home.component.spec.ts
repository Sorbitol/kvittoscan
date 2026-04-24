
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { ReceiptService } from '@core/services/receipt.service';

const mockReceiptService = {
  loadAll: jest.fn().mockResolvedValue(undefined),
  receipts$: of([]),
  saveReceipt: jest.fn(),
  getSpendingByCategory: jest.fn().mockReturnValue({}),
  getMonthlyTotal: jest.fn().mockReturnValue(6024),
};

describe('HomeComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ReceiptService, useValue: mockReceiptService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  function create() {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should render without error', () => {
    const f = create();
    expect(f.nativeElement).toBeTruthy();
  });

  it('should render spending amount card', () => {
    const f = create();
    const card = (f.nativeElement as HTMLElement).querySelector('.summary-card');
    expect(card).toBeTruthy();
  });

  it('should render category pills', () => {
    const f = create();
    const pills = (f.nativeElement as HTMLElement).querySelectorAll('.category-pill');
    expect(pills.length).toBeGreaterThan(0);
  });

  it('should render receipt list', () => {
    const f = create();
    const list = (f.nativeElement as HTMLElement).querySelector('.receipt-list');
    expect(list).toBeTruthy();
  });

  it('should render bar chart with 9 bars', () => {
    const f = create();
    const bars = (f.nativeElement as HTMLElement).querySelectorAll('.bar-chart__bar');
    expect(bars.length).toBe(9);
  });

  it('should have the last bar chart bar highlighted', () => {
    const f = create();
    const activeBars = (f.nativeElement as HTMLElement).querySelectorAll('.bar-chart__bar--active');
    expect(activeBars.length).toBe(1);
  });

  it('should show ICA Maxi in recent receipts', () => {
    const f = create();
    const text = (f.nativeElement as HTMLElement).textContent;
    expect(text).toContain('ICA Maxi');
  });

  it('should show greeting text', () => {
    const f = create();
    const text = (f.nativeElement as HTMLElement).textContent;
    expect(text).toMatch(/God|Good/);
  });
});
