import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Field, inputClass, Modal, TableShell, td, th } from '../components/ui';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { money, todayISO, uid } from '../lib/utils';
import type { CashEntry, CashType } from '../types';

export const CashFlow = () => {
  const entries = useLiveQuery(() => db.cashEntries.orderBy('date').reverse().toArray(), []);
  const [open, setOpen] = useState(false);
  const { notify } = useToast();
  const income = (entries ?? []).filter((e) => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const expense = (entries ?? []).filter((e) => e.type === 'out').reduce((s, e) => s + e.amount, 0);
  const month = todayISO().slice(0, 7);
  const monthEntries = (entries ?? []).filter((e) => e.date.slice(0, 7) === month);
  return <div className="grid gap-5"><div className="grid gap-4 md:grid-cols-3"><Card><p className="text-sm text-slate-500">Daily closing balance</p><p className="text-2xl font-bold">{money(income - expense)}</p></Card><Card><p className="text-sm text-slate-500">Monthly income</p><p className="text-2xl font-bold">{money(monthEntries.filter((e) => e.type === 'in').reduce((s, e) => s + e.amount, 0))}</p></Card><Card><p className="text-sm text-slate-500">Monthly expense</p><p className="text-2xl font-bold">{money(monthEntries.filter((e) => e.type === 'out').reduce((s, e) => s + e.amount, 0))}</p></Card></div><Card><div className="flex justify-between"><h2 className="font-bold">Cash in / cash out</h2><Button onClick={() => setOpen(true)}><Plus size={18} />Add entry</Button></div></Card><TableShell><table className="w-full"><thead><tr><th className={th}>Date</th><th className={th}>Type</th><th className={th}>Category</th><th className={th}>Amount</th><th className={th}>Notes</th></tr></thead><tbody>{(entries ?? []).map((e) => <tr key={e.id}><td className={td}>{e.date}</td><td className={td}><Badge tone={e.type === 'in' ? 'green' : 'red'}>{e.type === 'in' ? 'Cash in' : 'Cash out'}</Badge></td><td className={td}>{e.category}</td><td className={td}>{money(e.amount)}</td><td className={td}>{e.notes}</td></tr>)}</tbody></table></TableShell>{open && <CashModal onClose={() => setOpen(false)} onSaved={() => { notify('Cash entry saved'); setOpen(false); }} />}</div>;
};

const CashModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState<CashEntry>({ id: uid(), type: 'out', category: 'Fuel Expense', amount: 0, date: todayISO(), notes: '' });
  const save = async () => { await db.cashEntries.add(form); onSaved(); };
  return <Modal title="Cash flow entry" onClose={onClose}><div className="grid gap-4 md:grid-cols-2"><Field label="Type"><select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CashType })}><option value="in">Daily cash in</option><option value="out">Daily cash out</option></select></Field><Field label="Category"><select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Business Expense</option><option>Fuel Expense</option><option>Driver Payment</option><option>Vehicle Repair</option><option>Supplier Payment</option><option>Customer Collection</option><option>Other Expense</option></select></Field><Field label="Amount"><input className={inputClass} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field><Field label="Date"><input className={inputClass} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field><Field label="Notes"><textarea className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><div className="flex items-end justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save entry</Button></div></div></Modal>;
};
