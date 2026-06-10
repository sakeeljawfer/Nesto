import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Field, inputClass, Modal, Badge, TableShell, th, td } from '../components/ui';
import { useToast } from '../components/Toast';
import { db } from '../lib/db';
import { money, uid } from '../lib/utils';
import type { Product } from '../types';

const blank = (): Product => ({ id: uid(), name: '', category: 'Bottled Water', brand: '', packSize: '', costPrice: 0, sellingPrice: 0, wholesalePrice: 0, currentStock: 0, reorderLevel: 0, supplierName: '', createdAt: new Date().toISOString() });

export const Inventory = () => {
  const products = useLiveQuery(() => db.products.toArray(), []);
  const movements = useLiveQuery(() => db.stockMovements.orderBy('date').reverse().toArray(), []);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const { notify } = useToast();
  const filtered = (products ?? []).filter((p) => `${p.name} ${p.category} ${p.brand} ${p.supplierName}`.toLowerCase().includes(query.toLowerCase()));
  const save = async (product: Product) => {
    await db.products.put(product);
    notify('Product saved');
    setEditing(null);
  };
  const stockAdjust = async (product: Product, delta: number) => {
    const next = product.currentStock + delta;
    if (next < 0) return;
    await db.transaction('rw', db.products, db.stockMovements, async () => {
      await db.products.update(product.id, { currentStock: next });
      await db.stockMovements.add({ id: uid(), productId: product.id, type: delta >= 0 ? 'in' : 'out', quantity: Math.abs(delta), reason: 'Manual stock adjustment', date: new Date().toISOString().slice(0, 10) });
    });
    notify('Stock updated');
  };
  return (
    <div className="grid gap-5">
      <Card><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className={`${inputClass} w-full pl-10`} placeholder="Search products, brands, suppliers" value={query} onChange={(e) => setQuery(e.target.value)} /></div><Button onClick={() => setEditing(blank())}><Plus size={18} />Add product</Button></div></Card>
      <TableShell><table className="w-full"><thead><tr><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Prices</th><th className={th}>Stock</th><th className={th}>Supplier</th><th className={th}>Actions</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.id}><td className={td}><strong className="block text-slate-950">{p.name}</strong><span>{p.brand} / {p.packSize}</span></td><td className={td}>{p.category}</td><td className={td}>Cost {money(p.costPrice)}<br />Sell {money(p.sellingPrice)}</td><td className={td}><Badge tone={p.currentStock <= p.reorderLevel ? 'red' : 'green'}>{p.currentStock} packs</Badge></td><td className={td}>{p.supplierName}</td><td className={td}><div className="flex gap-2"><Button variant="secondary" onClick={() => setEditing(p)}>Edit</Button><Button variant="ghost" onClick={() => stockAdjust(p, 1)}>+1</Button><Button variant="ghost" onClick={() => stockAdjust(p, -1)}>-1</Button></div></td></tr>)}</tbody></table></TableShell>
      <Card><h2 className="mb-3 font-bold">Stock in / out history</h2><div className="grid gap-2">{(movements ?? []).slice(0, 8).map((m) => <div key={m.id} className="flex justify-between rounded-md bg-slate-50 p-3 text-sm"><span>{products?.find((p) => p.id === m.productId)?.name} - {m.reason}</span><Badge tone={m.type === 'in' ? 'green' : 'amber'}>{m.type} {m.quantity}</Badge></div>)}</div></Card>
      {editing && <ProductModal product={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
};

const ProductModal = ({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (product: Product) => void }) => {
  const [form, setForm] = useState(product);
  const patch = (key: keyof Product, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  return <Modal title="Product details" onClose={onClose}><form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>{(['name:Product name','category:Category','brand:Brand','packSize:Bottle / pack size','supplierName:Supplier name','expiryDate:Expiry date'] as const).map((pair) => { const [key, label] = pair.split(':') as [keyof Product, string]; return <Field key={key} label={label}><input className={inputClass} type={key === 'expiryDate' ? 'date' : 'text'} value={String(form[key] ?? '')} onChange={(e) => patch(key, e.target.value)} required={key !== 'expiryDate'} /></Field>; })}{(['costPrice:Cost price','sellingPrice:Selling price','wholesalePrice:Wholesale price','currentStock:Current stock','reorderLevel:Reorder level'] as const).map((pair) => { const [key, label] = pair.split(':') as [keyof Product, string]; return <Field key={key} label={label}><input className={inputClass} type="number" value={Number(form[key])} onChange={(e) => patch(key, Number(e.target.value))} /></Field>; })}<div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save product</Button></div></form></Modal>;
};
