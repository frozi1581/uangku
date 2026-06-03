import React, { useEffect, useState } from "react";
import { FileText, Inbox, AlertTriangle } from "lucide-react";
import { Pill, fmt } from "../components/ui";
import { reportApi } from "../lib/api";

const TABS = [
  { id: "receivable", label: "Piutang (dari Invoice)", tone: "from-emerald-400 to-teal-500" },
  { id: "payable", label: "Hutang (dari PO)", tone: "from-orange-400 to-pink-500" },
];

const BUCKETS = [
  { key: "current", label: "Belum jatuh tempo" },
  { key: "d1_30", label: "1–30 hari" },
  { key: "d31_60", label: "31–60 hari" },
  { key: "d61_90", label: "61–90 hari" },
  { key: "over_90", label: "> 90 hari" },
];

const tgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");

export default function Piutang() {
  const [tab, setTab] = useState("receivable");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const call = tab === "receivable" ? reportApi.receivables() : reportApi.payables();
    call
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const isAR = tab === "receivable";
  const items = data?.items || [];

  return (
    <div className="mx-auto max-w-4xl">
      <Pill tone="violet"><FileText className="h-3.5 w-3.5" /> Laporan</Pill>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Laporan Piutang & Hutang</h1>
      <p className="mt-1 text-slate-500">Umur tagihan berdasarkan tanggal jatuh tempo (aging) per hari ini.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-2xl border-2 p-4 text-left transition ${tab === t.id ? `border-transparent text-white shadow-lg bg-gradient-to-br ${t.tone}` : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
            <FileText className="h-5 w-5" />
            <p className="mt-2 font-semibold">{t.label}</p>
          </button>
        ))}
      </div>

      {/* ringkasan total + aging buckets */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-slate-500">Total {isAR ? "piutang" : "hutang"} belum tertagih</p>
          <p className="font-display text-2xl font-bold text-slate-900">{fmt(data?.total_outstanding || 0)}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {BUCKETS.map((b) => (
            <div key={b.key} className="rounded-2xl bg-slate-50 p-3 text-center">
              <p className="text-xs font-medium text-slate-400">{b.label}</p>
              <p className="mt-1 font-bold text-slate-800">{fmt(data?.aging?.[b.key] || 0)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* daftar dokumen */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100"><Inbox className="h-7 w-7 text-slate-400" /></div>
            <p className="font-semibold text-slate-600">Tidak ada {isAR ? "piutang" : "hutang"}</p>
            <p className="text-sm text-slate-400">Semua tagihan sudah lunas.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{d.no}<span className="font-normal text-slate-400"> · {d.party || "—"}</span></p>
                  <p className="text-sm text-slate-400">
                    {tgl(d.date)} · jatuh tempo {tgl(d.due_date)}
                    {d.days_overdue > 0 && (
                      <span className="ml-1 inline-flex items-center gap-1 font-semibold text-rose-500">
                        <AlertTriangle className="h-3 w-3" /> telat {d.days_overdue} hari
                      </span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold tabular-nums text-slate-900">{fmt(d.outstanding)}</p>
                  {d.paid_amount > 0 && <p className="text-xs text-slate-400">sisa dari {fmt(d.total)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
