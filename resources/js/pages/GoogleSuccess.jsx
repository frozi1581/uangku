import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "../lib/api";
import { Logo } from "../components/ui";

// Halaman transit setelah callback Google: simpan token, arahkan sesuai status profil.
export default function GoogleSuccess() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const completed = params.get("completed") === "1";
    if (token) {
      setToken(token);
      // reload penuh agar AuthProvider memuat ulang /auth/me dengan token baru
      window.location.href = completed ? "/dashboard" : "/lengkapi-profil";
    } else {
      nav("/login?error=Token tidak ditemukan");
    }
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="text-center">
        <Logo />
        <p className="mt-6 text-slate-400">Menyiapkan akun Anda…</p>
      </div>
    </div>
  );
}
