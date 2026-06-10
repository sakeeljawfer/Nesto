import Dexie, { type Table } from 'dexie';
import type { CashEntry, Customer, Delivery, Invoice, Payment, Product, Settings, StockMovement, Supplier } from '../types';
import { createSalt, hashPassword } from './auth';
import { todayISO, uid } from './utils';

class NestoDB extends Dexie {
  products!: Table<Product, string>;
  stockMovements!: Table<StockMovement, string>;
  customers!: Table<Customer, string>;
  invoices!: Table<Invoice, string>;
  payments!: Table<Payment, string>;
  cashEntries!: Table<CashEntry, string>;
  deliveries!: Table<Delivery, string>;
  suppliers!: Table<Supplier, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('nesto_distribution_db');
    this.version(1).stores({
      products: 'id, name, category, supplierName, expiryDate',
      stockMovements: 'id, productId, date, type',
      customers: 'id, shopName, ownerName, area, phone',
      invoices: 'id, invoiceNo, customerId, invoiceDate, dueDate, status',
      payments: 'id, customerId, invoiceId, date, method',
      cashEntries: 'id, type, category, date',
      deliveries: 'id, route, date, status',
      suppliers: 'id, name, contact',
      settings: 'id'
    });
    this.version(2).stores({
      products: 'id, name, category, supplierName, expiryDate',
      stockMovements: 'id, productId, date, type',
      customers: 'id, shopName, ownerName, area, phone',
      invoices: 'id, invoiceNo, customerId, invoiceDate, dueDate, status, createdAt',
      payments: 'id, customerId, invoiceId, date, method',
      cashEntries: 'id, type, category, date',
      deliveries: 'id, route, date, status',
      suppliers: 'id, name, contact',
      settings: 'id'
    });
  }
}

export const db = new NestoDB();

export const seedDatabase = async () => {
  const hasSettings = await db.settings.get('default');
  if (hasSettings) return;

  const salt = createSalt();
  const passwordHash = await hashPassword('admin123', salt);
  const today = todayISO();
  const products: Product[] = [
    { id: uid(), name: 'Aqua Fresh Water 1.5L', category: 'Bottled Water', brand: 'Aqua Fresh', packSize: '12 bottles', costPrice: 1050, sellingPrice: 1320, wholesalePrice: 1260, currentStock: 140, reorderLevel: 40, supplierName: 'Colombo Beverage Supply', createdAt: today },
    { id: uid(), name: 'Mountain Spring 500ml', category: 'Bottled Water', brand: 'Mountain Spring', packSize: '24 bottles', costPrice: 1220, sellingPrice: 1550, wholesalePrice: 1480, currentStock: 38, reorderLevel: 50, supplierName: 'Kandy Drinks Depot', createdAt: today },
    { id: uid(), name: 'Lime Soda 1L', category: 'Soft Drinks', brand: 'Island Pop', packSize: '12 bottles', costPrice: 1800, sellingPrice: 2300, wholesalePrice: 2200, currentStock: 72, reorderLevel: 24, supplierName: 'Colombo Beverage Supply', createdAt: today },
    { id: uid(), name: 'Mango Juice 1L', category: 'Juice', brand: 'Tropical Lanka', packSize: '12 cartons', costPrice: 2400, sellingPrice: 3050, wholesalePrice: 2920, currentStock: 45, reorderLevel: 20, supplierName: 'Fruit Valley Foods', expiryDate: '2026-12-30', createdAt: today }
  ];
  const customers: Customer[] = [
    { id: uid(), shopName: 'Ruwan Mini Mart', ownerName: 'Ruwan Perera', phone: '0771234567', whatsapp: '0771234567', address: 'No 18, Main Street, Gampaha', area: 'Gampaha Route A', creditLimit: 75000, openingBalance: 12500, notes: 'Prefers morning delivery.', createdAt: today },
    { id: uid(), shopName: 'Nimal Stores', ownerName: 'Nimal Fernando', phone: '0719876543', whatsapp: '0719876543', address: 'Market Road, Negombo', area: 'Negombo Route B', creditLimit: 50000, openingBalance: 0, notes: 'Cash customer for soft drinks.', createdAt: today }
  ];
  const suppliers: Supplier[] = [
    { id: uid(), name: 'Colombo Beverage Supply', contact: '0112556677', productsSupplied: 'Water, soda, soft drinks', invoiceTotal: 180000, paidTotal: 120000, notes: 'Weekly delivery.', createdAt: today },
    { id: uid(), name: 'Fruit Valley Foods', contact: '0812223344', productsSupplied: 'Juice cartons', invoiceTotal: 85000, paidTotal: 85000, notes: 'Check expiry dates.', createdAt: today }
  ];

  const invoice: Invoice = {
    id: uid(),
    invoiceNo: 'NESTO-0001',
    customerId: customers[0].id,
    customerName: customers[0].shopName,
    items: [
      { productId: products[0].id, productName: products[0].name, quantity: 5, freeItems: 0, unitPrice: 1260, discount: 0, costPrice: 1050 },
      { productId: products[2].id, productName: products[2].name, quantity: 2, freeItems: 1, unitPrice: 2200, discount: 100, costPrice: 1800 }
    ],
    subtotal: 10700,
    discount: 100,
    deliveryCharge: 500,
    tax: 0,
    total: 11100,
    paidAmount: 6000,
    status: 'partial',
    paymentType: 'partial',
    invoiceDate: today,
    dueDate: today,
    createdAt: new Date().toISOString()
  };

  await db.transaction('rw', [db.products, db.customers, db.suppliers, db.invoices, db.payments, db.cashEntries, db.deliveries, db.stockMovements, db.settings], async () => {
    await db.products.bulkAdd(products);
    await db.customers.bulkAdd(customers);
    await db.suppliers.bulkAdd(suppliers);
    await db.invoices.add(invoice);
    await db.payments.add({ id: uid(), customerId: customers[0].id, customerName: customers[0].shopName, invoiceId: invoice.id, invoiceNo: invoice.invoiceNo, amount: 6000, method: 'cash', reference: 'Seed receipt', date: today, notes: 'Initial partial payment' });
    await db.cashEntries.bulkAdd([
      { id: uid(), type: 'in', category: 'Customer Collection', amount: 6000, date: today, notes: invoice.invoiceNo },
      { id: uid(), type: 'out', category: 'Fuel Expense', amount: 2500, date: today, notes: 'Morning route fuel' }
    ]);
    await db.deliveries.add({ id: uid(), route: 'Gampaha Route A', invoiceIds: [invoice.id], driverName: 'Saman', vehicleNumber: 'WP CAB-4567', status: 'loaded', returnedItems: '', notes: 'Collect balance next visit.', date: today });
    await db.settings.add({ id: 'default', businessName: 'Nesto Water & Beverages', address: 'Colombo Road, Sri Lanka', phone: '077 000 0000', invoicePrefix: 'NESTO', currency: 'LKR', userName: 'admin', passwordHash, salt });
  });
};

export const exportBackup = async () => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  products: await db.products.toArray(),
  stockMovements: await db.stockMovements.toArray(),
  customers: await db.customers.toArray(),
  invoices: await db.invoices.toArray(),
  payments: await db.payments.toArray(),
  cashEntries: await db.cashEntries.toArray(),
  deliveries: await db.deliveries.toArray(),
  suppliers: await db.suppliers.toArray(),
  settings: await db.settings.toArray()
});

export const importBackup = async (backup: Awaited<ReturnType<typeof exportBackup>>) => {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    await db.products.bulkAdd(backup.products ?? []);
    await db.stockMovements.bulkAdd(backup.stockMovements ?? []);
    await db.customers.bulkAdd(backup.customers ?? []);
    await db.invoices.bulkAdd(backup.invoices ?? []);
    await db.payments.bulkAdd(backup.payments ?? []);
    await db.cashEntries.bulkAdd(backup.cashEntries ?? []);
    await db.deliveries.bulkAdd(backup.deliveries ?? []);
    await db.suppliers.bulkAdd(backup.suppliers ?? []);
    await db.settings.bulkAdd(backup.settings ?? []);
  });
};

export const resetLoginCredentials = async () => {
  const current = await db.settings.get('default');
  const salt = createSalt();
  await db.settings.put({
    ...current,
    id: 'default',
    businessName: current?.businessName ?? 'Nesto Water & Beverages',
    address: current?.address ?? 'Colombo Road, Sri Lanka',
    phone: current?.phone ?? '077 000 0000',
    invoicePrefix: current?.invoicePrefix ?? 'NESTO',
    currency: 'LKR',
    userName: 'admin',
    passwordHash: await hashPassword('admin123', salt),
    salt
  });
};
