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

          <p className="mt-8 text-center text-slate-500">
            Belum punya akun?{" "}
            <Link to="/register" className="font-bold text-[#7C5CFF] hover:underline">Daftar sekarang</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
