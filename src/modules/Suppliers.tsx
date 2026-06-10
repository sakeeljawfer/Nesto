import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Field, inputClass, Modal, TableShell, td, th } from '../components/ui';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { money, uid } from '../lib/utils';
import type { Supplier } from '../types';

const blank = (): Supplier => ({ id: uid(), name: '', contact: '', productsSupplied: '', invoiceTotal: 0, paidTotal: 0, notes: '', createdAt: new Date().toISOString() });

export const Suppliers = () => {
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const { notify } = useToast();
  const save = async (supplier: Supplier) => { await db.suppliers.put(supplier); notify('Supplier saved'); setEditing(null); };
  return <div className="grid gap-5"><Card><div className="flex items-center justify-between"><div><h2 className="font-bold">Supplier records</h2><p className="text-sm text-slate-500">Track invoices, payments, and payable balance.</p></div><Button onClick={() => setEditing(blank())}><Plus size={18} />Add supplier</Button></div></Card><TableShell><table className="w-full"><thead><tr><th className={th}>Supplier</th><th className={th}>Products</th><th className={th}>Invoices</th><th className={th}>Paid</th><th className={th}>Payable</th><th className={th}>Actions</th></tr></thead><tbody>{(suppliers ?? []).map((s) => <tr key={s.id}><td className={td}><strong>{s.name}</strong><br />{s.contact}</td><td className={td}>{s.productsSupplied}</td><td className={td}>{money(s.invoiceTotal)}</td><td className={td}>{money(s.paidTotal)}</td><td className={td}>{money(s.invoiceTotal - s.paidTotal)}</td><td className={td}><Button variant="secondary" onClick={() => setEditing(s)}>Edit</Button></td></tr>)}</tbody></table></TableShell>{editing && <SupplierModal supplier={editing} onClose={() => setEditing(null)} onSave={save} />}</div>;
};

const SupplierModal = ({ supplier, onClose, onSave }: { supplier: Supplier; onClose: () => void; onSave: (supplier: Supplier) => void }) => {
  const [form, setForm] = useState(supplier);
  const patch = (key: keyof Supplier, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  return <Modal title="Supplier details" onClose={onClose}><form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}><Field label="Supplier name"><input className={inputClass} value={form.name} onChange={(e) => patch('name', e.target.value)} required /></Field><Field label="Contact number"><input className={inputClass} value={form.contact} onChange={(e) => patch('contact', e.target.value)} /></Field><Field label="Products supplied"><input className={inputClass} value={form.productsSupplied} onChange={(e) => patch('productsSupplied', e.target.value)} /></Field><Field label="Supplier invoice records total"><input className={inputClass} type="number" value={form.invoiceTotal} onChange={(e) => patch('invoiceTotal', Number(e.target.value))} /></Field><Field label="Supplier payments total"><input className={inputClass} type="number" value={form.paidTotal} onChange={(e) => patch('paidTotal', Number(e.target.value))} /></Field><Field label="Notes"><textarea className={inputClass} value={form.notes} onChange={(e) => patch('notes', e.target.value)} /></Field><div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save supplier</Button></div></form></Modal>;
};
