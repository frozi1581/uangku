import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, FileText, ChevronRight, Sparkles } from "lucide-react";
import { Pill, fmt } from "../components/ui";
import { useAuth } from "../lib/auth";
import { reportApi } from "../lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [bs, setBs] = useState(null);
  const [cf, setCf] = useState(null);

  useEffect(() => {
    reportApi.balanceSheet().then((r) => setBs(r.data)).catch(() => {});
    reportApi.cashFlow().then((r) => setCf(r.data)).catch(() => {});
  }, []);

  const Stat = ({ label, value }) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-slate-900">{fmt(value)}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Pill tone="violet"><Sparkles className="h-3.5 w-3.5" /> Ringkasan</Pill>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Halo, {user?.name?.split(" ")[0] || "👋"} 👋</h1>
      <p className="mt-1 text-slate-500">Berikut kondisi keuangan perusahaan Anda.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Aset" value={bs?.assets?.total} />
        <Stat label="Total Liabilitas" value={bs?.liabilities?.total} />
        <Stat label="Total Ekuitas" value={bs?.equity?.total} />
        <Stat label="Kas Akhir Periode" value={cf?.closing_balance} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button onClick={() => nav("/transaksi")} className="group flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-lg">
          <div><Receipt className="h-7 w-7 text-[#7C5CFF]" /><p className="mt-3 font-display text-lg font-bold text-slate-900">Input transaksi</p><p className="text-slate-500">Catat invoice, PO, atau transaksi bank.</p></div>
          <ChevronRight className="h-6 w-6 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#7C5CFF]" />
        </button>
        <button onClick={() => nav("/neraca")} className="group flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-lg">
          <div><FileText className="h-7 w-7 text-emerald-500" /><p className="mt-3 font-display text-lg font-bold text-slate-900">Lihat laporan</p><p className="text-slate-500">Neraca & arus kas terkini.</p></div>
          <ChevronRight className="h-6 w-6 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500" />
        </button>
      </div>
    </div>
  );
}
