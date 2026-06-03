import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Receipt, History, FileText, TrendingUp, LogOut, Menu, X, ShieldCheck, Banknote, Scale } from "lucide-react";
import { Logo, Pill, GRADIENT } from "../components/ui";
import { useAuth } from "../lib/auth";
import { reportApi } from "../lib/api";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transaksi", label: "Input Transaksi", icon: Receipt },
  { to: "/pembayaran", label: "Pencairan & Pembayaran", icon: Banknote },
  { to: "/piutang-hutang", label: "Piutang & Hutang", icon: Scale },
  { to: "/riwayat", label: "Daftar Transaksi", icon: History },
  { to: "/neraca", label: "Laporan Neraca", icon: FileText },
  { to: "/arus-kas", label: "Arus Kas", icon: TrendingUp },
];

export default function Shell() {
  const { user, company, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    reportApi.usage().then((r) => setUsage(r.data)).catch(() => {});
  }, []);

  async function doLogout() {
    await logout();
    nav("/login");
  }

  const initial = (user?.name || "U").charAt(0).toUpperCase();
  const limit = usage?.transactions?.limit;
  const used = usage?.transactions?.used ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white p-6 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-6 w-6 text-slate-400" /></button>
        </div>
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Perusahaan</p>
          <p className="mt-1 font-bold text-slate-900">{company?.name || "—"}</p>
          {usage && <div className="mt-2"><Pill tone="violet">Paket {usage?.transactions?.limit === null ? "Ultimate" : "aktif"}</Pill></div>}
        </div>
        <nav className="mt-8 space-y-1.5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${isActive ? `${GRADIENT} text-white shadow-lg shadow-pink-500/25` : "text-slate-600 hover:bg-slate-100"}`}>
              <n.icon className="h-5 w-5" /> {n.label}
            </NavLink>
          ))}

          {user?.is_super_admin && (
            <>
              <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Super Admin</p>
              <NavLink to="/admin/approval" onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${isActive ? `${GRADIENT} text-white shadow-lg shadow-pink-500/25` : "text-slate-600 hover:bg-slate-100"}`}>
                <ShieldCheck className="h-5 w-5" /> Persetujuan
              </NavLink>
            </>
          )}
        </nav>
        <div className="absolute inset-x-6 bottom-6">
          <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100">
            <LogOut className="h-5 w-5" /> Keluar
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-6 w-6 text-slate-600" /></button>
          <div className="hidden lg:block">
            <p className="text-sm text-slate-400">Periode</p>
            <p className="font-display text-lg font-bold text-slate-900">{usage?.period || "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-right">
              <p className="text-xs text-slate-400">Kuota transaksi</p>
              <p className="font-bold text-slate-900">{used} <span className="text-slate-400">/ {limit === null ? "∞" : (limit ?? "—")}</span></p>
            </div>
            <div className={`grid h-11 w-11 place-items-center rounded-2xl ${GRADIENT} font-bold text-white`}>{initial}</div>
          </div>
        </header>
        <main className="p-6 lg:p-8"><Outlet /></main>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
