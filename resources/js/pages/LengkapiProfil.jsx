import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Phone, FileText, MapPin, ArrowRight } from "lucide-react";
import { Logo, Pill, Field, Btn, Blobs, GRADIENT } from "../components/ui";
import { authApi } from "../lib/api";
import { useAuth } from "../lib/auth";

// Lengkapi data perusahaan setelah login Google pertama kali.
export default function LengkapiProfil() {
  const { setUser, user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ company_name: "", npwp: "", phone: "", address: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await authApi.completeProfile(form);
      if (user) setUser({ ...user, profile_completed: true });
      nav("/dashboard");
    } catch (e) {
      setErr(e.response?.data?.message || "Gagal menyimpan. Periksa isian Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="relative flex items-center justify-center bg-slate-50 px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <Logo />
          <div className="mt-8">
            <Pill tone="violet"><Building2 className="h-3.5 w-3.5" /> Satu langkah lagi</Pill>
            <h2 className="mt-4 font-display text-3xl font-bold text-slate-900">Lengkapi data perusahaan</h2>
            <p className="mt-2 text-slate-500">Akun Anda sudah aktif dengan paket Free. Lengkapi info perusahaan untuk mulai.</p>
          </div>
          {err && <div className="mt-6 rounded-2xl border-2 border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{err}</div>}
          <div className="mt-6 space-y-4">
            <Field icon={Building2} label="Nama perusahaan" placeholder="PT Maju Jaya" value={form.company_name} onChange={set("company_name")} required />
            <Field icon={FileText} label="NPWP (opsional)" placeholder="00.000.000.0-000.000" value={form.npwp} onChange={set("npwp")} />
            <Field icon={Phone} label="Telepon (opsional)" placeholder="0812xxxxxxx" value={form.phone} onChange={set("phone")} />
            <Field icon={MapPin} label="Alamat (opsional)" placeholder="Alamat perusahaan" value={form.address} onChange={set("address")} />
            <Btn className="w-full" loading={loading} type="submit">Simpan & mulai <ArrowRight className="h-4 w-4" /></Btn>
          </div>
        </form>
      </div>
      <div className={`relative hidden overflow-hidden ${GRADIENT} lg:block`}>
        <Blobs />
        <div className="relative flex h-full flex-col justify-center p-12 text-white">
          <h1 className="font-display text-4xl font-bold leading-tight">Selamat datang<br />di Uangku!</h1>
          <p className="mt-5 max-w-md text-lg text-white/85">Paket Free Anda sudah aktif: hingga 100 transaksi/bulan. Mau lebih? Ajukan upgrade kapan saja dari menu di dalam.</p>
        </div>
      </div>
    </div>
  );
}
