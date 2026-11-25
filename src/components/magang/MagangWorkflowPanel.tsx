"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { MagangWorkflow, OpsiMagang, opsiMagang, seleksiMagang, validasiNdaMagang, sahkanMagang, aturPengingatMagang, aktivasiAkunMagang } from "@/services/magangWorkflow";
import { api } from "@/services/api";
import { MagangDokumenPanel } from "./MagangDokumenPanel";
import { MagangPenilaianPanel } from "./MagangPenilaianPanel";
import axios from "axios";
import { TautanDokumenMagang } from "./TautanDokumenMagang";

export function MagangWorkflowPanel({ participant: p, onSaved, onNda, section = "semua" }: {
  section?: "semua" | "proses" | "dokumen" | "penilaian";
  participant: MagangWorkflow; onSaved: (participant?: MagangWorkflow) => Promise<void>; onNda: () => void;
}) {
  const proses = section === "semua" || section === "proses";
  const dokumen = section === "semua" || section === "dokumen";
  const penilaian = section === "semua" || section === "penilaian";
  const { user, isAdminAptika } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<OpsiMagang | null>(null);
  const [note, setNote] = useState(p.catatan_seleksi || "");
  const [mentorId, setMentorId] = useState(String(p.mentor_id || user?.id || ""));
  const [matchingMajor, setMatchingMajor] = useState(false);
  const [notice, setNotice] = useState("");
  const [days, setDays] = useState((p.pengingat_hari ?? [14, 7]).join(", "));
  const [number, setNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const canManage = !user?.is_magang && (isAdminAptika || user?.role === "admin" || !p.mentor_id || p.mentor_id === user?.id);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const periodEnded = p.tgl_selesai?.slice(0, 10) <= today;
  const ndaBlocks = !!options?.nda_wajib_sebelum_penilaian && !p.nda_validated_at;
  const mentor = options?.mentors.find(m => m.id === Number(mentorId));
  const button = "rounded-lg bg-blue-700 text-white px-3 py-2 text-sm disabled:opacity-50";
  const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900";
  useEffect(() => {
    let active = true;
    if (user?.is_magang) return;
    opsiMagang(p.bidang_id).then(data => { if (active) setOptions(data); })
      .catch(() => { if (active) setError("Gagal memuat daftar mentor dan konfigurasi magang. Buka ulang detail untuk mencoba lagi."); });
    return () => { active = false; };
  }, [p.bidang_id, user?.is_magang]);
  const action = async (work: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { const result = await work(); const response = result as { data?: { warning?: string } };
      if (response?.data?.warning) setError(response.data.warning);
      else setNotice("Perubahan berhasil diproses.");
      await onSaved(); }
    catch (err) { setError(axios.isAxiosError(err) ? err.response?.data?.message || "Tindakan gagal disimpan." : "Tindakan gagal disimpan."); }
    finally { setBusy(false); }
  };
  const registrationFiles = p.lampiran_pendaftaran?.filter(file => file.jenis !== "pedoman_kampus");
  return <section className={section === "penilaian" ? "space-y-4" : "space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 [&_form]:rounded-2xl [&_form]:bg-slate-50/60 [&_form]:p-4 dark:[&_form]:bg-slate-800/40"}>
    {section !== "penilaian" && <>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{section === "dokumen" ? "Dokumen peserta" : "Pengelolaan magang"}</h3>
      <p className="text-sm text-slate-500">{section === "dokumen" ? "Berkas pendaftaran, NDA, dan dokumen akhir dalam satu tempat." : "Tinjau pendaftaran, kelola akun, dan pantau tindak lanjut magang."}</p>
    </>}
    {section === "semua" && <dl className="grid grid-cols-2 gap-2 text-sm">
      <dt>Akun login</dt><dd>{p.email_login || "Dibuat saat approval"}{p.user_id ? " · aktif" : " · menunggu approval mentor"}</dd>
      <dt>NIM / NIS</dt><dd>{p.nim || "Belum dilengkapi"}</dd>
      <dt>Jurusan</dt><dd>{p.jurusan || "Belum dilengkapi"}</dd>
      <dt>Laptop</dt><dd>{p.memiliki_laptop ? "Tersedia" : "Belum tersedia"}</dd>
      <dt>Email</dt><dd className="break-all">{p.email || "—"}</dd>
      <dt>Telepon</dt><dd>{p.telepon || "—"}</dd>
      <dt>Status seleksi</dt><dd className="capitalize">{p.status_seleksi}</dd>
      <dt>NDA</dt><dd>{p.nda_validated_at ? "Tervalidasi" : p.nda_file ? "Menunggu pemeriksaan" : "Belum diunggah"}</dd>
      <dt>Referensi draf NDA</dt><dd>{p.nomor_nda || "—"}</dd>
    </dl>}
    {dokumen && (p.cv_magang || !!registrationFiles?.length) && (
      <div className="space-y-2.5">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Berkas pendaftaran</h4>
        {p.cv_magang && <TautanDokumenMagang label="Curriculum vitae (CV)" href={p.cv_magang} />}
        {registrationFiles?.map(file => (
          <TautanDokumenMagang key={file.jenis} label={file.label} downloadFilename={file.nama} href={file.url} authenticated />
        ))}
      </div>
    )}
    {dokumen && p.nda_file && <TautanDokumenMagang label="NDA bertanda tangan" href={p.nda_file} />}
    {notice && <p role="status" className="text-sm text-blue-700">{notice}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {proses && p.status_seleksi === "menunggu" && canManage && <form className="space-y-3" onSubmit={e => { e.preventDefault(); action(() => seleksiMagang(p.id, "diterima", note, Number(mentorId), matchingMajor)); }}>
      <label className="block text-sm">Mentor penanggung jawab<select required className={field} value={mentorId} onChange={e => setMentorId(e.target.value)}>
        <option value="">Pilih mentor</option>{options?.mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select></label>
      <p className="text-xs text-slate-600">{mentor?.kuota != null ? `Batas yang dikonfigurasi untuk mentor ini: ${mentor.kuota} peserta bersamaan.` : "Kuota mentor belum ditetapkan. Pastikan kapasitas pendampingan tersedia sebelum menerima peserta."}</p>
      <label className="flex gap-2 text-sm"><input required type="checkbox" checked={matchingMajor} onChange={e => setMatchingMajor(e.target.checked)} />Saya telah meninjau CV, jurusan, laptop, dan kesesuaian penugasan. Jurusan peserta sesuai.</label>
      <p className="text-xs text-slate-600">Pastikan latar belakang pendidikan dan perangkat peserta sesuai kebutuhan penugasan.</p>
      <label className="block text-sm">Catatan seleksi<textarea maxLength={2000} value={note} onChange={e => setNote(e.target.value)} className={field} /></label>
      <div className="flex gap-2"><button disabled={busy || !options} className={button}>Terima peserta</button>
      <button type="button" disabled={busy} className={button} onClick={() => action(() => seleksiMagang(p.id, "ditolak", note))}>Tolak peserta</button></div>
    </form>}
    {proses && p.catatan_seleksi && <p className="text-sm">Catatan seleksi: {p.catatan_seleksi}</p>}
    {proses && p.status_seleksi === "ditolak" && canManage && <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"><h4 className="font-bold">Pemberitahuan hasil seleksi</h4><p>Email penolakan ditujukan ke {p.email}. Catatan seleksi internal tidak disertakan.</p><button type="button" disabled={busy} className={button} onClick={() => action(() => api.post(`/magang/${p.id}/pemberitahuan-penolakan`))}>Kirim ulang email penolakan</button></div>}
    {p.status_seleksi === "diterima" && <>
      {proses && !p.user_id && canManage && <button disabled={busy} className={button} onClick={() => action(() => aktivasiAkunMagang(p.id))}>Buat akun peserta lama yang sudah diterima</button>}
      {dokumen && <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm"><p className="font-semibold text-slate-800">Perjanjian kerahasiaan (NDA)</p><p className="mt-1 text-xs text-slate-500">Referensi draf: {p.nomor_nda || "Belum tersedia"} · {p.nda_validated_at ? "Tervalidasi" : p.nda_file ? "Menunggu pemeriksaan" : "Belum diunggah"}</p></div>}
      {dokumen && <div className="flex flex-wrap gap-2">
        <button className={button} onClick={onNda}>Cetak draf NDA dari data peserta</button>
        {p.nda_file && !p.nda_validated_at && canManage && <button disabled={busy} className={button} onClick={() => { if (confirm("Pastikan NDA telah ditandatangani pihak terkait sesuai template dinas. Validasi dokumen ini?")) action(() => validasiNdaMagang(p.id)); }}>Validasi NDA bertanda tangan</button>}
      </div>}
      {proses && p.user_id && canManage && <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><h4 className="font-bold !text-blue-950">Pemberitahuan penerimaan</h4><p>Tujuan: {p.email}. Berisi akun login, password awal, tautan login, dan petunjuk NDA. Pengiriman membutuhkan layanan email aktif; tombol ini tidak menjamin email sudah masuk inbox.</p><button className={button} disabled={busy} onClick={() => action(() => api.post(`/magang/${p.id}/pemberitahuan-penerimaan`))}>Kirim ulang email penerimaan dan petunjuk login</button></div>}
      {proses && p.pengingat && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{p.pengingat}</p>}
      {proses && canManage && <form className="space-y-2 border-t pt-3" onSubmit={e => {
        e.preventDefault();
        const schedule = days.trim() ? days.split(",").map(v => Number(v.trim())) : [];
        if (schedule.some(n => !Number.isInteger(n) || n < 1 || n > 60) || new Set(schedule).size !== schedule.length) { setError("Isi hari unik antara 1–60, dipisahkan koma, atau kosongkan untuk menonaktifkan pengingat sebelum selesai."); return; }
        action(() => aturPengingatMagang(p.id, schedule));
      }}>
        <label className="block text-sm">Pengingat sebelum akhir periode (hari, pisahkan koma)<input value={days} onChange={e => setDays(e.target.value)} placeholder="Contoh: 14, 7 atau 3, 2" className={field} /></label>
        <p className="text-xs text-slate-600">Pengingat hanya tampil pada dashboard dan detail peserta. Belum dikirim melalui email atau WhatsApp. Atur kapan pengingat ditampilkan.</p>
        <button disabled={busy} className={button}>Simpan pengingat</button>
      </form>}
      {penilaian && <MagangPenilaianPanel
        participant={p}
        isParticipant={!!user?.is_magang && p.user_id === user.id}
        isAdmin={!!user && !user.is_magang && user.role === "admin"}
        isAssignedMentor={!!user && !user.is_magang && p.mentor_id === user.id}
        canGrade={!!user && !user.is_magang && (isAdminAptika || user.role === "admin" || p.mentor_id === user.id)}
        periodEnded={periodEnded}
        ndaBlocks={ndaBlocks}
        optionsReady={!!options}
        onSaved={onSaved}
      />}
      {dokumen && <MagangDokumenPanel participant={p} isAdmin={user?.role === "admin"} canManage={canManage} busy={busy} action={action} />}
      {dokumen && p.dinilai_at && !p.disahkan_at && user?.role === "admin" && <form className="space-y-3 border-t pt-3" onSubmit={e => { e.preventDefault(); if (!file) return; const data = new FormData(); data.append("nomor_sertifikat", number); data.append("sertifikat_file", file); action(() => sahkanMagang(p.id, data)); }}>
        <h4 className="font-semibold">Catat pengesahan sertifikat</h4>
        <p className="text-sm">Unggah sertifikat yang telah disahkan Kepala Dinas dan gunakan nomor resmi dinas. Pencatatan oleh admin bukan tanda tangan elektronik.</p>
        <label className="block text-sm">Nomor sertifikat<input required maxLength={255} value={number} onChange={e => setNumber(e.target.value)} className={field} /></label>
        <label className="block text-sm">Sertifikat disahkan (PDF, maks. 10 MB)<input type="file" required accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full py-2" /></label>
        <button disabled={busy || ndaBlocks} className={button}>Simpan dokumen disahkan</button>
      </form>}
      {dokumen && p.disahkan_at && <p className="text-sm font-semibold text-green-800">Sertifikat disahkan · {p.nomor_sertifikat}</p>}
      {dokumen && p.sertifikat_file && <TautanDokumenMagang label="Sertifikat resmi" href={p.sertifikat_file} />}
    </>}
    {proses && !!p.riwayat_perubahan?.length && <details className="text-sm border-t pt-3"><summary className="cursor-pointer">Riwayat koreksi data</summary><ul className="space-y-2 mt-2">{p.riwayat_perubahan.map((entry, i) => <li key={i}>{new Date(entry.waktu).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} · pengguna #{entry.oleh} · {entry.kolom.join(", ")} · {entry.alasan || "Pembaruan data"}</li>)}</ul></details>}
  </section>;
}
