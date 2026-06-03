import React, { useEffect, useState } from "react";
import { History, FileText, ShoppingCart, Landmark, Banknote, ArrowDownRight, ArrowUpRight, Inbox, Trash2, Lock, LockOpen, AlertTriangle } from "lucide-react";
import { Pill, Btn, fmt } from "../components/ui";
import { txApi, periodApi } from "../lib/api";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function monthRange(year, month) {
  const m = String(month + 1).padStart(2, "0");
  const lastDay = new Date(year, month + 1, 0).getDate();
  return { period: `${year}-${m}`, from: `${year}-${m}-01`, to: `${year}-${m}-${String(lastDay).padStart(2, "0")}` };
}

const tgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");

const TYPE_META = {
  invoice: { label: "Invoice", icon: FileText, color: "text-emerald-600 bg-emerald-100" },
  po: { label: "Purchase Order", icon: ShoppingCart, color: "text-orange-600 bg-orange-100" },
  bank: { label: "Transaksi Bank", icon: Landmark, color: "text-violet-600 bg-violet-100" },
  payment: { label: "Pembayaran", icon: Banknote, color: "text-sky-600 bg-sky-100" },
};

export default function Riwayat() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [openFrom, setOpenFrom] = useState(null); // batas bawah periode terbuka (YYYY-MM)
  const [openTo, setOpenTo] = useState(null);      // batas atas (bulan berjalan)
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const { period, from, to } = monthRange(year, month);
  const isOpen = openFrom && period >= openFrom && period <= openTo;
  const isClosed = openFrom && period < openFrom;
  const isFuture = openTo && period > openTo;

  // bulan sebelum 'period' (untuk tahu apakah period = tepat 1 langkah di bawah openFrom)
  const prevOfOpenFrom = openFrom ? (() => { const [y, m] = openFrom.split("-").map(Number); const d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })() : null;
  const canOpenThis = isClosed && period === prevOfOpenFrom;        // hanya boleh buka 1 langkah ke bawah
  const isLowerBound = openFrom && period === openFrom;             // bulan terbawah yg terbuka
  const canCloseThis = isLowerBound && openFrom < openTo;          // tutup hanya dari bawah & bukan bulan berjalan

  function load() {
    setLoading(true);
    Promise.all([
      txApi.invoices({ from, to }),
      txApi.purchaseOrders({ from, to }),
      txApi.bankTransactions({ from, to }),
      txApi.payments({ from, to }),
      periodApi.current(period),
    ])
      .then(([inv, po, bank, pay, per]) => {
        const payments = pay.data?.data || [];
        // id transaksi bank yang berasal dari pembayaran -> sembunyikan dari daftar bank agar tak dobel.
        const payBankTxIds = new Set(payments.map((p) => p.bank_transaction_id).filter(Boolean));
        const merged = [
          ...(inv.data?.data || []).map((r) => ({ type: "invoice", id: r.id, date: r.date, ref: r.invoice_no, party: r.customer?.name, amount: Number(r.total), status: r.status })),
          ...(po.data?.data || []).map((r) => ({ type: "po", id: r.id, date: r.date, ref: r.po_no, party: r.vendor?.name, amount: Number(r.total), status: r.status })),
          ...(bank.data?.data || []).filter((r) => !payBankTxIds.has(r.id)).map((r) => ({ type: "bank", id: r.id, date: r.date, ref: r.bank_account?.bank_name || "Bank", party: r.description, amount: Number(r.amount), direction: r.direction })),
          ...payments.map((r) => ({ type: "payment", id: r.id, date: r.date, ref: r.payment_no, party: r.bank_account?.bank_name, amount: Number(r.amount), direction: r.payable_type === "invoice" ? "in" : "out" })),
        ];
        merged.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id)); // tanggal terlama dulu
        setRows(merged);
        setOpenFrom(per.data.open_from);
        setOpenTo(per.data.open_to);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month, year]);

  async function hapus(row) {
    if (!confirm(`Hapus ${TYPE_META[row.type].label} ${row.ref}? Jurnal terkait ikut terhapus.`)) return;
    setBusy(true);
    setMsg(null);
    try {
      if (row.type === "invoice") await txApi.deleteInvoice(row.id);
      else if (row.type === "po") await txApi.deletePurchaseOrder(row.id);
      else if (row.type === "payment") await txApi.deletePayment(row.id);
      else await txApi.deleteBankTransaction(row.id);
      setMsg({ ok: true, text: "Transaksi dihapus." });
      load();
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || "Gagal menghapus." });
    } finally {
      setBusy(false);
    }
  }

  async function tutupPeriode() {
    if (!confirm(`Tutup periode ${BULAN[month]} ${year}? Setelah ditutup, bulan ini tidak bisa di-CRUD lagi. Penutupan harus dari bulan terbawah.`)) return;
    setBusy(true); setMsg(null);
    try {
      const r = await periodApi.closeEarliest();
      setOpenFrom(r.data.open_from); setOpenTo(r.data.open_to);
      setMsg({ ok: true, text: r.data.message });
      load();
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || "Gagal menutup periode." });
    } finally { setBusy(false); }
  }

  async function bukaPeriodeIni() {
    if (!confirm(`Buka periode ${BULAN[month]} ${year}? Bulan ini akan menjadi batas bawah periode terbuka, dan bisa di-CRUD.`)) return;
    setBusy(true); setMsg(null);
    try {
      const r = await periodApi.openPrevious();
      setOpenFrom(r.data.open_from); setOpenTo(r.data.open_to);
      setMsg({ ok: true, text: r.data.message });
      load();
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || "Gagal membuka periode." });
    } finally { setBusy(false); }
  }

  const years = [];
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 5; y--) years.push(y);
  // Total ringkas: jumlahkan nilai dokumen & mutasi bank; pembayaran tidak dihitung (pelunasan dokumen yg sudah dihitung).
  const total = rows.reduce((s, r) => {
    if (r.type === "payment") return s;
    return s + (r.type === "bank" && r.direction === "out" ? -r.amount : r.amount);
  }, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <Pill tone="violet"><History className="h-3.5 w-3.5" /> Daftar transaksi</Pill>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Daftar Transaksi</h1>
      <p className="mt-1 text-slate-500">Semua transaksi per periode, urut dari tanggal paling awal.</p>

      {/* pemilih periode + status */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select value={month} onChange={(e) => setMonth(+e.target.value)} className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 outline-none focus:border-[#7C5CFF]">
          {BULAN.map((b, i) => <option key={i} value={i}>{b}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(+e.target.value)} className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 outline-none focus:border-[#7C5CFF]">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {openFrom && (
          isOpen ? <Pill tone="green"><LockOpen className="h-3.5 w-3.5" /> Terbuka</Pill>
          : isClosed ? <Pill tone="slate"><Lock className="h-3.5 w-3.5" /> Tertutup</Pill>
          : <Pill tone="amber"><AlertTriangle className="h-3.5 w-3.5" /> Belum dibuka</Pill>
        )}
        <div className="ml-auto rounded-2xl bg-slate-50 px-4 py-2.5 text-right">
          <span className="text-xs text-slate-400">Total {BULAN[month]} {year}</span>
          <p className="font-bold text-slate-900">{fmt(total)}</p>
        </div>
      </div>

      {/* info rentang terbuka */}
      {openFrom && (
        <p className="mt-2 text-xs text-slate-400">
          Rentang terbuka: {openFrom} s/d {openTo}. Buka mundur satu per satu; tutup dari bulan terbawah.
        </p>
      )}

      {/* aksi periode */}
      <div className="mt-3 flex flex-wrap gap-2">
        {canCloseThis && <Btn variant="ghost" loading={busy} onClick={tutupPeriode}><Lock className="h-4 w-4" /> Tutup {BULAN[month]} {year}</Btn>}
        {canOpenThis && <Btn variant="ghost" loading={busy} onClick={bukaPeriodeIni}><LockOpen className="h-4 w-4" /> Buka {BULAN[month]} {year}</Btn>}
        {isClosed && !canOpenThis && <span className="text-sm text-slate-400">Untuk membuka bulan ini, buka dulu bulan-bulan setelahnya secara berurutan.</span>}
      </div>

      {msg && (
        <div className={`mt-4 rounded-2xl border-2 px-4 py-3 text-sm font-medium ${msg.ok ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-600"}`}>{msg.text}</div>
      )}

      {isClosed && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <Lock className="h-4 w-4" /> Periode ini sudah ditutup — transaksi hanya bisa dilihat, tidak bisa diubah atau dihapus.
        </div>
      )}
      {isFuture && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <AlertTriangle className="h-4 w-4" /> Bulan ini di masa depan (melewati bulan berjalan).
        </div>
      )}

      {/* daftar gabungan */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Memuat…</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100"><Inbox className="h-7 w-7 text-slate-400" /></div>
            <p className="font-semibold text-slate-600">Belum ada transaksi</p>
            <p className="text-sm text-slate-400">Tidak ada transaksi pada {BULAN[month]} {year}.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((r) => {
              const meta = TYPE_META[r.type];
              const Icon = meta.icon;
              return (
                <div key={`${r.type}-${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.color}`}><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{r.ref}{r.party ? <span className="font-normal text-slate-400"> · {r.party}</span> : null}</p>
                      <p className="text-sm text-slate-400">{tgl(r.date)} · {meta.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`shrink-0 font-bold tabular-nums ${(r.type === "bank" || r.type === "payment") && r.direction === "out" ? "text-rose-500" : "text-slate-900"}`}>
                      {(r.type === "bank" || r.type === "payment") ? (r.direction === "in" ? "+" : "-") : ""}{fmt(r.amount)}
                    </span>
                    {isOpen && (
                      <button onClick={() => hapus(r)} disabled={busy} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
