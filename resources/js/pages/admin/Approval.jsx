import React, { useEffect, useState } from "react";
import { ShieldCheck, Building2, Mail, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { Pill, Btn, fmt, GRADIENT } from "../../components/ui";
import { adminApi } from "../../lib/api";

const STATUS_TABS = [
  { id: "trial", label: "Menunggu", icon: Clock, tone: "amber" },
  { id: "active", label: "Aktif", icon: CheckCircle2, tone: "green" },
  { id: "suspended", label: "Ditolak", icon: XCircle, tone: "rose" },
];

function ApproveModal({ company, plans, onClose, onDone }) {
  const [planCode, setPlanCode] = useState("free");
  const [price, setPrice] = useState("");
  const [maxTx, setMaxTx] = useState("");
  const [maxRep, setMaxRep] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const plan = plans.find((p) => p.code === planCode);
  const customizable = plan?.is_customizable;

  async function submit() {
    setLoading(true);
    setErr("");
    try {
      const body = { plan_code: planCode };
      if (customizable) {
        if (price !== "") body.price = +price;
        if (maxTx !== "") body.max_transactions = +maxTx;
        if (maxRep !== "") body.max_reports = +maxRep;
      }
      await adminApi.approve(company.id, body);
      onDone();
    } catch (e) {
      setErr(e.response?.data?.message || "Gagal menyetujui.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold text-slate-900">Setujui {company.name}</h3>
        <p className="mt-1 text-sm text-slate-500">Pilih paket langganan untuk perusahaan ini.</p>

        {err && <div className="mt-4 rounded-2xl border-2 border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600">{err}</div>}

        <div className="mt-5 grid grid-cols-3 gap-2">
          {plans.map((p) => (
            <button key={p.code} onClick={() => setPlanCode(p.code)}
              className={`rounded-2xl border-2 p-3 text-left transition ${planCode === p.code ? "border-[#7C5CFF] bg-violet-50" : "border-slate-200 hover:border-slate-300"}`}>
              <p className="font-bold capitalize text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500">{p.max_transactions === null ? "Unlimited" : p.max_transactions + " tx"}</p>
            </button>
          ))}
        </div>

        {customizable && (
          <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Atur khusus (Premium)</p>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-xs text-slate-500">Harga</span>
                <input type="number" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-2 py-2 text-sm outline-none focus:border-[#7C5CFF]" placeholder={plan.price} value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Maks tx</span>
                <input type="number" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-2 py-2 text-sm outline-none focus:border-[#7C5CFF]" placeholder={plan.max_transactions} value={maxTx} onChange={(e) => setMaxTx(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Maks lap.</span>
                <input type="number" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-2 py-2 text-sm outline-none focus:border-[#7C5CFF]" placeholder={plan.max_reports} value={maxRep} onChange={(e) => setMaxRep(e.target.value)} />
              </label>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Btn variant="ghost" className="flex-1" onClick={onClose}>Batal</Btn>
          <Btn className="flex-1" loading={loading} onClick={submit}>Setujui & aktifkan</Btn>
        </div>
      </div>
    </div>
  );
}

export default function Approval() {
  const [tab, setTab] = useState("trial");
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(null);

  function load() {
    setLoading(true);
    adminApi.registrations(tab)
      .then((r) => setCompanies(r.data.data || []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [tab]);
  useEffect(() => { adminApi.plans().then((r) => setPlans(r.data)).catch(() => {}); }, []);

  async function reject(company) {
    if (!confirm(`Tolak registrasi ${company.name}?`)) return;
    setBusy(company.id);
    try {
      await adminApi.reject(company.id, {});
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Gagal menolak.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Pill tone="violet"><ShieldCheck className="h-3.5 w-3.5" /> Super Admin</Pill>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Persetujuan Registrasi</h1>
      <p className="mt-1 text-slate-500">Tinjau & aktifkan perusahaan yang mendaftar.</p>

      <div className="mt-6 flex gap-2">
        {STATUS_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold transition ${tab === t.id ? `${GRADIENT} text-white shadow-lg shadow-pink-500/25` : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading && <p className="text-slate-400">Memuat…</p>}
        {!loading && companies.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
            Tidak ada perusahaan dengan status ini.
          </div>
        )}
        {companies.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${GRADIENT} text-white`}>
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-slate-900">{c.name}</p>
                <p className="text-sm text-slate-400">Kode: {c.code}</p>
                {c.users?.map((u) => (
                  <p key={u.id} className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5" /> {u.name} · {u.email}
                  </p>
                ))}
              </div>
            </div>
            {tab === "trial" && (
              <div className="flex gap-2">
                <Btn variant="ghost" loading={busy === c.id} onClick={() => reject(c)}>
                  <XCircle className="h-4 w-4" /> Tolak
                </Btn>
                <Btn onClick={() => setModal(c)}>
                  <CheckCircle2 className="h-4 w-4" /> Setujui
                </Btn>
              </div>
            )}
            {tab === "active" && <Pill tone="green"><CheckCircle2 className="h-3.5 w-3.5" /> Aktif</Pill>}
            {tab === "suspended" && <Pill tone="rose"><XCircle className="h-3.5 w-3.5" /> Ditolak</Pill>}
          </div>
        ))}
      </div>

      {modal && <ApproveModal company={modal} plans={plans} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </div>
  );
}
