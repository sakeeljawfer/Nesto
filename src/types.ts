export type ID = string;

export type PaymentMethod = 'cash' | 'bank' | 'cheque' | 'online';
export type InvoiceStatus = 'paid' | 'partial' | 'unpaid';
export type DeliveryStatus = 'pending' | 'loaded' | 'delivered' | 'failed' | 'returned';
export type CashType = 'in' | 'out';

export interface Product {
  id: ID;
  name: string;
  category: string;
  brand: string;
  packSize: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  currentStock: number;
  reorderLevel: number;
  supplierName: string;
  expiryDate?: string;
  createdAt: string;
}

export interface StockMovement {
  id: ID;
  productId: ID;
  type: 'in' | 'out' | 'return' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
}

export interface Customer {
  id: ID;
  shopName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  area: string;
  creditLimit: number;
  openingBalance: number;
  notes: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: ID;
  productName: string;
  quantity: number;
  freeItems: number;
  unitPrice: number;
  discount: number;
  costPrice: number;
}

export interface Invoice {
  id: ID;
  invoiceNo: string;
  customerId: ID;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  paymentType: 'cash' | 'credit' | 'partial';
  invoiceDate: string;
  dueDate: string;
  createdAt: string;
}

export interface Payment {
  id: ID;
  customerId: ID;
  customerName: string;
  invoiceId?: ID;
  invoiceNo?: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: string;
  notes: string;
}

export interface CashEntry {
  id: ID;
  type: CashType;
  category: string;
  amount: number;
  date: string;
  notes: string;
}

export interface Delivery {
  id: ID;
  route: string;
  invoiceIds: ID[];
  driverName: string;
  vehicleNumber: string;
  status: DeliveryStatus;
  returnedItems: string;
  notes: string;
  date: string;
}

export interface Supplier {
  id: ID;
  name: string;
  contact: string;
  productsSupplied: string;
  invoiceTotal: number;
  paidTotal: number;
  notes: string;
  createdAt: string;
}

export interface Settings {
  id: 'default';
  businessName: string;
  logoDataUrl?: string;
  address: string;
  phone: string;
  invoicePrefix: string;
  currency: 'LKR';
  userName: string;
  passwordHash: string;
  salt: string;
}
