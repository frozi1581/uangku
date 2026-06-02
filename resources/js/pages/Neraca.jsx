import React, { useEffect, useState } from "react";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Pill, Btn, fmt } from "../components/ui";
import { reportApi } from "../lib/api";

function Section({ title, accent, items, total }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={`flex items-center justify-between px-6 py-4 ${accent}`}>
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
        <FileText className="h-5 w-5 text-white/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 && <div className="px-6 py-4 text-slate-400">Belum ada data.</div>}
        {items.map((r) => (
          <div key={r.code} className="flex items-center justify-between px-6 py-3.5 text-slate-700">
            <span><span className="text-slate-400">{r.code}</span> · {r.name}</span>
            <span className="tabular-nums font-medium">{fmt(r.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-slate-50 px-6 py-4 font-bold text-slate-900">
        <span>Total {title}</span><span className="tabular-nums">{fmt(total)}</span>
      </div>
    </div>
  );
}

export default function Neraca() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.balanceSheet().then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-400">Memuat neraca…</p>;
  if (!data) return <p className="text-rose-500">Gagal memuat neraca.</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pill tone="violet"><FileText className="h-3.5 w-3.5" /> Laporan keuangan</Pill>
          <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Neraca</h1>
          <p className="mt-1 text-slate-500">Per {data.as_of}</p>
        </div>
        <Btn variant="ghost">Ekspor PDF</Btn>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Aset" accent="bg-gradient-to-r from-emerald-500 to-teal-500" items={data.assets.items} total={data.assets.total} />
        <div className="space-y-6">
          <Section title="Liabilitas" accent="bg-gradient-to-r from-orange-500 to-pink-500" items={data.liabilities.items} total={data.liabilities.total} />
          <Section title="Ekuitas" accent="bg-gradient-to-r from-violet-500 to-indigo-500" items={data.equity.items} total={data.equity.total} />
        </div>
      </div>

      <div className={`mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 px-6 py-4 ${data.is_balanced ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>
        {data.is_balanced ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        <span className="font-semibold">
          {data.is_balanced
            ? `Neraca seimbang — Aset = Liabilitas + Ekuitas (${fmt(data.assets.total)})`
            : "Neraca belum seimbang — periksa jurnal."}
        </span>
      </div>
    </div>
  );
}
