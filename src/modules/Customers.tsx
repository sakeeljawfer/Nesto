import { useLiveQuery } from 'dexie-react-hooks';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Field, inputClass, Modal, TableShell, td, th } from '../components/ui';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { customerOutstanding, money, openWhatsApp, uid } from '../lib/utils';
import type { Customer } from '../types';

const blank = (): Customer => ({ id: uid(), shopName: '', ownerName: '', phone: '', whatsapp: '', address: '', area: '', creditLimit: 0, openingBalance: 0, notes: '', createdAt: new Date().toISOString() });

export const Customers = () => {
  const data = useLiveQuery(async () => ({ customers: await db.customers.toArray(), invoices: await db.invoices.toArray(), payments: await db.payments.toArray() }), []);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const { notify } = useToast();
  const customers = (data?.customers ?? []).filter((c) => `${c.shopName} ${c.ownerName} ${c.area} ${c.phone}`.toLowerCase().includes(query.toLowerCase()));
  const save = async (customer: Customer) => { await db.customers.put(customer); notify('Customer saved'); setEditing(null); };
  const remind = (customer: Customer) => {
    const outstanding = customerOutstanding(customer.id, data?.invoices ?? [], data?.payments ?? [], customer.openingBalance);
    const message = [
      `Dear ${customer.ownerName || customer.shopName},`,
      `This is a friendly reminder from Nesto Water & Beverages.`,
      `Your current credit balance is ${money(outstanding)}.`,
      'Please arrange payment at your earliest convenience.',
      'Thank you.'
    ].join('\n');
    openWhatsApp(customer.whatsapp || customer.phone, message);
  };
  return <div className="grid gap-5"><Card><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className={`${inputClass} w-full pl-10`} placeholder="Search shops, owners, routes" value={query} onChange={(e) => setQuery(e.target.value)} /></div><Button onClick={() => setEditing(blank())}><Plus size={18} />Add customer</Button></div></Card><TableShell><table className="w-full"><thead><tr><th className={th}>Shop</th><th className={th}>Contact</th><th className={th}>Route</th><th className={th}>Credit</th><th className={th}>Outstanding</th><th className={th}>Actions</th></tr></thead><tbody>{customers.map((c) => { const outstanding = customerOutstanding(c.id, data?.invoices ?? [], data?.payments ?? [], c.openingBalance); return <tr key={c.id}><td className={td}><strong className="block text-slate-950">{c.shopName}</strong><span>{c.ownerName}</span></td><td className={td}>{c.phone}<br />WhatsApp {c.whatsapp}</td><td className={td}>{c.area}</td><td className={td}>{money(c.creditLimit)}</td><td className={td}>{money(outstanding)}</td><td className={td}><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setEditing(c)}>Edit / history</Button><Button variant="ghost" onClick={() => remind(c)} disabled={outstanding <= 0}><MessageCircle size={16} />Remind</Button></div></td></tr>; })}</tbody></table></TableShell>{editing && <CustomerModal customer={editing} onClose={() => setEditing(null)} onSave={save} invoices={data?.invoices ?? []} />}</div>;
};

const CustomerModal = ({ customer, onClose, onSave, invoices }: { customer: Customer; onClose: () => void; onSave: (customer: Customer) => void; invoices: { id: string; invoiceNo: string; total: number; status: string; customerId: string }[] }) => {
  const [form, setForm] = useState(customer);
  const patch = (key: keyof Customer, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  return <Modal title="Customer details" onClose={onClose}><form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>{(['shopName:Shop name','ownerName:Owner name','phone:Phone number','whatsapp:WhatsApp number','area:Area / route','address:Address'] as const).map((pair) => { const [key, label] = pair.split(':') as [keyof Customer, string]; return <Field key={key} label={label}><input className={inputClass} value={String(form[key])} onChange={(e) => patch(key, e.target.value)} required /></Field>; })}<Field label="Credit limit"><input className={inputClass} type="number" value={form.creditLimit} onChange={(e) => patch('creditLimit', Number(e.target.value))} /></Field><Field label="Opening balance"><input className={inputClass} type="number" value={form.openingBalance} onChange={(e) => patch('openingBalance', Number(e.target.value))} /></Field><Field label="Customer notes"><textarea className={inputClass} value={form.notes} onChange={(e) => patch('notes', e.target.value)} /></Field><div className="md:col-span-2"><h3 className="mb-2 font-bold">Purchase history</h3><div className="grid gap-2">{invoices.filter((i) => i.customerId === customer.id).slice(0, 5).map((i) => <div key={i.id} className="flex justify-between rounded-md bg-slate-50 p-3 text-sm"><span>{i.invoiceNo}</span><span>{money(i.total)} / {i.status}</span></div>)}</div></div><div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save customer</Button></div></form></Modal>;
};
