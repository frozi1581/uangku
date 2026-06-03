import React, { useEffect, useState } from "react";
import { History, FileText, ShoppingCart, Landmark, ArrowUpRight, ArrowDownRight, Inbox } from "lucide-react";
import { Pill, fmt } from "../components/ui";
import { txApi } from "../lib/api";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const TABS = [
  { id: "invoice", label: "Invoice", icon: FileText, tone: "from-emerald-400 to-teal-500" },
  { id: "po", label: "Purchase Order", icon: ShoppingCart, tone: "from-orange-400 to-pink-500" },
  { id: "bank", label: "Transaksi Bank", icon: Landmark, tone: "from-violet-400 to-indigo-500" },
];

// rentang tanggal awal-akhir bulan (YYYY-MM-DD), aman dari timezone
function monthRange(year, month) {
  const m = String(month + 1).padStart(2, "0");
  const lastDay = new Date(year, month + 1, 0).getDate();
  return { from: `${year}-${m}-01`, to: `${year}-${m}-${String(lastDay).padStart(2, "0")}` };
}

const tgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");

const STATUS_TONE = {
  draft: "slate", sent: "violet", paid: "green", partial: "amber", overdue: "rose", void: "slate",
  approved: "green", pending_approval: "amber", received: "green", rejected: "rose",
};

export default function Riwayat() {
  const now = new Date();
  const [tab, setTab] = useState("invoice");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { from, to } = monthRange(year, month);
    const call =
      tab === "invoice" ? txApi.invoices({ from, to })
      : tab === "po" ? txApi.purchaseOrders({ from, to })
      : txApi.bankTransactions({ from, to });
    call
      .then((r) => setRows(r.data?.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [tab, month, year]);

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) years.push(y);

  // ringkasan total periode
  const total = rows.reduce((s, r) => s + Number(tab === "bank" ? r.amount : r.total), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Pill tone="violet"><History className="h-3.5 w-3.5" /> Riwayat transaksi</Pill>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Transaksi Masuk</h1>
      <p className="mt-1 text-slate-500">Lihat semua transaksi yang sudah dicatat per periode.</p>

      {/* pilih periode */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select value={month} onChange={(e) => setMonth(+e.target.value)}
          className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 outline-none focus:border-[#7C5CFF]">
          {BULAN.map((b, i) => <option key={i} value={i}>{b}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(+e.target.value)}
          className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 outline-none focus:border-[#7C5CFF]">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="ml-auto rounded-2xl bg-slate-50 px-4 py-2.5 text-right">
          <span className="text-xs text-slate-400">Total {BULAN[month]} {year}</span>
          <p className="font-bold text-slate-900">{fmt(total)}</p>
        </div>
      </div>

      {/* tab */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold transition ${tab === t.id ? `text-white shadow-lg bg-gradient-to-br ${t.tone}` : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* daftar */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Memuat…</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100"><Inbox className="h-7 w-7 text-slate-400" /></div>
            <p className="font-semibold text-slate-600">Belum ada transaksi</p>
            <p className="text-sm text-slate-400">Tidak ada {TABS.find((t) => t.id === tab)?.label} pada {BULAN[month]} {year}.</p>
          </div>
        ) : tab === "bank" ? (
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${r.direction === "in" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"}`}>
                    {r.direction === "in" ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{r.description || "(tanpa keterangan)"}</p>
                    <p className="text-sm text-slate-400">{tgl(r.date)} · {r.bank_account?.bank_name || "Bank"}</p>
                  </div>
                </div>
                <span className={`font-bold tabular-nums ${r.direction === "in" ? "text-emerald-600" : "text-rose-500"}`}>
                  {r.direction === "in" ? "+" : "-"}{fmt(r.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-semibold text-slate-800">{tab === "invoice" ? r.invoice_no : r.po_no}</p>
                  <p className="text-sm text-slate-400">{tgl(r.date)} · {tab === "invoice" ? (r.customer?.name || "Pelanggan") : (r.vendor?.name || "Vendor")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-slate-900">{fmt(r.total)}</p>
                  {r.status && <Pill tone={STATUS_TONE[r.status] || "slate"}>{r.status}</Pill>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
