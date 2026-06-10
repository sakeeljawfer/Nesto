import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Field, inputClass, Modal, TableShell, td, th } from '../components/ui';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { todayISO, uid } from '../lib/utils';
import type { Delivery, DeliveryStatus, Invoice } from '../types';

export const Deliveries = () => {
  const data = useLiveQuery(async () => ({ deliveries: await db.deliveries.orderBy('date').reverse().toArray(), invoices: await db.invoices.toArray() }), []);
  const [open, setOpen] = useState(false);
  const { notify } = useToast();
  const setStatus = async (delivery: Delivery, status: DeliveryStatus) => { await db.deliveries.update(delivery.id, { status }); notify('Delivery updated'); };
  return <div className="grid gap-5"><Card><div className="flex justify-between"><div><h2 className="font-bold">Delivery routes</h2><p className="text-sm text-slate-500">Assign invoices to drivers and vehicles.</p></div><Button onClick={() => setOpen(true)}><Plus size={18} />Create route</Button></div></Card><TableShell><table className="w-full"><thead><tr><th className={th}>Route</th><th className={th}>Driver</th><th className={th}>Vehicle</th><th className={th}>Invoices</th><th className={th}>Status</th><th className={th}>Notes</th><th className={th}>Update</th></tr></thead><tbody>{(data?.deliveries ?? []).map((d) => <tr key={d.id}><td className={td}>{d.route}<br />{d.date}</td><td className={td}>{d.driverName}</td><td className={td}>{d.vehicleNumber}</td><td className={td}>{d.invoiceIds.map((id) => data?.invoices.find((i) => i.id === id)?.invoiceNo).filter(Boolean).join(', ')}</td><td className={td}><Badge tone={d.status === 'delivered' ? 'green' : d.status === 'failed' || d.status === 'returned' ? 'red' : 'amber'}>{d.status}</Badge></td><td className={td}>{d.returnedItems || d.notes}</td><td className={td}><select className={inputClass} value={d.status} onChange={(e) => setStatus(d, e.target.value as DeliveryStatus)}><option value="pending">pending</option><option value="loaded">loaded</option><option value="delivered">delivered</option><option value="failed">failed</option><option value="returned">returned</option></select></td></tr>)}</tbody></table></TableShell>{open && data && <DeliveryModal invoices={data.invoices} onClose={() => setOpen(false)} onSaved={() => { notify('Delivery route created'); setOpen(false); }} />}</div>;
};

const DeliveryModal = ({ invoices, onClose, onSaved }: { invoices: Invoice[]; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState<Delivery>({ id: uid(), route: '', invoiceIds: [], driverName: '', vehicleNumber: '', status: 'pending', returnedItems: '', notes: '', date: todayISO() });
  const save = async () => { await db.deliveries.add(form); onSaved(); };
  return <Modal title="Create delivery route" onClose={onClose}><div className="grid gap-4 md:grid-cols-2"><Field label="Route / area"><input className={inputClass} value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} /></Field><Field label="Driver name"><input className={inputClass} value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} /></Field><Field label="Vehicle number"><input className={inputClass} value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /></Field><Field label="Date"><input className={inputClass} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field><Field label="Assign invoices"><select multiple className={`${inputClass} min-h-32`} value={form.invoiceIds} onChange={(e) => setForm({ ...form, invoiceIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}>{invoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNo} - {i.customerName}</option>)}</select></Field><Field label="Returned items / notes"><textarea className={inputClass} value={form.returnedItems} onChange={(e) => setForm({ ...form, returnedItems: e.target.value })} /></Field><div className="flex justify-end gap-2 md:col-span-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save route</Button></div></div></Modal>;
};
