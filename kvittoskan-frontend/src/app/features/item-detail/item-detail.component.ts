import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@shared/components/icon/icon.component';
import { KrComponent } from '@shared/components/kr/kr.component';
import { StoreMarkComponent } from '@shared/components/store-mark/store-mark.component';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { LangService } from '@core/services/lang.service';

interface Purchase {
  store: string;
  date: string;
  price: number;
  category: string;
  receiptId: number;
}

const ALL_PURCHASES: Record<string, Purchase[]> = {
  'Kaffe Zoégas 450g': [
    { store: 'ICA Maxi', date: '2026-04-22', price: 89.00, category: 'Mat & dryck', receiptId: 1 },
    { store: 'Coop', date: '2026-04-10', price: 89.00, category: 'Mat & dryck', receiptId: 7 },
  ],
  'Coffee Zoégas 450g': [
    { store: 'ICA Maxi', date: '2026-04-22', price: 89.00, category: 'Groceries', receiptId: 1 },
    { store: 'Coop', date: '2026-04-10', price: 89.00, category: 'Groceries', receiptId: 7 },
  ],
  'Mellanmjölk Arla 1.5L': [
    { store: 'ICA Maxi', date: '2026-04-22', price: 19.50, category: 'Mat & dryck', receiptId: 1 },
  ],
  'Milk Arla 1.5L': [
    { store: 'ICA Maxi', date: '2026-04-22', price: 19.50, category: 'Groceries', receiptId: 1 },
  ],
};

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, IconComponent, KrComponent, StoreMarkComponent, FormatDatePipe],
  templateUrl: './item-detail.component.html',
  styleUrl: './item-detail.component.scss',
})
export class ItemDetailComponent implements OnInit {
  protected readonly lang = inject(LangService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  itemName = signal('');
  purchases = signal<Purchase[]>([]);

  totalSpent = computed(() => this.purchases().reduce((s, p) => s + p.price, 0));
  avgPrice = computed(() => {
    const ps = this.purchases();
    return ps.length ? this.totalSpent() / ps.length : 0;
  });
  minPrice = computed(() => this.purchases().length ? Math.min(...this.purchases().map(p => p.price)) : 0);
  minStore = computed(() => {
    const min = this.minPrice();
    return this.purchases().find(p => p.price === min)?.store ?? '';
  });
  maxPrice = computed(() => this.purchases().length ? Math.max(...this.purchases().map(p => p.price)) : 0);
  uniqueStores = computed(() => new Set(this.purchases().map(p => p.store)).size);

  ngOnInit(): void {
    const name = this.route.snapshot.queryParamMap.get('name') ?? '';
    this.itemName.set(name);

    const data = ALL_PURCHASES[name] ?? [
      { store: 'ICA Maxi', date: '2026-04-22', price: 89.00, category: 'Mat & dryck', receiptId: 1 },
      { store: 'Coop', date: '2026-04-10', price: 89.00, category: 'Mat & dryck', receiptId: 7 },
    ];
    this.purchases.set(data);
  }

  barHeight(price: number): number {
    const max = this.maxPrice();
    return max > 0 ? Math.max(8, (price / max) * 72) : 8;
  }

  dayLabel(date: string): string {
    return new Date(date).getDate().toString();
  }

  goToReceipt(id: number): void {
    this.router.navigate(['/receipt', id]);
  }

  back(): void {
    this.router.navigate(['/search']);
  }
}
