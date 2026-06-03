import "../css/app.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Shell from "./pages/Shell";
import Dashboard from "./pages/Dashboard";
import Transaksi from "./pages/Transaksi";
import Riwayat from "./pages/Riwayat";
import Neraca from "./pages/Neraca";
import ArusKas from "./pages/ArusKas";
import Approval from "./pages/admin/Approval";
import GoogleSuccess from "./pages/GoogleSuccess";
import LengkapiProfil from "./pages/LengkapiProfil";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-slate-400">Memuat…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-slate-400">Memuat…</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Public><Login /></Public>} />
        <Route path="/register" element={<Public><Register /></Public>} />
        <Route path="/auth/google/success" element={<GoogleSuccess />} />
        <Route path="/lengkapi-profil" element={<Protected><LengkapiProfil /></Protected>} />
        <Route element={<Protected><Shell /></Protected>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transaksi" element={<Transaksi />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/neraca" element={<Neraca />} />
          <Route path="/arus-kas" element={<ArusKas />} />
          <Route path="/admin/approval" element={<Approval />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const el = document.getElementById("app");
if (el) {
  createRoot(el).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
