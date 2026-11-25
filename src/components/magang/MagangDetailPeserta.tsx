"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardList, FileText, GraduationCap, LayoutGrid, Mail, UserRound } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { MagangWorkflow } from "@/services/magangWorkflow";
import { FotoPeserta } from "./PasFotoMagang";
import { MagangWorkflowPanel } from "./MagangWorkflowPanel";

const date = (value?: string, time = false) => {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } as const : {}) }).format(new Date(value));
};
const tabs = [{ id: "ringkasan", label: "Ringkasan", icon: LayoutGrid }, { id: "proses", label: "Proses magang", icon: ClipboardList }, { id: "dokumen", label: "Dokumen", icon: FileText }, { id: "penilaian", label: "Penilaian", icon: GraduationCap }] as const;
export function MagangDetailPeserta({ participant: p, onSaved, onNda, onUploadNda, onPrintCertificate }: {
  participant: MagangWorkflow; onSaved: (participant?: MagangWorkflow) => Promise<void>; onNda: () => void;
  onUploadNda: () => void; onPrintCertificate: () => void;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("ringkasan");
  const user = useAuthStore(state => state.user);
  const statuses = [
    ["Seleksi", p.status_seleksi === "diterima", p.status_seleksi === "ditolak" ? "Ditolak" : "Menunggu pemeriksaan"],
    ["NDA", !!p.nda_validated_at, p.nda_file ? "Menunggu validasi" : "Belum diunggah"],
    ["Penilaian", !!p.dinilai_at, "Belum diisi"],
    ["Sertifikat", !!p.disahkan_at, "Belum disahkan"],
  ] as const;
  return <div className="mx-auto max-w-6xl space-y-6 pb-5">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-lg sm:p-8">
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full border-[28px] border-white/5" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <FotoPeserta url={p.foto_url} nama={p.nama} />
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">Peserta magang</span><span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-medium text-amber-200">{p.status_magang || p.status_seleksi}</span></div>
          <h2 className="break-words text-2xl font-bold !text-white tracking-tight sm:text-3xl">{p.nama}</h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-blue-100"><GraduationCap size={17} className="mt-0.5 shrink-0" />{p.nama_kampus || "Institusi belum dilengkapi"}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-200"><span>NIM / NIS · {p.nim || "—"}</span><span className="flex items-center gap-1.5"><CalendarDays size={14} />{date(p.tgl_mulai)} – {date(p.tgl_selesai)}</span></div>
          <p className="mt-4 text-[11px] text-blue-200/80">Mendaftar {date(p.created_at, true)}</p>
        </div>
      </div>
    </header>
    <nav aria-label="Bagian detail peserta" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-900">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)} className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition ${tab === id ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200 dark:bg-blue-950 dark:text-blue-200" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"}`}><Icon size={16} />{label}</button>)}
    </nav>
    {tab === "ringkasan" && <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{statuses.map(([label, complete, pending]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-xs text-slate-500">{label}</p><CheckCircle2 size={17} className={complete ? "text-emerald-500" : "text-slate-300"} /></div><p className={`mt-2 text-sm font-semibold ${complete ? "text-emerald-700" : "text-slate-700 dark:text-slate-200"}`}>{complete ? "Selesai" : pending}</p></div>)}</div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Info title="Informasi peserta" icon={<UserRound size={17} />} rows={[["Jurusan", p.jurusan], ["Email kontak", p.email], ["Telepon", p.telepon], ["Alamat", p.alamat], ["Laptop", p.memiliki_laptop ? "Tersedia" : "Belum tersedia"]]} />
        <Info title="Penempatan dan akun" icon={<Mail size={17} />} rows={[["Bidang", p.bidang?.name], ["Mentor", p.mentor?.name], ["Email login", p.email_login || "Dibuat saat approval"], ["Status akun", p.user_id ? "Sudah dibuat" : "Menunggu approval"], ["Tanggal pendaftaran", date(p.created_at, true)]]} />
      </div>
      {p.status_seleksi === "diterima" && <section className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950 dark:border-blue-500/30 dark:bg-blue-950 dark:text-blue-100">
        <h3 className="font-bold !text-blue-950 dark:!text-blue-100">Penerimaan, akun login, dan NDA</h3>
        <p>Pemberitahuan ditujukan ke email pribadi: <strong>{p.email || "Belum dilengkapi"}</strong>.</p>
        <p>Email login: <strong>{p.email_login || "Belum dibuat"}</strong>. {p.user_id ? "Akun peserta sudah dibuat." : "Peserta lama ini belum memiliki akun. Pengelola perlu membuat akun melalui tab Proses magang terlebih dahulu."}</p>
        <p>Surat penerimaan tersedia di tab Dokumen setelah berkas resmi diunggah pengelola. Peserta juga mengurus NDA melalui tab tersebut.</p>
        <div className="flex flex-wrap gap-2">
          {!user?.is_magang && <button type="button" onClick={() => setTab("proses")} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold !text-white">{p.user_id ? "Buka pengiriman email penerimaan" : "Buka pembuatan akun peserta"}</button>}
          <button type="button" onClick={() => setTab("dokumen")} className="rounded-xl border border-blue-300 bg-white px-4 py-2 font-semibold text-blue-800">Buka surat penerimaan dan NDA</button>
        </div>
      </section>}
      {p.pengingat && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{p.pengingat}</div>}
      {p.keterangan && <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-2 text-sm font-bold text-slate-800">Keterangan</h3><p className="whitespace-pre-line text-sm text-slate-500">{p.keterangan}</p></div>}
    </div>}
    <div className={tab === "ringkasan" ? "hidden" : "space-y-4"}>
      {tab === "dokumen" && ((p.status_seleksi === "diterima" && !p.disahkan_at) || (!user?.is_magang && p.dinilai_at)) && <div className="flex flex-wrap gap-2">
        {p.status_seleksi === "diterima" && !p.disahkan_at && <button onClick={onUploadNda} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">Unggah NDA bertanda tangan</button>}
        {!user?.is_magang && p.dinilai_at && <button onClick={onPrintCertificate} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">Cetak draf sertifikat</button>}
      </div>}
      <MagangWorkflowPanel participant={p} section={tab === "ringkasan" ? "proses" : tab} onSaved={onSaved} onNda={onNda} />
      {p.status_seleksi !== "diterima" && (tab === "penilaian" || tab === "dokumen") && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Administrasi lanjutan tersedia setelah peserta diterima mentor.</p>}
    </div>
  </div>;
}
function Info({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: [string, string | undefined][] }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white"><span className="text-blue-600">{icon}</span>{title}</h3><dl className="space-y-3">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"><dt className="text-xs text-slate-500">{label}</dt><dd className="break-words text-sm font-medium text-slate-700 dark:text-slate-200">{value || "—"}</dd></div>)}</dl></section>;
}
