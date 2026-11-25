"use client";

import { type FormEvent, useId, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { ArrowUpRight, Check, CheckCircle2, ClipboardList, FileText, GraduationCap, Info, ListChecks, Plus, Printer, Trash2, Upload } from "lucide-react";
import {
  AspekPenilaianMagang, MagangWorkflow, MetodeBobotMagang, nilaiMagang, simpanKebutuhanKampus, tandaiInputKampusSelesai,
} from "@/services/magangWorkflow";
import { escapeMagangHtml as esc } from "./MagangDokumenPanel";
import { TautanDokumenMagang } from "./TautanDokumenMagang";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-center text-sm font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900";
const primary = `${button} bg-blue-700 !text-white shadow-sm hover:bg-blue-800`;
const secondary = `${button} border border-blue-200 bg-blue-50 !text-blue-800 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:!text-blue-200 dark:hover:bg-blue-900`;
const card = "min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5";
const inset = "rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-700 dark:bg-slate-800/50";
const muted = "text-sm text-slate-600 dark:text-slate-300";
const warning = "flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200";
const weightOptions = [
  { value: "sama", label: "Bobot sama", detail: "Rata-rata nilai semua aspek" },
  { value: "berbeda", label: "Bobot berbeda", detail: "Atur bobot tiap aspek hingga total 100%" },
] as const;
const emptyAspect = { aspek: "", nilai_min: "", nilai_maks: "", bobot: "" };

function skalaNilai(row: AspekPenilaianMagang) {
  return row.nilai_min != null && row.nilai_maks != null ? `${row.nilai_min}–${row.nilai_maks}` : row.skala;
}

function SectionHeading({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return <div className="flex items-center gap-3">
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
      <Icon size={17} aria-hidden="true" />
    </span>
    <h3 className="text-base font-bold !text-slate-900 dark:!text-slate-100">{title}</h3>
  </div>;
}

export function MagangPenilaianPanel({ participant: p, isParticipant, isAdmin, isAssignedMentor, canGrade, periodEnded, ndaBlocks, optionsReady, onSaved }: {
  participant: MagangWorkflow;
  isParticipant: boolean;
  isAdmin: boolean;
  isAssignedMentor: boolean;
  canGrade: boolean;
  periodEnded: boolean;
  ndaBlocks: boolean;
  optionsReady: boolean;
  onSaved: (participant: MagangWorkflow) => Promise<void>;
}) {
  const rubric = p.rubrik_penilaian ?? [];
  const version = p.versi_rubrik_penilaian;
  const guideFile = p.lampiran_pendaftaran?.find(file => file.jenis === "pedoman_kampus");
  const guideFieldsId = useId();
  const guideUploadId = useId();
  const [guideUploadName, setGuideUploadName] = useState("");
  const [weightMethod, setWeightMethod] = useState<MetodeBobotMagang>(p.metode_bobot ?? (rubric.some(row => row.bobot != null) ? "berbeda" : "sama"));
  const [aspects, setAspects] = useState<AspekPenilaianMagang[]>(() => rubric.length ? rubric.map(row => {
    const range = row.skala?.match(/^\s*(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*$/);
    return { ...row, nilai_min: row.nilai_min ?? range?.[1], nilai_maks: row.nilai_maks ?? range?.[2] };
  }) : [emptyAspect]);
  const [scores, setScores] = useState(() => rubric.map((_, index) => p.penilaian?.[index]?.nilai ?? ""));
  const [campusRequired, setCampusRequired] = useState(!!p.kampus_perlu_input);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const weightPoints = aspects.reduce((sum, row) => sum + Math.round(Number(row.bobot || 0) * 100), 0);
  const wrongWeight = weightMethod === "berbeda" && weightPoints !== 10000;
  const rubricLocked = Boolean(p.dinilai_at || p.disahkan_at);
  const guide = p.kebutuhan_kampus;
  const showWeights = p.metode_bobot !== "sama";
  const summary = p.ringkasan_nilai;
  const summaryText = summary && ("rata_rata" in summary ? `Rata-rata nilai ${summary.rata_rata}`
    : `Total bobot ${summary.total_bobot}%${summary.total_terbobot == null ? "" : ` · Total nilai terbobot ${summary.total_terbobot}`}`);

  async function save(work: () => Promise<AxiosResponse<{ data: MagangWorkflow }>>, success: string, onSuccess?: () => void) {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const { data } = await work();
      await onSaved(data.data);
      onSuccess?.();
      setNotice(success);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || "Perubahan belum dapat disimpan." : "Perubahan belum dapat disimpan.");
    } finally {
      setBusy(false);
    }
  }

  function updateAspect(index: number, changes: Partial<AspekPenilaianMagang>) {
    setAspects(current => current.map((row, i) => i === index ? { ...row, ...changes } : row));
  }

  function saveCampus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (!campusRequired && !p.kampus_perlu_input)) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("kampus_perlu_input", campusRequired ? "1" : "0");
    const file = form.elements.namedItem("dokumen");
    if (file instanceof HTMLInputElement && !file.files?.length) data.delete("dokumen");

    void save(() => simpanKebutuhanKampus(p.id, data), "Kebutuhan kampus disimpan.", () => {
      if (!campusRequired) form.reset();
      if (file instanceof HTMLInputElement) file.value = "";
      setGuideUploadName("");
    });
  }

  function saveRubric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (wrongWeight) return;
    const invalidRange = aspects.find(row => Number(row.nilai_min) >= Number(row.nilai_maks));
    if (invalidRange) {
      setNotice("");
      setError(`Nilai terendah untuk aspek ${invalidRange.aspek} harus lebih kecil dari nilai tertinggi.`);
      return;
    }
    void save(() => simpanKebutuhanKampus(p.id, {
      metode_bobot: weightMethod,
      aspek_penilaian: aspects.map(row => ({
        aspek: row.aspek.trim(), nilai_min: Number(row.nilai_min), nilai_maks: Number(row.nilai_maks),
        ...(weightMethod === "berbeda" ? { bobot: Number(row.bobot) } : {}),
      })),
    }), "Aspek penilaian disimpan.");
  }

  function printGrades() {
    const popup = window.open("", "_blank");
    if (!popup) { setError("Izinkan pop-up untuk mencetak lembar nilai."); return; }
    popup.document.write(`<!doctype html><html lang="id"><head><meta charset="UTF-8"><title>Lembar nilai magang</title><style>body{font-family:Arial;padding:40px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:12px;text-align:left}</style></head><body>
      <h1>Lembar Nilai Magang</h1><p>${esc(p.nama)} · ${esc(p.nim)} · ${esc(p.nama_kampus)}</p><p>Format: ${esc(p.format_penilaian || "Format sebelumnya")}</p>
      <table><tr><th>Aspek</th><th>Nilai</th><th>Skala</th>${showWeights ? "<th>Bobot %</th><th>Nilai × bobot</th>" : ""}</tr>${(p.penilaian ?? []).map(row => `<tr><td>${esc(row.aspek)}</td><td>${esc(row.nilai)}</td><td>${esc(skalaNilai(row) || "—")}</td>${showWeights ? `<td>${esc(row.bobot ?? "—")}</td><td>${esc(row.nilai_terbobot ?? "—")}</td>` : ""}</tr>`).join("")}</table>
      ${summaryText ? `<p>${esc(summaryText)}</p>` : ""}
      <p>${esc(p.catatan_penilaian)}</p><p>Dokumen hasil evaluasi. Pengesahan mengikuti prosedur dinas. Kebutuhan input pada sistem kampus tetap mengikuti ketentuan kampus.</p></body></html>`);
    popup.document.close();
    popup.print();
  }

  if (!isParticipant && !canGrade) {
    return <p className={`${inset} ${muted}`}>Penilaian dapat diakses oleh peserta, mentor yang ditugaskan, dan admin berwenang.</p>;
  }

  const guideResources = (guide?.link || guideFile) && (
    <div className={`grid gap-3 ${guide?.link && guideFile ? "auto-rows-fr sm:grid-cols-2" : ""}`}>
      {guide?.link && <a className={`${secondary} min-w-0 ${guideFile ? "" : "justify-self-start"}`} href={guide.link} target="_blank" rel="noopener noreferrer">
        <span>Buka tautan penilaian kampus</span><ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
      </a>}
      {guideFile && <TautanDokumenMagang label={guideFile.label} downloadFilename={guideFile.nama} href={guideFile.url} authenticated />}
    </div>
  );

  return <div className="space-y-5">
    {notice && <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{notice}</p>}
    {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"><Info size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}
    <section className={card}>
      <SectionHeading icon={ClipboardList} title="Kewajiban pada sistem kampus" />
      {isParticipant && <form className="space-y-4" onSubmit={saveCampus}>
        <button type="button" role="switch" aria-checked={campusRequired} aria-controls={guideFieldsId} disabled={busy}
          onClick={() => setCampusRequired(current => !current)}
          className={`${inset} flex w-full items-center justify-between gap-4 text-left text-sm font-semibold text-slate-800 transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 dark:text-slate-100 dark:hover:border-blue-600 ${campusRequired ? "!border-blue-200 !bg-blue-50/80 dark:!border-blue-800 dark:!bg-blue-950/50" : ""}`}>
          Kampus memerlukan input atau dokumen tambahan
          <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${campusRequired ? "bg-blue-700" : "bg-slate-400 dark:bg-slate-600"}`}>
            <span className={`absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm transition-transform motion-reduce:transition-none ${campusRequired ? "translate-x-5" : "translate-x-0"}`}>
              {campusRequired && <Check size={13} />}
            </span>
          </span>
        </button>
        <fieldset id={guideFieldsId} hidden={!campusRequired} disabled={busy || !campusRequired} className="space-y-4 border-t border-slate-200 pt-4 text-sm font-medium text-slate-800 dark:border-slate-700 dark:text-slate-100">
          {guideResources}
          <label className="block">Tautan formulir atau sistem kampus<input name="link" type="url" maxLength={2000} defaultValue={guide?.link ?? ""} className={field} placeholder="https://…" /></label>
          <label className="block">Petunjuk penilaian<textarea name="panduan" rows={3} maxLength={10000} defaultValue={guide?.panduan ?? ""} className={field} placeholder="Misalnya cara pengisian, tenggat, atau cara pengumpulan" /></label>
          <div className={`${inset} flex flex-wrap items-center gap-x-4 gap-y-2 border-dashed`}>
            <input id={guideUploadId} name="dokumen" type="file" accept="application/pdf,.pdf" className="peer sr-only" onChange={event => setGuideUploadName(event.target.files?.[0]?.name ?? "")} />
            <label htmlFor={guideUploadId} className={`${secondary} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-50`}>
              <Upload size={16} aria-hidden="true" />{guideFile ? "Ganti PDF panduan" : "Pilih PDF panduan"}
            </label>
            <span className={`min-w-0 break-all font-normal ${muted}`} aria-live="polite">{guideUploadName || "PDF, maks. 10 MB"}</span>
          </div>
        </fieldset>
        <button disabled={busy || (!campusRequired && !p.kampus_perlu_input)} className={primary}>Simpan kebutuhan kampus</button>
      </form>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${p.kampus_perlu_input
          ? p.kampus_sudah_input ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
          {p.kampus_perlu_input && p.kampus_sudah_input && <CheckCircle2 size={14} aria-hidden="true" />}
          {p.kampus_perlu_input ? (p.kampus_sudah_input ? "Dikonfirmasi selesai oleh mentor" : "Menunggu konfirmasi mentor") : "Belum ada kewajiban tambahan"}
        </span>
        {isAssignedMentor && p.kampus_perlu_input && !p.kampus_sudah_input && <button type="button" disabled={busy} className={secondary}
          onClick={() => void save(() => tandaiInputKampusSelesai(p.id), "Kewajiban kampus ditandai selesai.")}><Check size={16} aria-hidden="true" />Tandai sudah selesai</button>}
      </div>
      {!isParticipant && p.kampus_perlu_input && <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
        {guideResources}
        {guide?.panduan && <div className={inset}>
          <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Petunjuk penilaian</p>
          <p className={`whitespace-pre-wrap break-words ${muted}`}>{guide.panduan}</p>
        </div>}
        {!guide?.link && !guide?.panduan && !guideFile && <p className={`${inset} ${muted}`}>Peserta belum menambahkan tautan atau panduan dari kampus.</p>}
      </div>}
    </section>

    {isParticipant && !rubricLocked && <section className={card}>
      <SectionHeading icon={ListChecks} title="Aspek penilaian kampus" />
      <p className={muted}>Aspek dikunci setelah mentor menyimpan nilai.</p>
      <form onSubmit={saveRubric}>
        <fieldset disabled={busy} aria-label="Pengaturan aspek penilaian" className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Pembobotan</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {weightOptions.map(option => <label key={option.value} className="relative block">
                <input type="radio" name="metode_bobot" value={option.value} checked={weightMethod === option.value} onChange={() => setWeightMethod(option.value)} className="peer sr-only" />
                <span className={`${inset} flex h-full cursor-pointer items-start justify-between gap-2 transition hover:border-blue-300 peer-checked:border-blue-400 peer-checked:bg-blue-50 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 dark:peer-checked:border-blue-600 dark:peer-checked:bg-blue-950/60`}>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</span>
                    <span className={`mt-0.5 block ${muted}`}>{option.detail}</span>
                  </span>
                  <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${weightMethod === option.value ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"}`}>
                    {weightMethod === option.value && <Check size={13} />}
                  </span>
                </span>
              </label>)}
            </div>
          </fieldset>
          {aspects.map((row, index) => <fieldset key={index} className={`${inset} space-y-3 text-sm font-medium text-slate-800 dark:text-slate-100`}>
            <legend className="sr-only">Aspek {index + 1}</legend>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span aria-hidden="true" className="font-semibold">Aspek {index + 1}</span>
              {aspects.length > 1 && <button type="button" aria-label={`Hapus aspek ${index + 1}`} onClick={() => setAspects(current => current.filter((_, i) => i !== index))}
                className={`${button} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950`}><Trash2 size={15} aria-hidden="true" />Hapus aspek</button>}
            </div>
            <label className="block">Nama aspek<input required maxLength={255} value={row.aspek} onChange={e => updateAspect(index, { aspek: e.target.value })} className={field} /></label>
            <div className={`grid gap-3 sm:grid-cols-2 ${weightMethod === "berbeda" ? "lg:grid-cols-3" : ""}`}>
              <label className="block">Nilai terendah<input type="number" step="any" required value={row.nilai_min ?? ""} onChange={e => updateAspect(index, { nilai_min: e.target.value })} className={field} placeholder="Contoh: 1" /></label>
              <label className="block">Nilai tertinggi<input type="number" step="any" required value={row.nilai_maks ?? ""} onChange={e => updateAspect(index, { nilai_maks: e.target.value })} className={field} placeholder="Contoh: 5" /></label>
              {weightMethod === "berbeda" && <label className="block">Bobot (%)<input type="number" min={0} max={100} step="0.01" required value={row.bobot ?? ""} onChange={e => updateAspect(index, { bobot: e.target.value })} className={field} /></label>}
            </div>
          </fieldset>)}
          {weightMethod === "berbeda" && <p className={wrongWeight ? warning : "text-sm font-semibold text-emerald-800 dark:text-emerald-300"} aria-live="polite">Total bobot {weightPoints / 100}%{wrongWeight && " · Harus tepat 100%."}</p>}
          <div className="flex flex-wrap gap-2.5">
            <button type="button" disabled={aspects.length >= 30} onClick={() => setAspects(current => [...current, emptyAspect])} className={secondary}><Plus size={16} aria-hidden="true" />Tambah aspek</button>
            <button disabled={wrongWeight} className={primary}>Simpan aspek penilaian</button>
          </div>
        </fieldset>
      </form>
    </section>}

    {canGrade && <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading icon={ListChecks} title="Nilai per aspek" />
        {p.metode_bobot === "sama" && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">Bobot sama · rata-rata nilai</span>}
      </div>
      {!rubric.length && <p className={`${inset} ${muted}`}>Peserta belum menyimpan aspek penilaian.</p>}
      {!!rubric.length && !periodEnded && <p className={warning}><Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Nilai dapat disimpan mulai tanggal akhir periode magang.</p>}
      {!!rubric.length && ndaBlocks && <p className={warning}><Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />NDA harus divalidasi sebelum nilai disimpan.</p>}
      {!!rubric.length && p.disahkan_at && <p className={`${inset} ${muted}`}>Nilai dikunci setelah sertifikat disahkan.</p>}
      {!!rubric.length && <form onSubmit={event => {
        event.preventDefault();
        if (version) void save(() => nilaiMagang(p.id, version, scores), "Nilai disimpan.");
      }}>
        <fieldset disabled={busy || !!p.disahkan_at} aria-label="Isian nilai mentor" className="space-y-3">
          {rubric.map((row, index) => <label key={row.aspek} className={`${inset} grid items-center gap-3 text-sm sm:grid-cols-[minmax(0,1fr)_9rem]`}>
            <span className="min-w-0">
              <span className="block break-words font-semibold text-slate-900 dark:text-slate-100">{row.aspek}</span>
              <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                {skalaNilai(row) && <span>Skala {skalaNilai(row)}</span>}
                {row.bobot != null && <span>Bobot {row.bobot}%</span>}
              </span>
            </span>
            <span className="block font-medium text-slate-800 dark:text-slate-100">Nilai
              <input aria-label={`Nilai ${row.aspek}`} required type={p.metode_bobot ? "number" : "text"} min={row.nilai_min ?? undefined} max={row.nilai_maks ?? undefined} step="any" maxLength={255} value={scores[index] ?? ""} onChange={e => {
                const value = e.target.value;
                setScores(current => current.map((score, i) => i === index ? value : score));
              }} className={`${field} tabular-nums`} />
            </span>
          </label>)}
          {!p.disahkan_at && <button disabled={busy || !periodEnded || ndaBlocks || !optionsReady || !version} className={primary}>Simpan nilai</button>}
        </fieldset>
      </form>}
    </section>}

    {(isParticipant || isAdmin) && p.dinilai_at && <section className={card}>
      <SectionHeading icon={GraduationCap} title="Hasil penilaian" />
      {summaryText && <p className="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-sm font-semibold tabular-nums text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">{summaryText}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200 [&_td]:px-3.5 [&_td]:py-2.5 [&_th]:px-3.5 [&_th]:py-2.5">
          <thead className="whitespace-nowrap bg-slate-100 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"><tr><th scope="col">Aspek</th><th scope="col">Skala</th><th scope="col">Nilai</th>{showWeights && <><th scope="col">Bobot</th><th scope="col">Nilai × bobot</th></>}</tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{p.penilaian?.map((row, i) => <tr key={i}>
            <td className="min-w-24 break-words font-medium">{row.aspek}</td><td className="tabular-nums">{skalaNilai(row) || "—"}</td><td className="font-semibold tabular-nums text-blue-800 dark:text-blue-200">{row.nilai}</td>
            {showWeights && <><td className="tabular-nums">{row.bobot == null ? "—" : `${row.bobot}%`}</td><td className="tabular-nums">{row.nilai_terbobot ?? "—"}</td></>}
          </tr>)}</tbody>
        </table>
      </div>
      {p.catatan_penilaian && <p className={`${inset} ${muted} whitespace-pre-wrap break-words`}>{p.catatan_penilaian}</p>}
      <button type="button" className={secondary} onClick={printGrades}><Printer size={16} aria-hidden="true" />Cetak lembar nilai / simpan PDF</button>
    </section>}

  </div>;
}
