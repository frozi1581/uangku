import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, User, Mail, Lock, ArrowUpRight, ShieldCheck, Clock } from "lucide-react";
import { Logo, Pill, Field, Btn, Blobs, GRADIENT } from "../components/ui";
import { authApi } from "../lib/api";

export default function Register() {
  const [form, setForm] = useState({ company_name: "", name: "", email: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await authApi.register(form);
      setDone(true);
    } catch (e) {
      setErrors(e.response?.data?.errors || { general: [e.response?.data?.message || "Gagal mendaftar."] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="relative flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          <Logo />
          {!done ? (
            <form onSubmit={submit}>
              <div className="mt-8">
                <Pill tone="amber"><ShieldCheck className="h-3.5 w-3.5" /> Perlu persetujuan admin</Pill>
                <h2 className="mt-4 font-display text-3xl font-bold text-slate-900">Daftar perusahaan</h2>
                <p className="mt-2 text-slate-500">Buat akun via email. Akun aktif setelah disetujui super admin.</p>
              </div>
              {errors.general && (
                <div className="mt-6 rounded-2xl border-2 border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {errors.general[0]}
                </div>
              )}
              <div className="mt-6 space-y-4">
                <Field icon={Building2} label="Nama perusahaan" placeholder="PT Maju Jaya"
                  value={form.company_name} onChange={set("company_name")} error={errors.company_name?.[0]} required />
                <Field icon={User} label="Nama lengkap" placeholder="Budi Santoso"
                  value={form.name} onChange={set("name")} error={errors.name?.[0]} required />
                <Field icon={Mail} label="Email kerja" type="email" placeholder="budi@majujaya.com"
                  value={form.email} onChange={set("email")} error={errors.email?.[0]} required />
                <Field icon={Lock} label="Kata sandi" type="password" placeholder="Minimal 8 karakter"
                  value={form.password} onChange={set("password")} error={errors.password?.[0]} required />
                <Field icon={Lock} label="Ulangi kata sandi" type="password" placeholder="Ketik ulang"
                  value={form.password_confirmation} onChange={set("password_confirmation")} required />
                <Btn className="w-full" loading={loading} type="submit">
                  Kirim permintaan <ArrowUpRight className="h-4 w-4" />
                </Btn>
              </div>
              <div className="my-5 flex items-center gap-3 text-sm text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> atau <span className="h-px flex-1 bg-slate-200" />
              </div>
              <a href="/api/v1/auth/google/redirect"
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-300">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Daftar dengan Google (langsung aktif)
              </a>
              <p className="mt-8 text-center text-slate-500">
                Sudah punya akun? <Link to="/login" className="font-bold text-[#7C5CFF] hover:underline">Masuk</Link>
              </p>
            </form>
          ) : (
            <div className="mt-10 rounded-3xl border-2 border-emerald-100 bg-white p-8 text-center shadow-xl shadow-emerald-500/5">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100">
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-slate-900">Menunggu persetujuan</h3>
              <p className="mt-3 text-slate-500">
                Permintaan Anda terkirim. Super admin akan meninjau & mengaktifkan akun Anda.
              </p>
              <Link to="/login">
                <Btn variant="ghost" className="mt-6 w-full">Kembali ke halaman masuk</Btn>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className={`relative hidden overflow-hidden ${GRADIENT} lg:block`}>
        <Blobs />
        <div className="relative flex h-full flex-col justify-center p-12 text-white">
          <h1 className="font-display text-4xl font-bold leading-tight">Tiga langkah<br />mulai pakai Uangku</h1>
          <div className="mt-10 space-y-6">
            {[
              { n: "01", t: "Daftar via email", d: "Isi data perusahaan & akun admin." },
              { n: "02", t: "Disetujui super admin", d: "Tim verifikasi & aktifkan akun." },
              { n: "03", t: "Mulai catat transaksi", d: "Chart of accounts PSAK otomatis." },
            ].map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 font-display text-lg font-bold backdrop-blur">{s.n}</span>
                <div>
                  <p className="text-lg font-semibold">{s.t}</p>
                  <p className="text-white/75">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
