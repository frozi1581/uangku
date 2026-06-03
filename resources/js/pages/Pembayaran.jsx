import React, { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Inbox, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Pill, Field, Btn, fmt, NumberInput } from "../components/ui";
import { masterApi, reportApi, txApi } from "../lib/api";

const TABS = [
  { id: "invoice", label: "Pencairan Invoice (Piutang)", tone: "from-emerald-400 to-teal-500", icon: ArrowDownToLine },
  { id: "purchase_order", label: "Pembayaran Hutang (PO)", tone: "from-orange-400 to-pink-500", icon: ArrowUpFromLine },
];

const tgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");

export default function Pembayaran() {
  const [tab, setTab] = useState("invoice");
  const [docs, setDocs] = useState([]);
  const [banks, setBanks] = useState([]);
  const [sel, setSel] = useState(null); // dokumen terpilih
  const [bankId, setBankId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  function loadBanks() {
    masterApi.bankAccounts().then((r) => setBanks(r.data)).catch(() => {});
  }

  function loadDocs() {
    setListLoading(true);
    const call = tab === "invoice" ? reportApi.receivables() : reportApi.payables();
    call
      .then((r) => setDocs(r.data.items || []))
      .catch(() => setDocs([]))
      .finally(() => setListLoading(false));
  }

  useEffect(() => { loadBanks(); }, []);
  useEffect(() => { setSel(null); setAmount(0); loadDocs(); /* eslint-disable-next-line */ }, [tab]);

  function pick(d) {
    setSel(d);
    setAmount(d.outstanding); // default: lunasi penuh
    setMsg(null);
  }

  async function submit() {
    setMsg(null);
    if (!sel) { setMsg({ ok: false, text: "Pilih dokumen yang akan dibayar dulu." }); return; }
    if (!bankId) { setMsg({ ok: false, text: "Pilih akun kas/bank dulu." }); return; }
    if (!(amount > 0)) { setMsg({ ok: false, text: "Jumlah harus lebih dari nol." }); return; }
    if (amount - sel.outstanding > 0.001) { setMsg({ ok: false, text: `Jumlah melebihi sisa tagihan (${fmt(sel.outstanding)}).` }); return; }

    setLoading(true);
    try {
      const r = await txApi.createPayment({
        payable_type: tab,
        payable_id: sel.id,
        bank_account_id: Number(bankId),
        date,
        amount,
        reference: reference || null,
      });
      const verb = tab === "invoice" ? "Penerimaan" : "Pembayaran";
      setMsg({ ok: true, text: `${verb} ${r.data.payment_no} tersimpan. Saldo kas/bank diperbarui.` });
      setSel(null); setAmount(0); setReference("");
      loadDocs(); loadBanks();
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || "Gagal menyimpan pembayaran." });
    } finally {
      setLoading(false);
    }
  }

  const isInvoice = tab === "invoice";

  return (
    <div className="mx-auto max-w-4xl">
      <Pill tone="violet"><Banknote className="h-3.5 w-3.5" /> Pembayaran</Pill>
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Pencairan & Pembayaran</h1>
      <p className="mt-1 text-slate-500">Cairkan piutang invoice atau bayar hutang PO. Saldo kas/bank otomatis menyesuaikan.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg(null); }}
              className={`rounded-2xl border-2 p-4 text-left transition ${tab === t.id ? `border-transparent text-white shadow-lg bg-gradient-to-br ${t.tone}` : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
              <Icon className="h-5 w-5" />
              <p className="mt-2 font-semibold">{t.label}</p>
            </button>
          );
        })}
      </div>

      {msg && (
        <div className={`mt-6 rounded-2xl border-2 px-4 py-3 text-sm font-medium ${msg.ok ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-600"}`}>
          {msg.text}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* daftar dokumen outstanding */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="font-semibold text-slate-700">{isInvoice ? "Invoice belum lunas" : "PO belum dibayar"}</p>
          </div>
          {listLoading ? (
            <div className="p-10 text-center text-slate-400">Memuat…</div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100"><Inbox className="h-6 w-6 text-slate-400" /></div>
              <p className="font-semibold text-slate-600">Tidak ada tagihan</p>
              <p className="text-sm text-slate-400">{isInvoice ? "Semua invoice sudah lunas." : "Semua PO sudah dibayar."}</p>
            </div>
          ) : (
            <div className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
              {docs.map((d) => {
                const active = sel?.id === d.id;
                return (
                  <button key={d.id} onClick={() => pick(d)}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition ${active ? "bg-violet-50" : "hover:bg-slate-50"}`}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{d.no}<span className="font-normal text-slate-400"> · {d.party || "—"}</span></p>
                      <p className="text-sm text-slate-400">
                        Jatuh tempo {tgl(d.due_date)}
                        {d.days_overdue > 0 && <span className="ml-1 font-semibold text-rose-500">· telat {d.days_overdue} hari</span>}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold tabular-nums text-slate-900">{fmt(d.outstanding)}</p>
                      {d.paid_amount > 0 && <p className="text-xs text-slate-400">dari {fmt(d.total)}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* form pembayaran */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {!sel ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center text-slate-400">
              <Banknote className="h-8 w-8" />
              <p className="font-medium">Pilih {isInvoice ? "invoice" : "PO"} di sebelah kiri untuk {isInvoice ? "mencairkan" : "membayar"}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-800">{sel.no}</p>
                <p className="text-sm text-slate-500">{sel.party}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-500">Total</span><span className="font-medium text-slate-700">{fmt(sel.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sudah dibayar</span><span className="font-medium text-slate-700">{fmt(sel.paid_amount)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                  <span>Sisa tagihan</span><span>{fmt(sel.outstanding)}</span>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">{isInvoice ? "Cairkan ke kas/bank" : "Bayar dari kas/bank"}</span>
                <select className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#7C5CFF]"
                  value={bankId} onChange={(e) => setBankId(e.target.value)}>
                  <option value="">Pilih akun</option>
                  {banks.map((b) => <option key={b.id} value={b.id}>{b.bank_name} — {b.account_number} ({fmt(b.current_balance)})</option>)}
                </select>
              </label>

              <Field label="Tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Jumlah {isInvoice ? "diterima" : "dibayar"}</span>
                <NumberInput className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-right outline-none focus:border-[#7C5CFF]"
                  value={amount} onValueChange={setAmount} />
                <span className="mt-1 block text-xs text-slate-400">Boleh sebagian (cicilan). Default = sisa tagihan penuh.</span>
              </label>

              <Field label="Referensi (opsional)" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="cth. no. bukti transfer" />

              <Btn className="w-full" loading={loading} onClick={submit}>
                {isInvoice ? "Catat penerimaan" : "Catat pembayaran"} <CheckCircle2 className="h-4 w-4" />
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
