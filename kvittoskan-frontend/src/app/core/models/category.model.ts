export interface Category {
  key: string;
  sv: string;
  en: string;
  color: string;
  amount?: number;
  count?: number;
}

export interface WeeklyStat {
  week: string;
  amount: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { key: 'groceries', sv: 'Mat & dryck', en: 'Groceries', color: '#7A8F6A' },
  { key: 'home', sv: 'Hem', en: 'Home', color: '#B9A37A' },
  { key: 'health', sv: 'Hälsa', en: 'Health', color: '#8F7A90' },
  { key: 'beverages', sv: 'Dryck', en: 'Beverages', color: '#6E8890' },
  { key: 'transport', sv: 'Transport', en: 'Transport', color: '#A0826B' },
];
