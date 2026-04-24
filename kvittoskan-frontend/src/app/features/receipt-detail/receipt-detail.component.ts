import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';
import { KrComponent } from '@shared/components/kr/kr.component';
import { BtnComponent } from '@shared/components/btn/btn.component';
import { ChipComponent } from '@shared/components/chip/chip.component';
import { StoreMarkComponent } from '@shared/components/store-mark/store-mark.component';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { LangService } from '@core/services/lang.service';
import { ReceiptService } from '@core/services/receipt.service';
import type { Receipt } from '@core/models/receipt.model';

const FALLBACK: Receipt = {
  id: 1, store: 'ICA Maxi', storeShort: 'ICA', category: 'Mat & dryck', categoryEn: 'Groceries',
  date: '2026-04-22', time: '17:42', total: 847.50, vat: 68.42, payment: 'Mastercard •• 4471',
  items: [
    { name: 'Havregryn Kungsörnen 1kg', nameEn: 'Oats Kungsörnen 1kg', qty: 1, price: 24.90, cat: 'Torrvaror' },
    { name: 'Mellanmjölk Arla 1.5L', nameEn: 'Milk Arla 1.5L', qty: 2, price: 19.50, cat: 'Mejeri' },
    { name: 'Bananer ekologiska', nameEn: 'Bananas organic', qty: 1.24, unit: 'kg', price: 28.00, cat: 'Frukt' },
    { name: 'Kaffe Zoégas 450g', nameEn: 'Coffee Zoégas 450g', qty: 1, price: 89.00, cat: 'Dryck' },
    { name: 'Laxfilé 400g', nameEn: 'Salmon fillet 400g', qty: 1, price: 129.00, cat: 'Fisk' },
    { name: 'Avokado', nameEn: 'Avocado', qty: 3, price: 13.90, cat: 'Frukt' },
    { name: 'Surdegsbröd', nameEn: 'Sourdough bread', qty: 1, price: 42.50, cat: 'Bröd' },
    { name: 'Ägg Bjäre 15-pack', nameEn: 'Eggs Bjäre 15-pack', qty: 1, price: 64.90, cat: 'Mejeri' },
  ],
};

@Component({
  selector: 'app-receipt-detail',
  standalone: true,
  imports: [CommonModule, IconComponent, KrComponent, BtnComponent, ChipComponent, StoreMarkComponent, FormatDatePipe],
  templateUrl: './receipt-detail.component.html',
  styleUrl: './receipt-detail.component.scss',
})
export class ReceiptDetailComponent implements OnInit {
  protected readonly lang = inject(LangService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly receiptService = inject(ReceiptService);

  receipt = signal<Receipt>(FALLBACK);

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      const r = await this.receiptService.getById(id);
      if (r) this.receipt.set(r);
    }
  }

  itemTotal(item: Receipt['items'][number]): number {
    if (item.unit) return item.price * item.qty;
    return item.price;
  }

  itemQtyLabel(item: Receipt['items'][number]): string {
    if (item.unit) return `${item.qty} ${item.unit}`;
    return item.qty > 1 ? `${item.qty}×` : '1×';
  }

  itemName(item: Receipt['items'][number]): string {
    return this.lang.lang() === 'sv' ? item.name : (item.nameEn ?? item.name);
  }

  categoryLabel(): string {
    const r = this.receipt();
    return this.lang.lang() === 'sv' ? r.category : (r.categoryEn ?? r.category);
  }

  back(): void {
    this.router.navigate(['/home']);
  }
}
