
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ReceiptService } from './receipt.service';
import { DbService } from './db.service';
import type { Receipt } from '../models/receipt.model';
import { environment } from '@env/environment';

const mockReceipt: Receipt = {
  id: 1,
  store: 'ICA Maxi',
  category: 'Mat & dryck',
  categoryEn: 'Groceries',
  date: '2026-04-22',
  time: '17:42',
  total: 847.50,
  vat: 68.42,
  items: [{ name: 'Kaffe', qty: 1, price: 89.00, cat: 'Dryck' }],
};

describe('ReceiptService', () => {
  let service: ReceiptService;
  let dbService: Partial<DbService>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    dbService = {
      getAllReceipts: jest.fn().mockResolvedValue([mockReceipt]),
      addReceipt: jest.fn().mockResolvedValue(2),
      updateReceipt: jest.fn().mockResolvedValue(undefined),
      deleteReceipt: jest.fn().mockResolvedValue(undefined),
      getReceiptById: jest.fn().mockResolvedValue(mockReceipt),
      getUnsyncedReceipts: jest.fn().mockResolvedValue([]),
      markAsSynced: jest.fn().mockResolvedValue(undefined),
      searchItems: jest.fn().mockResolvedValue([mockReceipt]),
    };

    TestBed.configureTestingModule({
      providers: [
        ReceiptService,
        { provide: DbService, useValue: dbService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(ReceiptService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load all receipts and emit them', async () => {
    await service.loadAll();

    const receipts = await new Promise<Receipt[]>(resolve => {
      service.receipts$.subscribe(r => resolve(r));
    });
    expect(receipts).toHaveLength(1);
    expect(receipts[0].store).toBe('ICA Maxi');
  });

  it('should save a receipt, reload, and trigger sync', async () => {
    const { id: _, ...newReceipt } = mockReceipt;
    await service.loadAll();
    const id = await service.saveReceipt(newReceipt);

    expect(dbService.addReceipt).toHaveBeenCalledWith(expect.objectContaining({ store: 'ICA Maxi' }));
    expect(id).toBe(2);

    // saveReceipt fires-and-forgets syncToServer; flush the sync request
    const req = httpMock.expectOne(`${environment.apiUrl}/receipts`);
    req.flush({ id: 'srv-1', store: 'ICA Maxi' });
  });

  it('should update a receipt', async () => {
    await service.loadAll();
    await service.updateReceipt(1, { store: 'Coop' });

    expect(dbService.updateReceipt).toHaveBeenCalledWith(1, { store: 'Coop' });
  });

  it('should delete a receipt', async () => {
    await service.loadAll();
    await service.deleteReceipt(1);

    expect(dbService.deleteReceipt).toHaveBeenCalledWith(1);
  });

  it('should get receipt by id', async () => {
    const r = await service.getById(1);
    expect(r?.store).toBe('ICA Maxi');
  });

  it('should map local Receipt to backend CreateReceiptRequest on sync', async () => {
    const promise = service.syncToServer(mockReceipt);

    const req = httpMock.expectOne(`${environment.apiUrl}/receipts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      store: 'ICA Maxi',
      storeShort: 'ICA',
      category: 'Mat & dryck',
      categoryEn: 'Groceries',
      date: '2026-04-22',
      time: '17:42:00',
      total: 847.50,
      vat: 68.42,
      payment: 'Unknown',
      imagePath: null,
      householdId: null,
    });
    expect(req.request.body.items[0]).toMatchObject({
      name: 'Kaffe',
      nameEn: 'Kaffe',
      qty: 1,
      unit: 'st',
      price: 89.00,
      cat: 'Dryck',
    });

    req.flush({ id: 'srv-abc' });
    await promise;
    expect(dbService.markAsSynced).toHaveBeenCalledWith(1, 'srv-abc');
  });

  it('should swallow sync errors (offline-safe)', async () => {
    const promise = service.syncToServer(mockReceipt);
    const req = httpMock.expectOne(`${environment.apiUrl}/receipts`);
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'offline' });
    await expect(promise).resolves.toBeUndefined();
    expect(dbService.markAsSynced).not.toHaveBeenCalled();
  });

  it('should calculate spending by category', () => {
    const receipts: Receipt[] = [
      { ...mockReceipt, category: 'Mat & dryck', total: 500 },
      { ...mockReceipt, id: 2, category: 'Hem', total: 300 },
      { ...mockReceipt, id: 3, category: 'Mat & dryck', total: 200 },
    ];

    const breakdown = service.getSpendingByCategory(receipts);
    expect(breakdown['Mat & dryck']).toBe(700);
    expect(breakdown['Hem']).toBe(300);
  });

  it('should calculate monthly total correctly', () => {
    const receipts: Receipt[] = [
      { ...mockReceipt, date: '2026-04-22', total: 500 },
      { ...mockReceipt, id: 2, date: '2026-04-15', total: 300 },
      { ...mockReceipt, id: 3, date: '2026-03-20', total: 999 }, // different month
    ];

    const total = service.getMonthlyTotal(receipts, 2026, 3); // April = month 3 (0-indexed)
    expect(total).toBe(800);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
