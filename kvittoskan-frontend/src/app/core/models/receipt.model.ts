export interface ReceiptItem {
  id?: number;
  name: string;
  nameEn?: string;
  qty: number;
  unit?: string;
  price: number;
  cat: string;
}

export interface Receipt {
  id?: number;
  serverId?: string;
  store: string;
  storeShort?: string;
  category: string;
  categoryEn?: string;
  date: string;
  time: string;
  total: number;
  vat: number;
  payment?: string;
  items: ReceiptItem[];
  imageData?: string;
  syncedAt?: string;
  createdAt?: string;
  userId?: string;
  householdId?: string;
}

export interface OcrItem {
  name: string;
  price: number;
  confidence: number;
}

export interface OcrResult {
  store: string;
  address?: string;
  orgNr?: string;
  date?: string;
  time?: string;
  total?: number;
  items: OcrItem[];
}
