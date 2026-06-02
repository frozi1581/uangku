import React from "react";
import { Wallet } from "lucide-react";

export const GRADIENT = "bg-gradient-to-br from-[#FF7A59] via-[#FF5C8A] to-[#7C5CFF]";

export const fmt = (n) =>
  "Rp " + Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

export function Logo({ light }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${GRADIENT} shadow-lg shadow-pink-500/30`}>
        <Wallet className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <span className={`text-2xl font-bold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        Uang<span className="bg-gradient-to-r from-[#FF5C8A] to-[#7C5CFF] bg-clip-text text-transparent">ku</span>
      </span>
    </div>
  );
}

export function Pill({ tone = "amber", children }) {
  const tones = {
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    rose: "bg-rose-100 text-rose-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Field({ icon: Icon, label, error, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>}
      <div className={`group flex items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 transition focus-within:ring-4 focus-within:ring-violet-100 ${error ? "border-rose-300" : "border-slate-200 focus-within:border-[#7C5CFF]"}`}>
        {Icon && <Icon className="h-5 w-5 shrink-0 text-slate-400 group-focus-within:text-[#7C5CFF]" />}
        <input className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400" {...props} />
      </div>
      {error && <span className="mt-1 block text-sm text-rose-500">{error}</span>}
    </label>
  );
}

export function Btn({ children, variant = "primary", className = "", loading, ...props }) {
  const styles = {
    primary: `${GRADIENT} text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-0.5`,
    ghost: "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300",
    soft: "bg-violet-50 text-[#7C5CFF] hover:bg-violet-100",
  };
  return (
    <button
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition-all active:scale-[0.98] disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading ? "Memproses…" : children}
    </button>
  );
}

export function Blobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#FF7A59] to-[#FF5C8A] opacity-30 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#5CC8FF] opacity-30 blur-3xl" />
    </div>
  );
}
