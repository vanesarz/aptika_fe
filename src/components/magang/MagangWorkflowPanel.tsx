"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { MagangWorkflow, NilaiMagang, OpsiMagang, opsiMagang, seleksiMagang, validasiNdaMagang, nilaiMagang, sahkanMagang, aturPengingatMagang, aturStatusKampus, aktivasiAkunMagang } from "@/services/magangWorkflow";
import { api } from "@/services/api";
import { MagangDokumenPanel, escapeMagangHtml as esc } from "./MagangDokumenPanel";
import axios from "axios";

export function MagangWorkflowPanel({ participant: p, onSaved, onNda, section = "semua" }: {
  section?: "semua" | "proses" | "dokumen" | "penilaian";
  participant: MagangWorkflow; onSaved: () => Promise<void>; onNda: () => void;
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
  const [values, setValues] = useState<NilaiMagang[]>(p.penilaian?.length ? p.penilaian : [{ aspek: "", nilai: "", skala: "" }]);
  const [format, setFormat] = useState(p.format_penilaian || (p.penilaian?.length ? "Format sebelumnya" : ""));
  const [evaluationNote, setEvaluationNote] = useState(p.catatan_penilaian || "");
  const [campusRequired, setCampusRequired] = useState(!!p.kampus_perlu_input);
  const [campusDone, setCampusDone] = useState(!!p.kampus_sudah_input);
  const [campusLink, setCampusLink] = useState(p.kebutuhan_kampus?.link || "");
  const [campusGuide, setCampusGuide] = useState(p.kebutuhan_kampus?.panduan || "");
  const [campusFile, setCampusFile] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [days, setDays] = useState((p.pengingat_hari ?? [14, 7]).join(", "));
  const [number, setNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const canManage = !user?.is_magang && (isAdminAptika || user?.role === "admin" || !p.mentor_id || p.mentor_id === user?.id);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const periodEnded = p.tgl_selesai?.slice(0, 10) <= today;
  const ndaBlocks = !!options?.nda_wajib_sebelum_penilaian && !p.nda_validated_at;
  const totalWeight = values.reduce((sum, row) => sum + (row.bobot === undefined ? 0 : Number(row.bobot)), 0);
  const weightedTotal = values.reduce((sum, row) => sum + (row.bobot === undefined ? 0 : Number(row.nilai || 0) * Number(row.bobot) / 100), 0);
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
  const printGrades = () => {
    const popup = window.open("", "_blank");
    if (!popup) { setError("Izinkan pop-up untuk mencetak lembar nilai."); return; }
    popup.document.write(`<html lang="id"><head><title>Lembar nilai magang</title><style>body{font-family:Arial;padding:40px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:12px;text-align:left}</style></head><body><h1>Lembar Nilai Magang</h1><p>${esc(p.nama)} · ${esc(p.nim)} · ${esc(p.nama_kampus)}</p><p>Format: ${esc(p.format_penilaian || "Format sebelumnya")}</p><table><tr><th>Aspek</th><th>Nilai</th><th>Bobot %</th><th>Nilai × bobot</th><th>Skala / keterangan</th></tr>${(p.penilaian ?? []).map(row => `<tr><td>${esc(row.aspek)}</td><td>${esc(row.nilai)}</td><td>${esc(row.bobot ?? "—")}</td><td>${row.bobot !== undefined ? (Number(row.nilai) * row.bobot / 100).toFixed(2) : "—"}</td><td>${esc(row.skala || "—")}</td></tr>`).join("")}</table>${p.ringkasan_nilai ? `<p>Total nilai terbobot: ${esc(p.ringkasan_nilai.total_terbobot)} · Total bobot: ${esc(p.ringkasan_nilai.total_bobot)}% (tidak dinormalisasi)</p>` : ""}<p>${esc(p.catatan_penilaian)}</p><p>Dokumen hasil evaluasi. Pengesahan mengikuti prosedur dinas. Kebutuhan input pada sistem kampus tetap mengikuti ketentuan kampus.</p></body></html>`);
    popup.document.close(); popup.print();
  };
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 [&_form]:rounded-2xl [&_form]:bg-slate-50/60 [&_form]:p-4 dark:[&_form]:bg-slate-800/40">
    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{section === "dokumen" ? "Dokumen peserta" : section === "penilaian" ? "Evaluasi dan penilaian" : "Pengelolaan magang"}</h3>
    <p className="text-sm text-slate-500">{section === "dokumen" ? "Berkas pendaftaran, NDA, dan dokumen akhir dalam satu tempat." : section === "penilaian" ? "Kelola penilaian sesuai format yang digunakan peserta." : "Tinjau pendaftaran, kelola akun, dan pantau tindak lanjut magang."}</p>
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
    {dokumen && !!p.lampiran_pendaftaran?.length && <div className="rounded-lg border p-3 space-y-2"><h4 className="font-semibold text-sm">Berkas pendaftaran</h4>
      {p.lampiran_pendaftaran.map(file => <button key={file.jenis} type="button" className="block text-sm text-blue-700 underline" onClick={async () => {
        try { const result = await api.get(file.url, { responseType: "blob" }); const url = URL.createObjectURL(result.data); const link = document.createElement("a"); link.href = url; link.download = file.nama; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
        catch { setError("Berkas tidak dapat diunduh."); }
      }}>{file.label} · {file.nama}</button>)}
    </div>}
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
      {penilaian && <div className="space-y-3 rounded-xl border p-4">
        <h4 className="font-semibold">Kebutuhan penilaian dari kampus</h4>
        {p.kebutuhan_kampus?.link && <a className="block text-sm text-blue-700 underline" href={p.kebutuhan_kampus.link} target="_blank" rel="noopener noreferrer">Buka tautan penilaian kampus</a>}
        {p.kebutuhan_kampus?.panduan && <p className="whitespace-pre-wrap text-sm">{p.kebutuhan_kampus.panduan}</p>}
        {p.lampiran_pendaftaran?.filter(f => f.jenis === "pedoman_kampus").map(f => <button key={f.jenis} className="text-sm text-blue-700 underline" onClick={() => action(async () => { const res = await api.get(f.url, { responseType: "blob" }); const url = URL.createObjectURL(res.data); const a = document.createElement("a"); a.href = url; a.download = f.nama; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); })}>Unduh {f.nama}</button>)}
        {canManage && <form className="space-y-3" onSubmit={e => { e.preventDefault(); action(() => { const data = new FormData(); data.append("link", campusLink); data.append("panduan", campusGuide); if (campusFile) data.append("dokumen", campusFile); return api.post(`/magang/${p.id}/kebutuhan-kampus`, data); }); }}>
          <label className="block text-sm">Tautan formulir/sistem kampus<input type="url" maxLength={2000} value={campusLink} onChange={e => setCampusLink(e.target.value)} className={field} placeholder="https://…" /></label>
          <label className="block text-sm">Detail permintaan dan pedoman/panduan<textarea maxLength={10000} value={campusGuide} onChange={e => setCampusGuide(e.target.value)} className={field} placeholder="Aspek, skala, cara pengisian, tenggat, dan petunjuk pengumpulan dari kampus" /></label>
          <label className="block text-sm">Dokumen/formulir/pedoman kampus (PDF/DOC/DOCX, maksimal 10 MB)<input type="file" accept=".pdf,.doc,.docx" onChange={e => setCampusFile(e.target.files?.[0] || null)} className={field} /></label>
          <button disabled={busy} className={button}>Simpan kebutuhan kampus</button>
        </form>}
      </div>}
      {penilaian && !p.disahkan_at && canManage && <form className="space-y-3 border-t pt-3" onSubmit={e => {
        e.preventDefault(); action(() => nilaiMagang(p.id, { penilaian: values, format_penilaian: format, catatan_penilaian: evaluationNote, kampus_perlu_input: campusRequired, kampus_sudah_input: campusDone }));
      }}>
        <h4 className="font-semibold">Evaluasi sesuai format dinas atau kampus</h4>
        <p className="text-xs text-slate-600">Aspek dan skala dapat disesuaikan. Pilih preset Telkom jika sesuai, atau isi format lain. Preset Telkom bukan rubrik resmi seluruh Diskominfo.</p>
        {!periodEnded && <p className="text-sm text-amber-800">Penilaian dapat disimpan setelah periode magang selesai.</p>}
        {ndaBlocks && <p className="text-sm text-amber-800">Konfigurasi saat ini mensyaratkan NDA tervalidasi sebelum penilaian.</p>}
        <label className="block text-sm">Pilih format penilaian<select className={field} value={format.startsWith("Telkom University") ? "telkom" : "lainnya"} onChange={e => {
          if (values.some(row => row.nilai) && !confirm("Ganti format dan kosongkan nilai yang sedang diisi?")) return;
          if (e.target.value === "telkom") { setFormat("Telkom University — Pembimbing Lapangan KPPM"); setValues((options?.rubrik_telkom ?? []).map(row => ({ ...row, nilai: "", skala: "0–100" }))); }
          else { setFormat("Format kampus peserta"); setValues([{ aspek: "", nilai: "", skala: "" }]); }
        }}><option value="lainnya">Format kampus / format lainnya</option><option value="telkom">Telkom University — 8 indikator</option></select></label>
        <p className="text-xs text-slate-600">Bobot contoh Telkom berjumlah 45%. Hasilnya adalah kontribusi nilai pembimbing lapangan; tidak dinormalisasi menjadi 100%.</p>
        <label className="block text-sm">Nama format / acuan penilaian<input required maxLength={255} value={format} onChange={e => setFormat(e.target.value)} placeholder="Contoh: format kampus peserta, versi atau tahun" className={field} /></label>
        {values.map((row, index) => <fieldset key={index} className="space-y-2 rounded-lg border bg-white p-3">
          <legend className="text-sm">Aspek {index + 1}</legend>
          <select aria-label={`Pilih aspek ${index + 1}`} className={field} value={(options?.rubrik_telkom ?? []).some(v => v.aspek === row.aspek) ? row.aspek : ""} onChange={e => { const preset = options?.rubrik_telkom.find(v => v.aspek === e.target.value); setValues(values.map((v, i) => i === index ? { ...v, aspek: preset?.aspek || "", bobot: preset?.bobot, skala: preset ? "0–100" : "" } : v)); }}><option value="">Aspek lainnya (isi di bawah)</option>{options?.rubrik_telkom.map(v => <option key={v.aspek} value={v.aspek}>{v.aspek}</option>)}</select>
          {([['aspek', 'Nama aspek'], ['nilai', 'Nilai'], ['skala', 'Skala / keterangan (opsional)']] as const).map(([key, label]) => <label key={key} className="block text-sm">{label}<input type={key === "nilai" && row.bobot !== undefined ? "number" : "text"} min={key === "nilai" && row.bobot !== undefined ? 0 : undefined} max={key === "nilai" && row.bobot !== undefined ? 100 : undefined} step="0.01" required={key !== 'skala'} maxLength={255} value={row[key] || ""} onChange={e => setValues(values.map((v, i) => i === index ? { ...v, [key]: e.target.value } : v))} className={field} /></label>)}
          <label className="block text-sm">Bobot % (opsional)<input type="number" min={0} max={100} step="0.01" value={row.bobot ?? ""} onChange={e => setValues(values.map((v, i) => i === index ? { ...v, bobot: e.target.value === "" ? undefined : Number(e.target.value) } : v))} className={field} /></label>
          {row.bobot !== undefined && <p className="text-xs">Nilai × bobot: {Number.isFinite(Number(row.nilai)) ? (Number(row.nilai) * row.bobot / 100).toFixed(2) : "Isi nilai angka 0–100"}</p>}
          {values.length > 1 && <button type="button" onClick={() => setValues(values.filter((_, i) => i !== index))} className="text-sm text-red-700">Hapus aspek</button>}
        </fieldset>)}
        <button type="button" disabled={values.length >= 30} onClick={() => setValues([...values, { aspek: "", nilai: "", skala: "" }])} className="text-sm text-blue-700 underline">Tambah aspek</button>
        {values.some(row => row.bobot !== undefined) && <p className="text-sm font-semibold">Total bobot: {totalWeight}% · Total nilai terbobot: {Number.isFinite(weightedTotal) ? weightedTotal.toFixed(2) : "—"}</p>}
        <label className="block text-sm">Catatan evaluasi<textarea value={evaluationNote} maxLength={5000} onChange={e => setEvaluationNote(e.target.value)} className={field} /></label>
        <button disabled={busy || !periodEnded || ndaBlocks || !options} className={button}>Simpan penilaian</button>
      </form>}
      {penilaian && p.dinilai_at && <details open={!!user?.is_magang || !!p.disahkan_at} className="rounded-lg border p-3">
        <summary className="cursor-pointer font-semibold text-sm">Hasil penilaian · {p.format_penilaian || "Format sebelumnya"}</summary>
        <div className="overflow-x-auto mt-3"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Indikator</th><th className="p-2">Nilai</th><th className="p-2">Bobot</th><th className="p-2">Nilai × bobot</th></tr></thead>
          <tbody>{p.penilaian?.map((row, i) => <tr key={i} className="border-t"><td className="p-2">{row.aspek}</td><td className="p-2">{row.nilai}</td><td className="p-2">{row.bobot === undefined ? row.skala || "—" : `${row.bobot}%`}</td><td className="p-2">{row.bobot === undefined ? "—" : (Number(row.nilai) * row.bobot / 100).toFixed(2)}</td></tr>)}</tbody></table></div>
        {p.ringkasan_nilai && <p className="font-semibold mt-3 text-sm">Total nilai terbobot: {p.ringkasan_nilai.total_terbobot} · Total bobot: {p.ringkasan_nilai.total_bobot}%</p>}
        {p.catatan_penilaian && <p className="text-sm mt-2">{p.catatan_penilaian}</p>}
      </details>}
      {penilaian && p.dinilai_at && <button className={button} onClick={printGrades}>Cetak lembar nilai / simpan PDF</button>}
      {penilaian && canManage && <form className="space-y-3 border-t pt-3" onSubmit={e => { e.preventDefault(); action(() => aturStatusKampus(p.id, campusRequired, campusDone)); }}>
        <h4 className="font-semibold text-sm">Kewajiban pada sistem kampus</h4>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={campusRequired} onChange={e => { setCampusRequired(e.target.checked); if (!e.target.checked) setCampusDone(false); }} />Kampus memerlukan input atau dokumen tambahan.</label>
        {campusRequired && <label className="flex gap-2 text-sm"><input type="checkbox" checked={campusDone} onChange={e => setCampusDone(e.target.checked)} />Input atau dokumen tambahan kampus sudah diselesaikan.</label>}
        <button disabled={busy} className={button}>Simpan status kampus</button>
      </form>}
      {dokumen && <MagangDokumenPanel participant={p} isAdmin={user?.role === "admin"} canManage={canManage} busy={busy} action={action} />}
      {dokumen && p.dinilai_at && !p.disahkan_at && user?.role === "admin" && <form className="space-y-3 border-t pt-3" onSubmit={e => { e.preventDefault(); if (!file) return; const data = new FormData(); data.append("nomor_sertifikat", number); data.append("sertifikat_file", file); action(() => sahkanMagang(p.id, data)); }}>
        <h4 className="font-semibold">Catat pengesahan sertifikat</h4>
        <p className="text-sm">Unggah sertifikat yang telah disahkan Kepala Dinas dan gunakan nomor resmi dinas. Pencatatan oleh admin bukan tanda tangan elektronik.</p>
        <label className="block text-sm">Nomor sertifikat<input required maxLength={255} value={number} onChange={e => setNumber(e.target.value)} className={field} /></label>
        <label className="block text-sm">Sertifikat disahkan (PDF, maks. 10 MB)<input type="file" required accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full py-2" /></label>
        <button disabled={busy || ndaBlocks} className={button}>Simpan dokumen disahkan</button>
      </form>}
      {dokumen && p.disahkan_at && <p className="text-sm font-semibold text-green-800">Sertifikat disahkan · {p.nomor_sertifikat}</p>}
      {dokumen && p.sertifikat_file && <a className="block text-blue-700 underline" href={p.sertifikat_file} target="_blank" rel="noreferrer">Unduh sertifikat resmi</a>}
    </>}
    {proses && !!p.riwayat_perubahan?.length && <details className="text-sm border-t pt-3"><summary className="cursor-pointer">Riwayat koreksi data</summary><ul className="space-y-2 mt-2">{p.riwayat_perubahan.map((entry, i) => <li key={i}>{new Date(entry.waktu).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} · pengguna #{entry.oleh} · {entry.kolom.join(", ")} · {entry.alasan || "Pembaruan data"}</li>)}</ul></details>}
  </section>;
}
