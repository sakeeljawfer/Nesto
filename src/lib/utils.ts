import type { Invoice, Payment } from '../types';

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const money = (value: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2
  })
    .format(Number.isFinite(value) ? value : 0)
    .replace('LKR', 'Rs.');

export const toCSV = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
};

export const downloadText = (fileName: string, content: string, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const customerOutstanding = (customerId: string, invoices: Invoice[], payments: Payment[], opening = 0) => {
  const invoiceDebt = invoices.filter((i) => i.customerId === customerId).reduce((sum, i) => sum + i.total - i.paidAmount, 0);
  const unlinkedPayments = payments
    .filter((p) => p.customerId === customerId && !p.invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
  return opening + invoiceDebt - unlinkedPayments;
};

export const invoiceStatus = (total: number, paidAmount: number) => {
  if (paidAmount >= total) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'unpaid';
};

export const whatsappNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('94')) return digits;
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  return digits;
};

export const openWhatsApp = (phone: string, message: string) => {
  const number = whatsappNumber(phone);
  const url = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const daysBetween = (date: string, compare = todayISO()) => {
  const start = new Date(`${date}T00:00:00`).getTime();
  const end = new Date(`${compare}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.floor((end - start) / 86_400_000);
};
