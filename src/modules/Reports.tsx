import { useLiveQuery } from 'dexie-react-hooks';
import jsPDF from 'jspdf';
import { Button, Card, TableShell, td, th } from '../components/ui';
import { db } from '../lib/db';
import { customerOutstanding, downloadText, money, toCSV, todayISO } from '../lib/utils';

export const Reports = () => {
  const data = useLiveQuery(async () => ({ invoices: await db.invoices.toArray(), payments: await db.payments.toArray(), customers: await db.customers.toArray(), products: await db.products.toArray(), cash: await db.cashEntries.toArray(), deliveries: await db.deliveries.toArray() }), []);
  if (!data) return <div>Loading reports...</div>;
  const today = todayISO();
  const reportRows = [
    { report: 'Daily sales report', value: money(data.invoices.filter((i) => i.invoiceDate === today).reduce((s, i) => s + i.total, 0)) },
    { report: 'Monthly sales report', value: money(data.invoices.filter((i) => i.invoiceDate.slice(0, 7) === today.slice(0, 7)).reduce((s, i) => s + i.total, 0)) },
    { report: 'Customer outstanding report', value: money(data.customers.reduce((s, c) => s + customerOutstanding(c.id, data.invoices, data.payments, c.openingBalance), 0)) },
    { report: 'Product sales report', value: String(data.invoices.flatMap((i) => i.items).reduce((s, i) => s + i.quantity, 0)) },
    { report: 'Profit report', value: money(data.invoices.reduce((sum, invoice) => sum + invoice.items.reduce((s, item) => s + item.quantity * (item.unitPrice - item.costPrice) - item.discount, 0), 0)) },
    { report: 'Inventory stock report', value: money(data.products.reduce((s, p) => s + p.currentStock * p.costPrice, 0)) },
    { report: 'Expense report', value: money(data.cash.filter((c) => c.type === 'out').reduce((s, c) => s + c.amount, 0)) },
    { report: 'Cash flow report', value: money(data.cash.reduce((s, c) => s + (c.type === 'in' ? c.amount : -c.amount), 0)) },
    { report: 'Delivery report', value: `${data.deliveries.filter((d) => d.status === 'delivered').length} delivered` }
  ];
  const exportPdf = () => {
    const pdf = new jsPDF();
    pdf.text('Nesto Business Reports', 14, 16);
    reportRows.forEach((row, index) => pdf.text(`${row.report}: ${row.value}`, 14, 30 + index * 9));
    pdf.save('nesto-reports.pdf');
  };
  return <div className="grid gap-5"><Card><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Reports</h2><p className="text-sm text-slate-500">Export reports as PDF or CSV for accounting.</p></div><div className="grid gap-2 sm:flex"><Button variant="secondary" onClick={() => downloadText('nesto-reports.csv', toCSV(reportRows), 'text/csv')}>Export CSV</Button><Button onClick={exportPdf}>Export PDF</Button></div></div></Card><TableShell><table className="w-full"><thead><tr><th className={th}>Report</th><th className={th}>Value</th></tr></thead><tbody>{reportRows.map((row) => <tr key={row.report}><td className={td}>{row.report}</td><td className={td}>{row.value}</td></tr>)}</tbody></table></TableShell></div>;
};
