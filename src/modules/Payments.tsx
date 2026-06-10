import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Printer } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Field, inputClass, Modal, TableShell, td, th } from '../components/ui';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { invoiceStatus, money, todayISO, uid } from '../lib/utils';
import type { Customer, Invoice, PaymentMethod } from '../types';

export const Payments = () => {
  const data = useLiveQuery(async () => ({ payments: await db.payments.orderBy('date').reverse().toArray(), customers: await db.customers.toArray(), invoices: await db.invoices.toArray() }), []);
  const [open, setOpen] = useState(false);
  const { notify } = useToast();
  const printReceipt = (id: string) => {
    const payment = data?.payments.find((p) => p.id === id);
    if (!payment) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<h1>Payment Receipt</h1><p>${payment.customerName}</p><p>${payment.date}</p><h2>${money(payment.amount)}</h2><p>${payment.method} ${payment.reference}</p>`);
    w.document.close();
    w.print();
  };
  return <div className="grid gap-5"><Card><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Customer payments</h2><p className="text-sm text-slate-500">Record cash, bank transfer, cheque, and online payments.</p></div><Button className="w-full sm:w-auto" onClick={() => setOpen(true)}><Plus size={18} />Record payment</Button></div></Card><TableShell><table className="w-full"><thead><tr><th className={th}>Date</th><th className={th}>Customer</th><th className={th}>Invoice</th><th className={th}>Amount</th><th className={th}>Method</th><th className={th}>Actions</th></tr></thead><tbody>{(data?.payments ?? []).map((p) => <tr key={p.id}><td className={td}>{p.date}</td><td className={td}>{p.customerName}</td><td className={td}>{p.invoiceNo ?? 'General credit'}</td><td className={td}>{money(p.amount)}</td><td className={td}><Badge tone="blue">{p.method}</Badge></td><td className={td}><Button variant="secondary" onClick={() => printReceipt(p.id)}><Printer size={16} />Receipt</Button></td></tr>)}</tbody></table></TableShell>{open && data && <PaymentModal data={data} onClose={() => setOpen(false)} onSaved={() => { notify('Payment recorded'); setOpen(false); }} />}</div>;
};

const PaymentModal = ({ data, onClose, onSaved }: { data: { customers: Customer[]; invoices: Invoice[] }; onClose: () => void; onSaved: () => void }) => {
  const [customerId, setCustomerId] = useState(data.customers[0]?.id ?? '');
  const customerInvoices = data.invoices.filter((i) => i.customerId === customerId && i.status !== 'paid');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const save = async () => {
    const customer = data.customers.find((c) => c.id === customerId);
    const invoice = data.invoices.find((i) => i.id === invoiceId);
    if (!customer || amount <= 0) return;
    await db.transaction('rw', db.payments, db.invoices, db.cashEntries, async () => {
      await db.payments.add({ id: uid(), customerId: customer.id, customerName: customer.shopName, invoiceId: invoice?.id, invoiceNo: invoice?.invoiceNo, amount, method, reference, date: todayISO(), notes: '' });
      if (invoice) {
        const paidAmount = Math.min(invoice.total, invoice.paidAmount + amount);
        await db.invoices.update(invoice.id, { paidAmount, status: invoiceStatus(invoice.total, paidAmount) });
      }
      if (method === 'cash') await db.cashEntries.add({ id: uid(), type: 'in', category: 'Customer Collection', amount, date: todayISO(), notes: invoice?.invoiceNo ?? customer.shopName });
    });
    onSaved();
  };
  return <Modal title="Record payment" onClose={onClose}><div className="grid gap-4 md:grid-cols-2"><Field label="Customer"><select className={inputClass} value={customerId} onChange={(e) => { setCustomerId(e.target.value); setInvoiceId(''); }}>{data.customers.map((c) => <option key={c.id} value={c.id}>{c.shopName}</option>)}</select></Field><Field label="Link payment to invoice"><select className={inputClass} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}><option value="">General customer payment</option>{customerInvoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNo} balance {money(i.total - i.paidAmount)}</option>)}</select></Field><Field label="Amount"><input className={inputClass} type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field><Field label="Payment method"><select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}><option value="cash">Cash</option><option value="bank">Bank transfer</option><option value="cheque">Cheque</option><option value="online">Online payment</option></select></Field><Field label="Reference"><input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} /></Field><div className="grid gap-2 sm:flex sm:items-end sm:justify-end"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save payment</Button></div></div></Modal>;
};
