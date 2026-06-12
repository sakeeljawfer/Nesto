import { useLiveQuery } from 'dexie-react-hooks';
import { Download, MessageCircle, Plus, Printer, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, Field, inputClass, Modal, TableShell, td, th } from '../components/ui';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { invoiceStatus, money, openWhatsApp, todayISO, uid } from '../lib/utils';
import type { Customer, Invoice, InvoiceItem, Product, Settings } from '../types';

type DraftItem = InvoiceItem & { lineId: string };

export const Invoices = () => {
  const data = useLiveQuery(async () => ({ invoices: await db.invoices.orderBy('createdAt').reverse().toArray(), customers: await db.customers.toArray(), products: await db.products.toArray(), settings: await db.settings.get('default') }), []);
  const [creating, setCreating] = useState(false);
  const { notify } = useToast();
  const printInvoice = (invoice: Invoice) => {
    const html = invoiceHtml(invoice, data?.settings);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };
  const pdfInvoice = (invoice: Invoice) => {
    const pdf = new jsPDF();
    const business = data?.settings?.businessName ?? 'Nesto Water & Beverages';
    if (data?.settings?.logoDataUrl) pdf.addImage(data.settings.logoDataUrl, 14, 10, 22, 22);
    pdf.setFontSize(16);
    pdf.text(business, data?.settings?.logoDataUrl ? 42 : 14, 18);
    pdf.setFontSize(9);
    pdf.text(data?.settings?.address ?? '', data?.settings?.logoDataUrl ? 42 : 14, 25);
    pdf.text(`Phone: ${data?.settings?.phone ?? ''}`, data?.settings?.logoDataUrl ? 42 : 14, 31);
    pdf.setFontSize(18);
    pdf.text('INVOICE', 160, 18);
    pdf.setFontSize(10);
    pdf.text(invoice.invoiceNo, 160, 26);
    pdf.text(`Date: ${invoice.invoiceDate}`, 14, 45);
    pdf.text(`Due: ${invoice.dueDate}`, 70, 45);
    pdf.text(`Customer: ${invoice.customerName}`, 14, 55);
    let y = 72;
    pdf.setFontSize(9);
    pdf.text('Item', 14, y);
    pdf.text('Qty', 105, y);
    pdf.text('Free', 123, y);
    pdf.text('Price', 142, y);
    pdf.text('Amount', 170, y);
    y += 8;
    invoice.items.forEach((item) => {
      pdf.text(item.productName.slice(0, 42), 14, y);
      pdf.text(String(item.quantity), 107, y);
      pdf.text(String(item.freeItems), 126, y);
      pdf.text(money(item.unitPrice), 142, y);
      pdf.text(money(item.quantity * item.unitPrice - item.discount), 170, y);
      y += 8;
    });
    y += 8;
    pdf.text(`Subtotal: ${money(invoice.subtotal)}`, 140, y);
    pdf.text(`Delivery: ${money(invoice.deliveryCharge)}`, 140, y + 8);
    pdf.text(`Tax: ${money(invoice.tax)}`, 140, y + 16);
    pdf.setFontSize(13);
    pdf.text(`Total: ${money(invoice.total)}`, 140, y + 28);
    pdf.setFontSize(10);
    pdf.text(`Paid: ${money(invoice.paidAmount)}`, 140, y + 38);
    pdf.text(`Balance: ${money(invoice.total - invoice.paidAmount)}`, 140, y + 46);
    pdf.text('Prepared by', 14, 270);
    pdf.text('Customer signature', 140, 270);
    pdf.save(`${invoice.invoiceNo}.pdf`);
  };
  const shareInvoice = (invoice: Invoice) => {
    const customer = data?.customers.find((c) => c.id === invoice.customerId);
    const business = data?.settings?.businessName ?? 'Nesto Water & Beverages';
    const balance = invoice.total - invoice.paidAmount;
    const message = [
      `Invoice from ${business}`,
      `Invoice No: ${invoice.invoiceNo}`,
      `Date: ${invoice.invoiceDate}`,
      `Total: ${money(invoice.total)}`,
      `Paid: ${money(invoice.paidAmount)}`,
      `Balance: ${money(balance)}`,
      balance > 0 ? `Please settle the balance before ${invoice.dueDate}.` : 'Thank you. This invoice is fully paid.'
    ].join('\n');
    openWhatsApp(customer?.whatsapp || customer?.phone || '', message);
  };
  return <div className="grid gap-5"><Card><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Invoices</h2><p className="text-sm text-slate-500">Create cash, credit, and partial payment invoices.</p></div><Button className="w-full sm:w-auto" onClick={() => setCreating(true)}><Plus size={18} />Create invoice</Button></div></Card><TableShell><table className="w-full"><thead><tr><th className={th}>Invoice</th><th className={th}>Customer</th><th className={th}>Date</th><th className={th}>Total</th><th className={th}>Paid</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead><tbody>{(data?.invoices ?? []).map((i) => <tr key={i.id}><td className={td}>{i.invoiceNo}</td><td className={td}>{i.customerName}</td><td className={td}>{i.invoiceDate}<br />Due {i.dueDate}</td><td className={td}>{money(i.total)}</td><td className={td}>{money(i.paidAmount)}</td><td className={td}><Badge tone={i.status === 'paid' ? 'green' : i.status === 'partial' ? 'amber' : 'red'}>{i.status}</Badge></td><td className={td}><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => printInvoice(i)}><Printer size={16} />Print</Button><Button variant="ghost" onClick={() => pdfInvoice(i)}><Download size={16} />PDF</Button><Button variant="ghost" onClick={() => shareInvoice(i)}><MessageCircle size={16} />WhatsApp</Button></div></td></tr>)}</tbody></table></TableShell>{creating && data && <InvoiceModal data={data} onClose={() => setCreating(false)} onSaved={() => { notify('Invoice created'); setCreating(false); }} />}</div>;
};

const InvoiceModal = ({ data, onClose, onSaved }: { data: { invoices: Invoice[]; customers: Customer[]; products: Product[]; settings?: Settings }; onClose: () => void; onSaved: () => void }) => {
  const prefix = data.settings?.invoicePrefix ?? 'INV';
  const nextNo = `${prefix}-${String(data.invoices.length + 1).padStart(4, '0')}`;
  const [customerId, setCustomerId] = useState(data.customers[0]?.id ?? '');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [dueDate, setDueDate] = useState(todayISO());
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discount, 0);
    return { subtotal, total: subtotal + deliveryCharge + tax };
  }, [items, deliveryCharge, tax]);
  const addItem = (productId: string) => {
    const product = data.products.find((p) => p.id === productId);
    if (!product) return;
    setItems((list) => [...list, { lineId: uid(), productId: product.id, productName: product.name, quantity: 1, freeItems: 0, unitPrice: product.wholesalePrice, discount: 0, costPrice: product.costPrice }]);
  };
  const updateItem = (lineId: string, patch: Partial<DraftItem>) => {
    setItems((list) => list.map((item) => item.lineId === lineId ? { ...item, ...patch } : item));
  };
  const save = async () => {
    const customer = data.customers.find((c) => c.id === customerId);
    if (!customer || !items.length) return;
    const paid = Math.min(paidAmount, totals.total);
    const invoice: Invoice = { id: uid(), invoiceNo: nextNo, customerId: customer.id, customerName: customer.shopName, items: items.map(({ lineId: _lineId, ...item }) => item), subtotal: totals.subtotal, discount: items.reduce((s, i) => s + i.discount, 0), deliveryCharge, tax, total: totals.total, paidAmount: paid, status: invoiceStatus(totals.total, paid), paymentType: paid >= totals.total ? 'cash' : paid > 0 ? 'partial' : 'credit', invoiceDate: todayISO(), dueDate, createdAt: new Date().toISOString() };
    await db.transaction('rw', [db.invoices, db.products, db.stockMovements, db.payments, db.cashEntries], async () => {
      await db.invoices.add(invoice);
      for (const item of items) {
        const product = data.products.find((p) => p.id === item.productId);
        if (product) {
          const quantityOut = item.quantity + item.freeItems;
          await db.products.update(product.id, { currentStock: Math.max(0, product.currentStock - quantityOut) });
          await db.stockMovements.add({ id: uid(), productId: product.id, type: 'out', quantity: quantityOut, reason: invoice.invoiceNo, date: todayISO() });
        }
      }
      if (paid > 0) {
        await db.payments.add({ id: uid(), customerId: customer.id, customerName: customer.shopName, invoiceId: invoice.id, invoiceNo: invoice.invoiceNo, amount: paid, method: 'cash', reference: invoice.invoiceNo, date: todayISO(), notes: 'Invoice payment' });
        await db.cashEntries.add({ id: uid(), type: 'in', category: 'Invoice Payment', amount: paid, date: todayISO(), notes: invoice.invoiceNo });
      }
    });
    onSaved();
  };
  return <Modal title="Create invoice" onClose={onClose} className="sm:max-w-5xl"><div className="grid gap-5"><div className="grid gap-4 md:grid-cols-3"><Field label="Customer"><select className={inputClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>{data.customers.map((c) => <option key={c.id} value={c.id}>{c.shopName}</option>)}</select></Field><Field label="Due date"><input className={inputClass} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field><Field label="Add product"><select className={inputClass} onChange={(e) => { addItem(e.target.value); e.currentTarget.value = ''; }} defaultValue=""><option value="" disabled>Select product</option>{data.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field></div><div className="grid gap-3">{items.length ? items.map((item) => <div key={item.lineId} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60"><div className="mb-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-bold text-slate-950">{item.productName}</p><p className="mt-1 text-xs text-slate-500">Line total {money(item.quantity * item.unitPrice - item.discount)}</p></div><Button variant="ghost" className="h-9 w-9 shrink-0 p-0 text-red-600 hover:bg-red-50" onClick={() => setItems((list) => list.filter((x) => x.lineId !== item.lineId))} aria-label={`Remove ${item.productName}`}><Trash2 size={17} /></Button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(90px,1fr)_minmax(90px,1fr)_minmax(140px,1.25fr)_minmax(120px,1fr)_minmax(120px,0.9fr)]"><Field label="Qty"><input className={inputClass} type="number" min="0" inputMode="decimal" value={item.quantity} onChange={(e) => updateItem(item.lineId, { quantity: Number(e.target.value) })} /></Field><Field label="Free qty"><input className={inputClass} type="number" min="0" inputMode="decimal" value={item.freeItems} onChange={(e) => updateItem(item.lineId, { freeItems: Number(e.target.value) })} /></Field><Field label="Unit price"><input className={inputClass} type="number" min="0" inputMode="decimal" value={item.unitPrice} onChange={(e) => updateItem(item.lineId, { unitPrice: Number(e.target.value) })} /></Field><Field label="Discount"><input className={inputClass} type="number" min="0" inputMode="decimal" value={item.discount} onChange={(e) => updateItem(item.lineId, { discount: Number(e.target.value) })} /></Field><div className="rounded-md bg-slate-50 px-3 py-2 sm:col-span-2 lg:col-span-1"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Line total</p><p className="mt-1 text-base font-bold text-slate-950">{money(item.quantity * item.unitPrice - item.discount)}</p></div></div></div>) : <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500">Select a product to start adding invoice items.</div>}</div><div className="grid gap-4 md:grid-cols-3"><Field label="Transport / delivery charge"><input className={inputClass} type="number" min="0" inputMode="decimal" value={deliveryCharge} onChange={(e) => setDeliveryCharge(Number(e.target.value))} /></Field><Field label="Tax optional"><input className={inputClass} type="number" min="0" inputMode="decimal" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></Field><Field label="Cash / partial payment"><input className={inputClass} type="number" min="0" inputMode="decimal" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} /></Field></div><div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:flex sm:items-center sm:justify-between"><div><p className="text-sm text-slate-500">{nextNo}</p><p className="text-2xl font-bold">{money(totals.total)}</p></div><div className="grid gap-2 sm:flex"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!items.length || !customerId}>Save invoice</Button></div></div></div></Modal>;
};

const invoiceHtml = (invoice: Invoice, settings?: Settings) => {
  const business = settings?.businessName ?? 'Nesto Water & Beverages';
  const status = invoice.status.toUpperCase();
  return `<!doctype html>
<html>
<head>
  <title>${invoice.invoiceNo}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif}
    main{max-width:820px;margin:24px auto;background:white;padding:34px;border:1px solid #e2e8f0}
    .top{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #0f766e;padding-bottom:20px}
    .brand{display:flex;gap:14px;align-items:flex-start}
    .logo{width:72px;height:72px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px}
    .placeholder{display:grid;place-items:center;background:#0f766e;color:white;font-weight:800;font-size:26px}
    h1,h2,h3,p{margin:0}
    h1{font-size:24px}
    .muted{color:#64748b;font-size:13px;line-height:1.55}
    .invoice-title{text-align:right}
    .invoice-title h2{font-size:32px;letter-spacing:2px}
    .badge{display:inline-block;margin-top:8px;border-radius:999px;background:${invoice.status === 'paid' ? '#dcfce7;color:#166534' : invoice.status === 'partial' ? '#fef3c7;color:#92400e' : '#fee2e2;color:#991b1b'};padding:6px 12px;font-size:12px;font-weight:800}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:22px 0}
    .box{border:1px solid #e2e8f0;border-radius:8px;padding:14px}
    .label{font-size:11px;color:#64748b;text-transform:uppercase;font-weight:800;margin-bottom:6px}
    table{width:100%;border-collapse:collapse;margin-top:18px}
    th{background:#f1f5f9;color:#475569;font-size:11px;text-transform:uppercase;text-align:left;padding:10px;border-bottom:1px solid #e2e8f0}
    td{padding:11px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;vertical-align:top}
    .right{text-align:right}
    .totals{display:grid;grid-template-columns:1fr 280px;gap:20px;margin-top:18px}
    .summary{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
    .summary div{display:flex;justify-content:space-between;padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
    .summary div:last-child{border-bottom:0;background:#0f766e;color:white;font-size:18px;font-weight:800}
    .terms{font-size:12px;color:#64748b;line-height:1.6}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:54px}
    .line{border-top:1px solid #94a3b8;padding-top:8px;font-size:12px;color:#475569;text-align:center}
    .footer{margin-top:28px;text-align:center;font-size:11px;color:#64748b}
    @media print{body{background:white}main{margin:0 auto;border:0;padding:20px}.no-print{display:none}@page{size:A4;margin:12mm}}
  </style>
</head>
<body>
<main>
  <section class="top">
    <div class="brand">
      ${settings?.logoDataUrl ? `<img class="logo" src="${settings.logoDataUrl}" alt="Logo"/>` : `<div class="logo placeholder">${business.slice(0, 1)}</div>`}
      <div>
        <h1>${business}</h1>
        <p class="muted">${settings?.address ?? 'Colombo Road, Sri Lanka'}<br/>Phone: ${settings?.phone ?? ''}<br/>Currency: LKR</p>
      </div>
    </div>
    <div class="invoice-title">
      <h2>INVOICE</h2>
      <p><strong>${invoice.invoiceNo}</strong></p>
      <span class="badge">${status}</span>
    </div>
  </section>
  <section class="grid">
    <div class="box">
      <p class="label">Bill to</p>
      <h3>${invoice.customerName}</h3>
      <p class="muted">Customer account invoice</p>
    </div>
    <div class="box">
      <p class="label">Invoice details</p>
      <p><strong>Invoice date:</strong> ${invoice.invoiceDate}</p>
      <p><strong>Due date:</strong> ${invoice.dueDate}</p>
      <p><strong>Payment type:</strong> ${invoice.paymentType}</p>
    </div>
  </section>
  <table>
    <thead>
      <tr><th>Product</th><th class="right">Qty</th><th class="right">Free</th><th class="right">Unit price</th><th class="right">Discount</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>
      ${invoice.items.map((item) => `<tr><td><strong>${item.productName}</strong></td><td class="right">${item.quantity}</td><td class="right">${item.freeItems}</td><td class="right">${money(item.unitPrice)}</td><td class="right">${money(item.discount)}</td><td class="right">${money(item.quantity * item.unitPrice - item.discount)}</td></tr>`).join('')}
    </tbody>
  </table>
  <section class="totals">
    <div class="terms">
      <strong>Notes</strong><br/>
      Please check quantities at delivery. Goods once accepted are considered received in good condition. Keep this invoice for payment and delivery reference.
    </div>
    <div class="summary">
      <div><span>Subtotal</span><strong>${money(invoice.subtotal)}</strong></div>
      <div><span>Item discount</span><strong>${money(invoice.discount)}</strong></div>
      <div><span>Delivery charge</span><strong>${money(invoice.deliveryCharge)}</strong></div>
      <div><span>Tax</span><strong>${money(invoice.tax)}</strong></div>
      <div><span>Paid</span><strong>${money(invoice.paidAmount)}</strong></div>
      <div><span>Balance</span><strong>${money(invoice.total - invoice.paidAmount)}</strong></div>
      <div><span>Total</span><strong>${money(invoice.total)}</strong></div>
    </div>
  </section>
  <section class="signatures">
    <div class="line">Prepared by</div>
    <div class="line">Customer signature / stamp</div>
  </section>
  <p class="footer">Thank you for your business.<br/>Powered by Axendigital Pvt Ltd</p>
</main>
</body>
</html>`;
};
