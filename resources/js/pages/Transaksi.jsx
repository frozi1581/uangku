import React, { useEffect, useState } from "react";
import { Receipt, Plus, CheckCircle2, Trash2 } from "lucide-react";
import { Pill, Field, Btn, fmt, NumberInput } from "../components/ui";
import { masterApi, txApi } from "../lib/api";

const TABS = [
  { id: "invoice", label: "Invoice (Penjualan)", tone: "from-emerald-400 to-teal-500" },
  { id: "po", label: "Purchase Order", tone: "from-orange-400 to-pink-500" },
  { id: "bank", label: "Transaksi Bank", tone: "from-violet-400 to-indigo-500" },
];

const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0 });

export default function Transaksi() {
  const [tab, setTab] = useState("invoice");
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [banks, setBanks] = useState([]);
  const [partnerName, setPartnerName] = useState(""); // ketik manual (pelanggan/vendor)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(""); // jatuh tempo invoice / perkiraan terima PO
  const [items, setItems] = useState([emptyItem()]);
  const [taxRate, setTaxRate] = useState(11); // PPN tingkat dokumen (pindah ke bawah)
  const [bank, setBank] = useState({ bank_account_id: "", direction: "in", amount: 0, description: "" });
  const [newBank, setNewBank] = useState({ open: false, bank_name: "", account_number: "", saving: false });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  function loadMasters() {
    masterApi.customers().then((r) => setCustomers(r.data)).catch(() => {});
    masterApi.vendors().then((r) => setVendors(r.data)).catch(() => {});
    masterApi.bankAccounts().then((r) => setBanks(r.data)).catch(() => {});
  }
  useEffect(() => { loadMasters(); }, []);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal + tax;

  const setItem = (i, k, v) => setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addItem = () => setItems([...items, emptyItem()]);
  const delItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  // Simpan akun bank baru (form mini)
  async function saveNewBank() {
    if (!newBank.bank_name.trim() || !newBank.account_number.trim()) {
      setMsg({ ok: false, text: "Nama bank dan nomor rekening wajib diisi." });
      return;
    }
    setNewBank({ ...newBank, saving: true });
    try {
      const r = await masterApi.createBankAccount({
        bank_name: newBank.bank_name.trim(),
        account_number: newBank.account_number.trim(),
      });
      const created = r.data;
      setBanks((prev) => [...prev, { id: created.id, bank_name: created.bank_name, account_number: created.account_number, current_balance: created.current_balance }]);
      setBank({ ...bank, bank_account_id: String(created.id) });
      setNewBank({ open: false, bank_name: "", account_number: "", saving: false });
      setMsg({ ok: true, text: "Akun bank baru ditambahkan." });
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || "Gagal menambah akun bank." });
      setNewBank({ ...newBank, saving: false });
    }
  }

  async function submit() {
    setMsg(null);
    setLoading(true);
    try {
      if (tab === "invoice") {
        const r = await txApi.createInvoice({ customer_name: partnerName.trim(), date, due_date: dueDate || null, tax_rate: Number(taxRate) || 0, items });
        setMsg({ ok: true, text: `Invoice ${r.data.invoice_no} tersimpan. Total ${fmt(r.data.total)}.` });
        setItems([emptyItem()]); setPartnerName(""); setDueDate("");
        loadMasters(); // refresh agar pelanggan baru muncul di saran
      } else if (tab === "po") {
        const r = await txApi.createPurchaseOrder({ vendor_name: partnerName.trim(), date, expected_date: dueDate || null, tax_rate: Number(taxRate) || 0, items });
        setMsg({ ok: true, text: `PO ${r.data.po_no} tersimpan. Total ${fmt(r.data.total)}.` });
        setItems([emptyItem()]); setPartnerName(""); setDueDate("");
        loadMasters();
      } else {
        if (!bank.bank_account_id) { setMsg({ ok: false, text: "Pilih akun bank dulu." }); setLoading(false); return; }
        await txApi.createBankTransaction({ ...bank, date });
        setMsg({ ok: true, text: "Transaksi bank tersimpan." });
        setBank({ bank_account_id: "", direction: "in", amount: 0, description: "" });
      }
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

  const suggestions = tab === "po" ? vendors : customers;

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
            <div className="sm:col-span-2">
              <div className="flex items-end justify-between gap-3">
                <label className="block flex-1">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Akun bank</span>
                  <select className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#7C5CFF]"
                    value={bank.bank_account_id} onChange={(e) => setBank({ ...bank, bank_account_id: e.target.value })}>
                    <option value="">Pilih akun</option>
                    {banks.map((b) => <option key={b.id} value={b.id}>{b.bank_name} — {b.account_number}</option>)}
                  </select>
                </label>
                <Btn variant="soft" className="!py-3 !px-3 text-sm whitespace-nowrap" onClick={() => setNewBank({ ...newBank, open: !newBank.open })}>
                  <Plus className="h-4 w-4" /> Akun baru
                </Btn>
              </div>
              {newBank.open && (
                <div className="mt-3 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
                  <input className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#7C5CFF]" placeholder="Nama bank (cth. BCA)" value={newBank.bank_name} onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })} />
                  <input className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#7C5CFF]" placeholder="No. rekening" value={newBank.account_number} onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })} />
                  <Btn loading={newBank.saving} onClick={saveNewBank}>Simpan</Btn>
                </div>
              )}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Arah</span>
              <select className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#7C5CFF]"
                value={bank.direction} onChange={(e) => setBank({ ...bank, direction: e.target.value })}>
                <option value="in">Masuk</option>
                <option value="out">Keluar</option>
              </select>
            </label>
            <Field label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Jumlah</span>
              <NumberInput className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-right outline-none focus:border-[#7C5CFF]"
                placeholder="0" value={bank.amount} onValueChange={(v) => setBank({ ...bank, amount: v })} />
            </label>
            <div className="sm:col-span-2">
              <Field label="Keterangan" value={bank.description} onChange={(e) => setBank({ ...bank, description: e.target.value })} placeholder="cth. Pembayaran INV-0042" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">{tab === "po" ? "Vendor" : "Pelanggan"}</span>
                <input list="partner-suggestions" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#7C5CFF]"
                  placeholder={`Ketik nama ${tab === "po" ? "vendor" : "pelanggan"}…`}
                  value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
                <datalist id="partner-suggestions">
                  {suggestions.map((p) => <option key={p.id} value={p.name} />)}
                </datalist>
                <span className="mt-1 block text-xs text-slate-400">Belum ada di daftar? Ketik saja — otomatis ditambahkan ke master data.</span>
              </label>
              <Field label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Field
                label={tab === "po" ? "Perkiraan diterima (jatuh tempo)" : "Jatuh tempo"}
                type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <div className="hidden sm:block" />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">Item</p>
                <Btn variant="soft" className="!py-2 !px-3 text-sm" onClick={addItem}><Plus className="h-4 w-4" /> Tambah baris</Btn>
              </div>
              <div className="mt-3 space-y-3">
                <div className="hidden gap-2 px-1 text-xs font-semibold text-slate-400 sm:grid sm:grid-cols-[1fr_90px_130px_140px_36px]">
                  <span>Deskripsi</span><span className="text-right">Volume</span><span className="text-right">Harga satuan</span><span className="text-right">Jumlah</span><span></span>
                </div>
                {items.map((it, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_90px_130px_140px_36px]">
                    <input className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#7C5CFF]" placeholder="Deskripsi" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} />
                    <NumberInput className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-right outline-none focus:border-[#7C5CFF]" placeholder="0" value={it.quantity} onValueChange={(v) => setItem(i, "quantity", v)} />
                    <NumberInput className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-right outline-none focus:border-[#7C5CFF]" placeholder="0" value={it.unit_price} onValueChange={(v) => setItem(i, "unit_price", v)} />
                    <input className="rounded-xl border-2 border-slate-100 bg-slate-50 px-3 py-2.5 text-right font-medium text-slate-600 outline-none" value={fmt(it.quantity * it.unit_price)} disabled />
                    <button onClick={() => delItem(i)} className="grid place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500" disabled={items.length === 1}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-100 p-4">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2">
                    PPN
                    <NumberInput
                      className="w-16 rounded-lg border-2 border-slate-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-[#7C5CFF]"
                      value={taxRate} onValueChange={setTaxRate} decimals={0} />
                    %
                  </span>
                  <span className="font-semibold">{fmt(tax)}</span>
                </div>
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
