import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ChevronRight, Sparkles } from "lucide-react";
import { Logo, Pill, Field, Btn, Blobs, GRADIENT } from "../components/ui";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.response?.data?.message || "Gagal masuk. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className={`relative hidden overflow-hidden ${GRADIENT} lg:block`}>
        <Blobs />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo light />
          <div>
            <h1 className="font-display text-5xl font-bold leading-[1.1]">
              Keuangan bisnis,<br />tanpa pusing.
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/85">
              Catat transaksi, pantau arus kas, dan susun neraca otomatis — semua dalam satu tempat.
            </p>
          </div>
          <p className="text-sm text-white/60">© 2026 Uangku · PSAK compliant</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-slate-50 px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="lg:hidden"><Logo /></div>
          <div className="mt-8 lg:mt-0">
            <Pill tone="violet"><Sparkles className="h-3.5 w-3.5" /> Selamat datang kembali</Pill>
            <h2 className="mt-4 font-display text-3xl font-bold text-slate-900">Masuk ke akun Anda</h2>
            <p className="mt-2 text-slate-500">Kelola keuangan perusahaan Anda hari ini.</p>
          </div>

          {err && (
            <div className="mt-6 rounded-2xl border-2 border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {err}
            </div>
          )}

          <div className="mt-6 space-y-5">
            <Field icon={Mail} label="Email" type="email" placeholder="nama@perusahaan.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field icon={Lock} label="Kata sandi" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Btn className="w-full" loading={loading} type="submit">
              Masuk <ChevronRight className="h-4 w-4" />
            </Btn>
          </div>

          <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> atau <span className="h-px flex-1 bg-slate-200" />
          </div>
          <a href="/api/v1/auth/google/redirect"
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Masuk dengan Google
          </a>

          <p className="mt-8 text-center text-slate-500">
            Belum punya akun?{" "}
            <Link to="/register" className="font-bold text-[#7C5CFF] hover:underline">Daftar sekarang</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
