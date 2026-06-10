import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Banknote, Boxes, CircleDollarSign, MessageCircle, PackagePlus, ReceiptText, TrendingUp, Truck, UserPlus, Wallet } from 'lucide-react';
import { db } from '../lib/db';
import { customerOutstanding, daysBetween, money, openWhatsApp, todayISO } from '../lib/utils';
import { Badge, Button, Card, SectionTitle, TableShell, td, th } from '../components/ui';
import type { PageKey } from '../components/Layout';

export const Dashboard = ({ setPage }: { setPage: (page: PageKey) => void }) => {
  const data = useLiveQuery(async () => ({
    products: await db.products.toArray(),
    customers: await db.customers.toArray(),
    invoices: await db.invoices.orderBy('createdAt').reverse().toArray(),
    payments: await db.payments.orderBy('date').reverse().toArray(),
    cash: await db.cashEntries.toArray(),
    deliveries: await db.deliveries.toArray()
  }));
  if (!data) return <div className="text-sm text-slate-500">Loading dashboard...</div>;
  const today = todayISO();
  const todayInvoices = data.invoices.filter((i) => i.invoiceDate === today);
  const todayPayments = data.payments.filter((p) => p.date === today);
  const monthlyInvoices = data.invoices.filter((i) => (i.invoiceDate ?? '').slice(0, 7) === today.slice(0, 7));
  const stockValue = data.products.reduce((sum, p) => sum + Number(p.currentStock ?? 0) * Number(p.costPrice ?? 0), 0);
  const pending = data.invoices.reduce((sum, i) => sum + Math.max(0, Number(i.total ?? 0) - Number(i.paidAmount ?? 0)), 0);
  const profit = monthlyInvoices.reduce((sum, invoice) => sum + (invoice.items ?? []).reduce((s, item) => s + Number(item.quantity ?? 0) * (Number(item.unitPrice ?? 0) - Number(item.costPrice ?? 0)) - Number(item.discount ?? 0), 0), 0);
  const lowStock = data.products.filter((p) => Number(p.currentStock ?? 0) <= Number(p.reorderLevel ?? 0));
  const monthLabels = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - index));
    return date.toISOString().slice(0, 7);
  });
  const monthlyStats = monthLabels.map((month) => {
    const invoices = data.invoices.filter((invoice) => (invoice.invoiceDate ?? '').slice(0, 7) === month);
    const payments = data.payments.filter((payment) => (payment.date ?? '').slice(0, 7) === month);
    const sales = invoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
    const collected = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const profit = invoices.reduce((sum, invoice) => sum + (invoice.items ?? []).reduce((itemSum, item) => itemSum + Number(item.quantity ?? 0) * (Number(item.unitPrice ?? 0) - Number(item.costPrice ?? 0)) - Number(item.discount ?? 0), 0), 0);
    return {
      month,
      label: new Date(`${month}-01`).toLocaleDateString('en-LK', { month: 'short' }),
      sales,
      collected,
      profit,
      outstanding: Math.max(0, sales - collected)
    };
  });
  const maxMonthlyValue = Math.max(1, ...monthlyStats.flatMap((stat) => [stat.sales, stat.collected, stat.profit]));
  const creditReminders = data.customers
    .map((customer) => {
      const customerInvoices = data.invoices.filter((invoice) => invoice.customerId === customer.id && invoice.status !== 'paid');
      const oldestDue = customerInvoices.map((invoice) => invoice.dueDate).sort()[0];
      return {
        customer,
        balance: customerOutstanding(customer.id, data.invoices, data.payments, customer.openingBalance),
        overdueDays: oldestDue ? Math.max(0, daysBetween(oldestDue)) : 0
      };
    })
    .filter((item) => item.balance > 0)
    .sort((a, b) => b.overdueDays - a.overdueDays || b.balance - a.balance)
    .slice(0, 6);
  const remindCustomer = (item: (typeof creditReminders)[number]) => {
    openWhatsApp(item.customer.whatsapp || item.customer.phone, [
      `Dear ${item.customer.ownerName || item.customer.shopName},`,
      `Credit balance reminder from Nesto Water & Beverages.`,
      `Outstanding balance: ${money(item.balance)}.`,
      item.overdueDays > 0 ? `This balance is overdue by ${item.overdueDays} day(s).` : 'Please arrange payment at your earliest convenience.',
      'Thank you.'
    ].join('\n'));
  };
  const kpis = [
    ['Today sales', money(todayInvoices.reduce((sum, i) => sum + i.total, 0)), `${todayInvoices.length} invoices`, <ReceiptText size={18} />, 'bg-brand-50 text-brand-700'],
    ['Today cash collection', money(todayPayments.reduce((sum, p) => sum + p.amount, 0)), `${todayPayments.length} receipts`, <Banknote size={18} />, 'bg-emerald-50 text-emerald-700'],
    ['Pending payments', money(pending), 'customer credit', <Wallet size={18} />, 'bg-amber-50 text-amber-700'],
    ['Total stock value', money(stockValue), `${data.products.length} products`, <Boxes size={18} />, 'bg-sky-50 text-sky-700'],
    ['Low stock alerts', String(lowStock.length), 'reorder needed', <AlertTriangle size={18} />, 'bg-red-50 text-red-700'],
    ['Monthly profit overview', money(profit), today.slice(0, 7), <TrendingUp size={18} />, 'bg-violet-50 text-violet-700']
  ];
  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-brand-100 bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-brand-700">Today command center</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">Keep sales, collections, stock, and routes moving.</h2>
            <p className="mt-1 text-sm text-slate-500">Focus first on unpaid invoices, low stock, and delivery status before the next route leaves.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[620px] xl:grid-cols-4">
            <button onClick={() => setPage('invoices')} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><ReceiptText className="mb-2" size={18} />New invoice</button>
            <button onClick={() => setPage('payments')} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><CircleDollarSign className="mb-2" size={18} />Collect cash</button>
            <button onClick={() => setPage('inventory')} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><PackagePlus className="mb-2" size={18} />Stock check</button>
            <button onClick={() => setPage('customers')} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><UserPlus className="mb-2" size={18} />Add shop</button>
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([label, value, helper, icon, tone]) => <Card key={label as string} className="relative overflow-hidden"><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase text-slate-500">{label}</span><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-sm text-slate-500">{helper}</p></div><div className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}>{icon}</div></div></Card>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Recent invoices" description="Latest customer billing activity" />
          <TableShell><table className="w-full"><thead><tr><th className={th}>No</th><th className={th}>Customer</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead><tbody>{data.invoices.slice(0, 6).map((i) => <tr key={i.id}><td className={td}>{i.invoiceNo}</td><td className={td}>{i.customerName}</td><td className={td}>{money(Number(i.total ?? 0))}</td><td className={td}><Badge tone={i.status === 'paid' ? 'green' : i.status === 'partial' ? 'amber' : 'red'}>{i.status}</Badge></td></tr>)}</tbody></table></TableShell>
        </Card>
        <Card>
          <SectionTitle title="Delivery summary" description="Route load and completion status" />
          <div className="grid gap-3 sm:grid-cols-2">
            {(['pending', 'loaded', 'delivered', 'failed', 'returned'] as const).map((status) => <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{status}</p><p className="text-2xl font-bold text-slate-950">{data.deliveries.filter((d) => d.status === status).length}</p></div>)}
          </div>
          <h2 className="mb-3 mt-5 font-bold text-slate-950">Recent payments</h2>
          <div className="grid gap-2">{data.payments.slice(0, 5).map((p) => <div key={p.id} className="flex flex-col gap-1 rounded-md bg-slate-50 p-3 text-sm sm:flex-row sm:justify-between"><span className="min-w-0 break-words">{p.customerName}</span><strong>{money(Number(p.amount ?? 0))}</strong></div>)}</div>
        </Card>
      </div>
      <Card>
        <SectionTitle title="Monthly sales analytics" description="Last 12 months sales, collections, profit, and credit gap" action={
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-brand-600" />Sales</span>
            <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-sky-500" />Collected</span>
            <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Profit</span>
          </div>
        } />
        <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-[680px] items-end gap-3 rounded-lg bg-slate-50 p-3 sm:min-w-[760px] sm:p-4">
              {monthlyStats.map((stat) => (
                <div key={stat.month} className="grid flex-1 gap-2">
                  <div className="flex h-56 items-end justify-center gap-1.5">
                    <div className="w-4 rounded-t bg-brand-600" style={{ height: `${Math.max(4, (stat.sales / maxMonthlyValue) * 100)}%` }} title={`Sales ${money(stat.sales)}`} />
                    <div className="w-4 rounded-t bg-sky-500" style={{ height: `${Math.max(4, (stat.collected / maxMonthlyValue) * 100)}%` }} title={`Collected ${money(stat.collected)}`} />
                    <div className="w-4 rounded-t bg-emerald-500" style={{ height: `${Math.max(4, (stat.profit / maxMonthlyValue) * 100)}%` }} title={`Profit ${money(stat.profit)}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-700">{stat.label}</p>
                    <p className="text-[11px] text-slate-500">{money(stat.sales)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid content-start gap-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500"><TrendingUp size={18} /><span className="text-xs font-bold uppercase">Best month</span></div>
              {monthlyStats.slice().sort((a, b) => b.sales - a.sales).slice(0, 1).map((stat) => <div key={stat.month} className="mt-2"><p className="text-xl font-bold">{stat.month}</p><p className="text-sm text-slate-500">{money(stat.sales)} sales</p></div>)}
            </div>
            <div className="grid gap-2">
              {monthlyStats.slice(-6).reverse().map((stat) => (
                <div key={stat.month} className="rounded-md bg-slate-50 p-3">
                  <div className="flex justify-between text-sm font-semibold"><span>{stat.month}</span><span>{money(stat.outstanding)}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (stat.outstanding / Math.max(1, stat.sales)) * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Outstanding against monthly sales</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle title="Credit balance reminders" description="Customers to follow up for pending collections" action={<Badge tone={creditReminders.length ? 'amber' : 'green'}>{creditReminders.length} pending</Badge>} />
        <div className="grid gap-3 lg:grid-cols-2">
          {creditReminders.length === 0 && <div className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">No customer credit reminders right now.</div>}
          {creditReminders.map((item) => (
            <div key={item.customer.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-slate-950">{item.customer.shopName}</p>
                <p className="text-sm text-slate-500">{item.customer.ownerName} / {item.customer.area}</p>
                <p className="mt-1 text-sm font-semibold text-amber-700">{money(item.balance)} outstanding {item.overdueDays > 0 ? `/${item.overdueDays} days overdue` : ''}</p>
              </div>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => remindCustomer(item)}><MessageCircle size={16} />WhatsApp</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
