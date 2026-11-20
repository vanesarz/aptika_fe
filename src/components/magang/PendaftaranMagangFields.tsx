"use client";

import type { ReactNode } from "react";
import { CalendarDays, FileCheck2, GraduationCap, ShieldCheck, UserRound } from "lucide-react";
import { IdentitasMagangFields, IdentitasMagang } from "./IdentitasMagangFields";
import { AkunMagangFields, BerkasPendaftaran, PendaftaranDokumenFields } from "./PendaftaranDokumenFields";
import { UnggahDokumenMagang } from "./UnggahDokumenMagang";
import { PasFotoMagang } from "./PasFotoMagang";
import { PenandaKolom } from "./PenandaKolom";

export interface DataPendaftaranMagang extends IdentitasMagang {
  nama: string; nama_kampus: string; bidang_id: string;
  tgl_mulai_magang: string; tgl_selesai_magang: string; keterangan: string;
}
const input = "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
function TanggalMagangField({ label, hint, value, min, onChange }: {
  label: string; hint: string; value: string; min?: string; onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} <PenandaKolom wajib />
      <span className="group relative block">
        <input required type="date" value={value} min={min} onChange={event => onChange(event.target.value)}
          className={`${input} ${value ? "" : "[&:not(:focus)::-webkit-datetime-edit]:opacity-0"}`} />
        {!value && <span aria-hidden="true" className="pointer-events-none absolute bottom-px left-px top-[7px] flex items-center rounded-l-xl bg-slate-50 pl-3.5 pr-2 text-sm font-normal text-slate-500 group-focus-within:hidden dark:bg-slate-900 dark:text-slate-400">{hint}</span>}
      </span>
    </label>
  );
}

export function PendaftaranMagangFields({ value, onChange, bidangs, username, onUsername, cv, onCv, files, onFiles, onReady, photo, onPhoto, latar, onLatar, bannerAction }: {
  value: DataPendaftaranMagang; onChange: (value: DataPendaftaranMagang) => void;
  bannerAction?: ReactNode;
  bidangs: { id: number; name: string; code?: string }[];
  username: string; onUsername: (value: string) => void; cv: File | null; onCv: (value: File | null) => void;
  files: BerkasPendaftaran; onFiles: (value: BerkasPendaftaran) => void; onReady: (ready: boolean) => void;
  photo: File | null; onPhoto: (value: File | null) => void; latar: string; onLatar: (value: string) => void;
}) {
  return <div className="space-y-6">
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-6 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <GraduationCap className="absolute -right-3 top-1 h-36 w-36 rotate-12 text-white/10" />
      </div>
      <div className="relative flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">APTIKA Tools · Pendaftaran peserta</span>
        {bannerAction && <div className="z-10 shrink-0">{bannerAction}</div>}
      </div>
      <h2 className="relative mt-2 text-2xl font-bold !text-white">Lengkapi pendaftaran magang</h2>
      <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-blue-100">Isi data diri, rencana magang, dan berkas pendukung. Mentor akan memeriksa pendaftaran sebelum akunmu diaktifkan.</p>
      <div className="relative mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-100"><span className="flex items-center gap-1.5"><UserRound size={14} />Data peserta</span><span className="flex items-center gap-1.5"><FileCheck2 size={14} />Pemeriksaan berkas</span><span className="flex items-center gap-1.5"><ShieldCheck size={14} />Approval mentor</span></div>
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[235px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <PasFotoMagang file={photo} onChange={onPhoto} latar={latar} onLatarChange={onLatar} />
        <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
          <p className="flex items-start gap-2">
            <span aria-hidden="true" className="flex w-[17px] shrink-0 justify-center text-base font-semibold leading-5 text-rose-600 dark:text-rose-400">*</span>
            <span>Kolom bertanda bintang wajib diisi atau diunggah.</span>
          </p>
          <p className="flex items-start gap-2 border-t border-blue-100 pt-3 dark:border-blue-900/60">
            <ShieldCheck size={17} aria-hidden="true" className="shrink-0" />
            <span>Isi nama dan NIM/NIS sesuai dokumen resmi sekolah atau kampus.</span>
          </p>
        </div>
      </aside>
      <div className="min-w-0 space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white"><UserRound size={17} className="text-blue-600" />Identitas utama</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama lengkap <PenandaKolom wajib /><input required maxLength={255} value={value.nama} onChange={e => onChange({ ...value, nama: e.target.value })} placeholder="Sesuai identitas resmi" className={input} autoComplete="name" /></label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kampus / sekolah <PenandaKolom wajib /><input required maxLength={255} value={value.nama_kampus} onChange={e => onChange({ ...value, nama_kampus: e.target.value })} placeholder="Nama institusi pendidikan" className={input} /></label>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4"><IdentitasMagangFields value={value} onChange={identity => onChange({ ...value, ...identity })} /></div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white"><CalendarDays size={17} className="text-blue-600" />Rencana penempatan</h3>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bidang tujuan <PenandaKolom wajib /><select required value={value.bidang_id} onChange={e => onChange({ ...value, bidang_id: e.target.value })} className={input}><option value="">Pilih bidang tujuan</option>{bidangs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TanggalMagangField label="Tanggal mulai" hint="Pilih tanggal mulai" value={value.tgl_mulai_magang}
              onChange={date => onChange({ ...value, tgl_mulai_magang: date })} />
            <TanggalMagangField label="Tanggal selesai" hint="Pilih tanggal selesai" value={value.tgl_selesai_magang}
              min={value.tgl_mulai_magang || undefined} onChange={date => onChange({ ...value, tgl_selesai_magang: date })} />
          </div>
        </section>
        <AkunMagangFields username={username} onChange={onUsername} />
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white"><FileCheck2 size={17} className="text-blue-600" />Curriculum vitae <PenandaKolom wajib /></h3>
          <UnggahDokumenMagang label="Unggah CV peserta (wajib)" file={cv} onFile={onCv}
            maxMb={2} required />
        </section>
        <PendaftaranDokumenFields files={files} onChange={onFiles} onReady={onReady} />
        <label className="block rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Keterangan tambahan <PenandaKolom /><textarea rows={3} value={value.keterangan} onChange={e => onChange({ ...value, keterangan: e.target.value })} placeholder="Informasi lain yang perlu diketahui mentor" className={input} /></label>
      </div>
    </div>
  </div>;
}
