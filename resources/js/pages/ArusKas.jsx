import React, { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Pill, Btn, fmt, GRADIENT } from "../components/ui";
import { reportApi } from "../lib/api";

export default function ArusKas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.cashFlow().then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-400">Memuat arus kas…</p>;
  if (!data) return <p className="text-rose-500">Gagal memuat arus kas.</p>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pill tone="violet"><TrendingUp className="h-3.5 w-3.5" /> Laporan keuangan</Pill>
          <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Laporan Arus Kas</h1>
          <p className="mt-1 text-slate-500">{data.period.from} — {data.period.to}</p>
        </div>
        <Btn variant="ghost">Ekspor PDF</Btn>
      </div>

      <div className={`mt-6 overflow-hidden rounded-3xl ${GRADIENT} p-8 text-white shadow-xl shadow-pink-500/25`}>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-white/75">Kas awal periode</p>
            <p className="mt-1 font-display text-2xl font-bold">{fmt(data.opening_balance)}</p>
          </div>
          <div>
            <p className="text-white/75">Perubahan kas bersih</p>
            <p className="mt-1 font-display text-2xl font-bold">{data.net_change >= 0 ? "+" : ""}{fmt(data.net_change)}</p>
          </div>
          <div>
            <p className="text-white/75">Kas akhir periode</p>
            <p className="mt-1 font-display text-3xl font-bold">{fmt(data.closing_balance)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-500">{data.note}</p>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="font-medium text-slate-600">Saldo awal</span>
            <span className="font-semibold tabular-nums text-slate-900">{fmt(data.opening_balance)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="font-medium text-slate-600">Arus kas masuk/keluar bersih</span>
            <span className={`font-semibold tabular-nums ${data.net_change >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {data.net_change >= 0 ? "+" : ""}{fmt(data.net_change)}
            </span>
          </div>
          <div className="flex justify-between pt-2 text-lg font-bold text-slate-900">
            <span>Saldo akhir kas & bank</span>
            <span className="tabular-nums">{fmt(data.closing_balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
