"use client";

import { Briefcase, FileBadge, FilePlus2, FileText, FolderOpen, Plus, X } from "lucide-react";
import { UnggahDokumenMagang } from "./UnggahDokumenMagang";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PesanValidasi, useValidasiPendaftaran } from "./ValidasiPendaftaran";
import { PenandaKolom } from "./PenandaKolom";

export type BerkasPendaftaran = Record<string, File>;
const documentIcons = {
  surat_rekomendasi: FileBadge,
  proposal: FileText,
  portofolio: Briefcase,
  dokumen_tambahan: FolderOpen,
};

export function PendaftaranDokumenFields({ files, onChange, onReady }: { files: BerkasPendaftaran; onChange: (files: BerkasPendaftaran) => void; onReady?: (ready: boolean) => void }) {
  const { clearError } = useValidasiPendaftaran();
  const [specs, setSpecs] = useState<Record<string, { label: string; wajib: boolean }> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/magang/pendaftaran-info").then(res => { setSpecs(res.data.data.dokumen); onReady?.(true); })
      .catch(() => setError("Daftar dokumen belum dapat dimuat. Muat ulang formulir sebelum mengirim pendaftaran."));
  }, [onReady]);
  const documents = Object.entries(specs ?? {});
  const available = documents.filter(([key, spec]) => !spec.wajib && !selected.includes(key));

  function updateFile(key: string, file: File | null) {
    const next = { ...files };
    if (file) next[key] = file;
    else delete next[key];
    onChange(next);
  }

  return (
    <fieldset className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <legend className="px-1.5 text-sm font-bold text-slate-800 dark:text-white">Dokumen pendaftaran</legend>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!specs && !error && <p role="status" className="text-sm">Memuat persyaratan dokumen…</p>}
      {documents.filter(([key, spec]) => spec.wajib || selected.includes(key)).map(([key, spec]) => (
        <div key={key} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{spec.label}</span>
              <PenandaKolom wajib={spec.wajib} />
            </div>
            {!spec.wajib && <button type="button" className="rounded-md p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
              aria-label={`Hapus ${spec.label}`} onClick={() => {
                setSelected(previous => previous.filter(item => item !== key));
                clearError?.(key);
                updateFile(key, null);
              }}><X size={16} /></button>}
          </div>
          <UnggahDokumenMagang name={key} label={`Unggah ${spec.label}`} file={files[key]} onFile={file => updateFile(key, file)}
            maxMb={5} required={spec.wajib} />
        </div>
      ))}
      {available.length > 0 && (
        <div className="space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tambah dokumen opsional</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {available.map(([key, spec]) => {
              const Icon = documentIcons[key as keyof typeof documentIcons] ?? FilePlus2;
              return (
                <button key={key} type="button" onClick={() => setSelected(previous => [...previous, key])}
                  className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-400">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Icon size={16} /></span>
                  <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-100">{spec.label}</span>
                  <Plus size={15} className="shrink-0 text-slate-400 group-hover:text-blue-700" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </fieldset>
  );
}
export function AkunMagangFields({ username, onChange }: { username: string; onChange: (value: string) => void }) {
  const field = useValidasiPendaftaran().kolom("username");
  return <fieldset className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
    <legend className="font-semibold text-sm px-1">Akun APTIKA Tools</legend>
    <label className="block text-sm">Nama akun <PenandaKolom wajib /><div className="flex mt-1"><input {...field.attributes} required minLength={3} maxLength={64} pattern={String.raw`[a-z0-9][a-z0-9._\-]*`} value={username} onChange={e => onChange(e.target.value.toLowerCase())} placeholder="contoh: vanesa.rizka" className="min-w-0 flex-1 border border-slate-200 bg-white rounded-l-xl p-2.5 outline-none focus:border-blue-500 aria-[invalid=true]:border-rose-400" /><span className="border border-l-0 rounded-r-xl px-3 py-2 bg-slate-100">@magang.com</span></div><PesanValidasi {...field.feedback} /></label>
    <p className="text-xs text-slate-600">Email ini khusus login; email kontak pribadi tetap diisi pada identitas. Akun baru dibuat dan dapat digunakan setelah approval mentor. Jika diterima, password awal dikirim ke email kontak pribadi. Fitur peserta: Magang dan Manajemen Tugas Digital.</p>
  </fieldset>;
}
