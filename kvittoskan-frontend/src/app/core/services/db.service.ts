import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type { Receipt } from '../models/receipt.model';
import type { User } from '../models/user.model';

class KvittoskanDb extends Dexie {
  receipts!: Table<Receipt, number>;
  users!: Table<User, string>;

  constructor() {
    super('kvittoskan');
    this.version(1).stores({
      receipts: '++id, serverId, store, category, date, total, userId, householdId, syncedAt',
      users: 'id, email',
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DbService {
  private db = new KvittoskanDb();

  async getAllReceipts(): Promise<Receipt[]> {
    return this.db.receipts.orderBy('date').reverse().toArray();
  }

  async getReceiptById(id: number): Promise<Receipt | undefined> {
    return this.db.receipts.get(id);
  }

  async addReceipt(receipt: Omit<Receipt, 'id'>): Promise<number> {
    return this.db.receipts.add({
      ...receipt,
      createdAt: new Date().toISOString(),
    });
  }

  async updateReceipt(id: number, changes: Partial<Receipt>): Promise<void> {
    await this.db.receipts.update(id, changes);
  }

  async deleteReceipt(id: number): Promise<void> {
    await this.db.receipts.delete(id);
  }

  async getUnsyncedReceipts(): Promise<Receipt[]> {
    return this.db.receipts.filter(r => !r.syncedAt).toArray();
  }

  async markAsSynced(id: number, serverId: string): Promise<void> {
    await this.db.receipts.update(id, {
      serverId,
      syncedAt: new Date().toISOString(),
    });
  }

  async searchItems(query: string): Promise<Receipt[]> {
    const q = query.toLowerCase();
    return this.db.receipts.filter(r =>
      r.items.some(it =>
        it.name.toLowerCase().includes(q) ||
        (it.nameEn ?? '').toLowerCase().includes(q)
      )
    ).toArray();
  }

  async getReceiptsByCategory(category: string): Promise<Receipt[]> {
    return this.db.receipts
      .where('category').equals(category)
      .reverse()
      .toArray();
  }

  async clear(): Promise<void> {
    await this.db.receipts.clear();
  }
}
