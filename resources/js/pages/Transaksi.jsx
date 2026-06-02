import React, { useEffect, useState } from "react";
import { Receipt, Plus, CheckCircle2, Trash2 } from "lucide-react";
import { Pill, Field, Btn, fmt } from "../components/ui";
import { masterApi, txApi } from "../lib/api";

const TABS = [
  { id: "invoice", label: "Invoice (Penjualan)", tone: "from-emerald-400 to-teal-500" },
  { id: "po", label: "Purchase Order", tone: "from-orange-400 to-pink-500" },
  { id: "bank", label: "Transaksi Bank", tone: "from-violet-400 to-indigo-500" },
];

const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, tax_rate: 11 });

export default function Transaksi() {
  const [tab, setTab] = useState("invoice");
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [banks, setBanks] = useState([]);
  const [partnerId, setPartnerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([emptyItem()]);
  const [bank, setBank] = useState({ bank_account_id: "", direction: "in", amount: 0, description: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    masterApi.customers().then((r) => setCustomers(r.data)).catch(() => {});
    masterApi.vendors().then((r) => setVendors(r.data)).catch(() => {});
    masterApi.bankAccounts().then((r) => setBanks(r.data)).catch(() => {});
  }, []);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const tax = items.reduce((s, it) => s + it.quantity * it.unit_price * (it.tax_rate / 100), 0);
  const total = subtotal + tax;

  const setItem = (i, k, v) => setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addItem = () => setItems([...items, emptyItem()]);
  const delItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  async function submit() {
    setMsg(null);
    setLoading(true);
    try {
      if (tab === "invoice") {
        const r = await txApi.createInvoice({ customer_id: partnerId, date, items });
        setMsg({ ok: true, text: `Invoice ${r.data.invoice_no} tersimpan. Total ${fmt(r.data.total)}.` });
      } else if (tab === "po") {
        const r = await txApi.createPurchaseOrder({ vendor_id: partnerId, date, items });
        setMsg({ ok: true, text: `PO ${r.data.po_no} tersimpan. Total ${fmt(r.data.total)}.` });
      } else {
        await txApi.createBankTransaction({ ...bank, date });
        setMsg({ ok: true, text: "Transaksi bank tersimpan." });
      }
      setItems([emptyItem()]);
      setPartnerId("");
    } catch (e) {
      if (e.response?.status === 429) {
        const q = e.response.data?.quota;
        setMsg({ ok: false, text: `Kuota transaksi bulan ini habis (${q?.used}/${q?.limit}). Tingkatkan paket.` });
      } else {
        setMsg({ ok: false, text: e.response?.data?.message || "Gagal menyimpan transaksi." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Pill tone="violet"><Receipt className="h-3.5 w-3.5" /> Input transaksi</Pill>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Catat transaksi baru</h1>
      <p className="mt-1 text-slate-500">1 transaksi = invoice + PO + transaksi bank dihitung untuk kuota.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg(null); }}
            className={`rounded-2xl border-2 p-4 text-left transition ${tab === t.id ? `border-transparent text-white shadow-lg bg-gradient-to-br ${t.tone}` : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
            <Receipt className="h-5 w-5" />
            <p className="mt-2 font-semibold">{t.label}</p>
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mt-6 rounded-2xl border-2 px-4 py-3 text-sm font-medium ${msg.ok ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-600"}`}>
          {msg.text}
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
        {tab === "bank" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Akun bank</span>
              <select className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#7C5CFF]"
                value={bank.bank_account_id} onChange={(e) => setBank({ ...bank, bank_account_id: e.target.value })}>
                <option value="">Pilih akun</option>
                {banks.map((b) => <option key={b.id} value={b.id}>{b.bank_name} — {b.account_number}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Arah</span>
              <select className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#7C5CFF]"
                value={bank.direction} onChange={(e) => setBank({ ...bank, direction: e.target.value })}>
                <option value="in">Masuk</option>
                <option value="out">Keluar</option>
              </select>
            </label>
            <Field label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Field label="Jumlah" type="number" value={bank.amount} onChange={(e) => setBank({ ...bank, amount: +e.target.value })} />
            <div className="sm:col-span-2">
              <Field label="Keterangan" value={bank.description} onChange={(e) => setBank({ ...bank, description: e.target.value })} placeholder="cth. Pembayaran INV-0042" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">{tab === "po" ? "Vendor" : "Pelanggan"}</span>
                <select className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#7C5CFF]"
                  value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                  <option value="">Pilih {tab === "po" ? "vendor" : "pelanggan"}</option>
                  {(tab === "po" ? vendors : customers).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <Field label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">Item</p>
                <Btn variant="soft" className="!py-2 !px-3 text-sm" onClick={addItem}><Plus className="h-4 w-4" /> Tambah baris</Btn>
              </div>
              <div className="mt-3 space-y-3">
                {items.map((it, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_70px_110px_70px_36px]">
                    <input className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#7C5CFF]" placeholder="Deskripsi" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} />
                    <input className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#7C5CFF]" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => setItem(i, "quantity", +e.target.value)} />
                    <input className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#7C5CFF]" type="number" placeholder="Harga" value={it.unit_price} onChange={(e) => setItem(i, "unit_price", +e.target.value)} />
                    <input className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#7C5CFF]" type="number" placeholder="%PPN" value={it.tax_rate} onChange={(e) => setItem(i, "tax_rate", +e.target.value)} />
                    <button onClick={() => delItem(i)} className="grid place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500" disabled={items.length === 1}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-100 p-4">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-slate-600"><span>PPN</span><span className="font-semibold">{fmt(tax)}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-bold text-slate-900"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
              <div className="flex items-end">
                <Btn className="w-full" loading={loading} onClick={submit}>Simpan & posting jurnal <CheckCircle2 className="h-4 w-4" /></Btn>
              </div>
            </div>
          </>
        )}
        {tab === "bank" && (
          <div className="mt-6 flex justify-end">
            <Btn loading={loading} onClick={submit}>Simpan transaksi <CheckCircle2 className="h-4 w-4" /></Btn>
          </div>
        )}
      </div>
    </div>
  );
}
