import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { Button, Card, Field, inputClass } from '../components/ui';
import { useToast } from '../components/Toast';
import { createSalt, hashPassword } from '../lib/auth';
import { db, exportBackup, importBackup } from '../lib/db';
import { downloadText, toCSV } from '../lib/utils';
import type { Settings as SettingsType } from '../types';

export const Settings = ({ onLogout }: { onLogout: () => void }) => {
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const [password, setPassword] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify } = useToast();
  if (!settings) return <div>Loading settings...</div>;
  const patch = async (updates: Partial<SettingsType>) => { await db.settings.update('default', updates); notify('Settings saved'); };
  const backup = async () => downloadText(`nesto-backup-${Date.now()}.json`, JSON.stringify(await exportBackup(), null, 2), 'application/json');
  const exportAllCSV = async () => {
    const data = await exportBackup();
    downloadText('nesto-invoices.csv', toCSV(data.invoices as unknown as Record<string, unknown>[]), 'text/csv');
  };
  const restore = async (file: File) => {
    const text = await file.text();
    await importBackup(JSON.parse(text));
    notify('Backup restored');
  };
  const changePassword = async () => {
    if (password.length < 6) return notify('Password must be at least 6 characters');
    const salt = createSalt();
    await patch({ salt, passwordHash: await hashPassword(password, salt) });
    setPassword('');
  };
  const reset = async () => {
    if (!confirm('Type OK on the next prompt only if you have a backup. This will permanently clear local data.')) return;
    if (prompt('Type RESET to clear all local business data') !== 'RESET') return;
    await Promise.all(db.tables.map((table) => table.clear()));
    notify('Data reset complete');
    onLogout();
  };
  const logoUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => patch({ logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };
  return <div className="grid gap-5 xl:grid-cols-2"><Card className="grid gap-4"><h2 className="font-bold">Business settings</h2>{settings.logoDataUrl && <img src={settings.logoDataUrl} className="h-20 w-20 rounded-lg object-contain" alt="Business logo" />}<Field label="Business name"><input className={inputClass} value={settings.businessName} onChange={(e) => patch({ businessName: e.target.value })} /></Field><Field label="Address"><textarea className={inputClass} value={settings.address} onChange={(e) => patch({ address: e.target.value })} /></Field><Field label="Phone number"><input className={inputClass} value={settings.phone} onChange={(e) => patch({ phone: e.target.value })} /></Field><Field label="Invoice prefix"><input className={inputClass} value={settings.invoicePrefix} onChange={(e) => patch({ invoicePrefix: e.target.value })} /></Field><Field label="Currency"><input className={inputClass} value="LKR" disabled /></Field><Field label="Logo upload"><input className={inputClass} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && logoUpload(e.target.files[0])} /></Field></Card><Card className="grid gap-4 content-start"><h2 className="font-bold">Backup, restore, and user profile</h2><Field label="User name"><input className={inputClass} value={settings.userName} onChange={(e) => patch({ userName: e.target.value })} /></Field><Field label="New password"><input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></Field><div className="flex flex-wrap gap-2"><Button onClick={changePassword}>Change password</Button><Button variant="secondary" onClick={backup}>Export JSON backup</Button><Button variant="secondary" onClick={exportAllCSV}>Export invoice CSV</Button><Button variant="secondary" onClick={() => fileRef.current?.click()}>Restore backup</Button><Button variant="danger" onClick={reset}>Reset data</Button></div><input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} /><p className="text-sm text-slate-500">Default login after first install: admin / admin123. Change it before live business use.</p></Card></div>;
};
