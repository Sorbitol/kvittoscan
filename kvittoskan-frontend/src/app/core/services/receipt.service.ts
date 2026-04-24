import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { DbService } from './db.service';
import type { Receipt, ReceiptItem } from '../models/receipt.model';
import { environment } from '@env/environment';

interface CreateReceiptItemRequest {
  name: string;
  nameEn: string;
  qty: number;
  unit: string;
  price: number;
  cat: string;
}

interface CreateReceiptRequest {
  store: string;
  storeShort: string;
  category: string;
  categoryEn: string;
  date: string;
  time: string;
  total: number;
  vat: number;
  payment: string;
  items: CreateReceiptItemRequest[];
  imagePath: string | null;
  householdId: string | null;
}

interface ReceiptDto {
  id: string;
  userId: string;
  householdId: string | null;
  store: string;
  storeShort: string;
  category: string;
  categoryEn: string;
  date: string;
  time: string;
  total: number;
  vat: number;
  payment: string;
  items: Array<{
    id: string; receiptId: string;
    name: string; nameEn: string; qty: number; unit: string; price: number; cat: string;
  }>;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly http = inject(HttpClient);
  private readonly db = inject(DbService);

  private receiptsSubject = new BehaviorSubject<Receipt[]>([]);
  receipts$ = this.receiptsSubject.asObservable();

  async loadAll(): Promise<void> {
    const receipts = await this.db.getAllReceipts();
    this.receiptsSubject.next(receipts);
  }

  async saveReceipt(receipt: Omit<Receipt, 'id'>): Promise<number> {
    const id = await this.db.addReceipt(receipt);
    await this.loadAll();
    this.syncToServer({ ...receipt, id }).catch(() => { /* offline-safe */ });
    return id;
  }

  async updateReceipt(id: number, changes: Partial<Receipt>): Promise<void> {
    await this.db.updateReceipt(id, changes);
    await this.loadAll();
  }

  async deleteReceipt(id: number): Promise<void> {
    await this.db.deleteReceipt(id);
    await this.loadAll();
  }

  async getById(id: number): Promise<Receipt | undefined> {
    return this.db.getReceiptById(id);
  }

  async searchItems(query: string): Promise<Receipt[]> {
    return this.db.searchItems(query);
  }

  async syncToServer(receipt: Receipt): Promise<void> {
    if (!receipt.id) return;
    const payload = this.toCreateRequest(receipt);
    try {
      const created = await firstValueFrom(
        this.http.post<ReceiptDto>(`${environment.apiUrl}/receipts`, payload)
      );
      await this.db.markAsSynced(receipt.id, created.id);
    } catch {
      // Will retry on next sync
    }
  }

  async syncAll(): Promise<void> {
    const unsynced = await this.db.getUnsyncedReceipts();
    await Promise.allSettled(unsynced.map(r => this.syncToServer(r)));
  }

  async fetchFromServer(): Promise<ReceiptDto[]> {
    return firstValueFrom(
      this.http.get<ReceiptDto[]>(`${environment.apiUrl}/receipts`)
    );
  }

  getSpendingByCategory(receipts: Receipt[]): Record<string, number> {
    return receipts.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.total;
      return acc;
    }, {} as Record<string, number>);
  }

  getMonthlyTotal(receipts: Receipt[], year: number, month: number): number {
    return receipts
      .filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, r) => sum + r.total, 0);
  }

  private toCreateRequest(r: Receipt): CreateReceiptRequest {
    return {
      store: r.store,
      storeShort: r.storeShort ?? this.deriveStoreShort(r.store),
      category: r.category,
      categoryEn: r.categoryEn ?? r.category,
      date: r.date,
      time: this.normalizeTime(r.time),
      total: r.total,
      vat: r.vat,
      payment: r.payment ?? 'Unknown',
      items: r.items.map(i => this.toItemRequest(i)),
      imagePath: r.imageData ?? null,
      householdId: r.householdId ?? null,
    };
  }

  private toItemRequest(i: ReceiptItem): CreateReceiptItemRequest {
    return {
      name: i.name,
      nameEn: i.nameEn ?? i.name,
      qty: i.qty,
      unit: i.unit ?? 'st',
      price: i.price,
      cat: i.cat,
    };
  }

  private deriveStoreShort(store: string): string {
    return store.split(/\s+/)[0].slice(0, 16);
  }

  private normalizeTime(time: string): string {
    // Backend TimeOnly expects HH:mm:ss; frontend stores HH:mm
    return /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  }
}
