"use client";

import { type FormEvent, useId, useRef, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { ArrowUpRight, Check, CheckCircle2, ChevronDown, ClipboardList, FileText, GraduationCap, Info, ListChecks, Pencil, Plus, Printer, Trash2, Upload } from "lucide-react";
import {
  AspekPenilaianMagang, MagangWorkflow, MetodeBobotMagang, nilaiMagang, simpanKebutuhanKampus, tandaiInputKampusSelesai,
} from "@/services/magangWorkflow";
import { escapeMagangHtml as esc } from "./MagangDokumenPanel";
import { TautanDokumenMagang } from "./TautanDokumenMagang";
import { FormValidasiMagang } from "./FormValidasiMagang";
import { pilihanAspekPenilaianMagang } from "./pilihanAspekPenilaianMagang";

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
type ModeAspekPenilaian = "aptika" | "kustom";

function SectionHeading({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return <div className="flex items-center gap-3">
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
      <Icon size={17} aria-hidden="true" />
    </span>
    <h3 className="text-base font-bold !text-slate-900 dark:!text-slate-100">{title}</h3>
  </div>;
}

function KartuPilihan({ name, value, label, detail, checked, onChange }: {
  name: string;
  value: string;
  label: string;
  detail: string;
  checked: boolean;
  onChange: () => void;
}) {
  return <label className="relative block">
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
    <span className={`${inset} flex h-full cursor-pointer items-start justify-between gap-2 transition hover:border-blue-300 peer-checked:border-blue-400 peer-checked:bg-blue-50 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 dark:peer-checked:border-blue-600 dark:peer-checked:bg-blue-950/60`}>
      <span>
        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
        <span className={`mt-0.5 block ${muted}`}>{detail}</span>
      </span>
      <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${checked ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"}`}>
        {checked && <Check size={13} />}
      </span>
    </span>
  </label>;
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
  const guideUploadRef = useRef<HTMLInputElement>(null);
  const [guideUploadName, setGuideUploadName] = useState("");
  const [removeGuideFile, setRemoveGuideFile] = useState(false);
  const savedWeightMethod = p.metode_bobot ?? (rubric.some(row => row.bobot != null) ? "berbeda" : "sama");
  const [weightMethod, setWeightMethod] = useState<MetodeBobotMagang>(savedWeightMethod);
  const savedAsAptikaDefault = savedWeightMethod === "sama"
    && rubric.length === pilihanAspekPenilaianMagang.length
    && rubric.every((row, index) => row.aspek === pilihanAspekPenilaianMagang[index]);
  const [aspectMode, setAspectMode] = useState<ModeAspekPenilaian>(() => savedAsAptikaDefault ? "aptika" : "kustom");
  const firstRange = rubric[0]?.skala?.match(/^\s*(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*$/);
  const [rangeMin, setRangeMin] = useState(() => String(rubric[0]?.nilai_min ?? firstRange?.[1] ?? ""));
  const [rangeMax, setRangeMax] = useState(() => String(rubric[0]?.nilai_maks ?? firstRange?.[2] ?? ""));
  const [aspects, setAspects] = useState<AspekPenilaianMagang[]>(() => rubric.map(({ aspek, bobot }) => ({ aspek, bobot })));
  const [scores, setScores] = useState(() => rubric.map((_, index) => p.penilaian?.[index]?.nilai ?? ""));
  const [campusRequired, setCampusRequired] = useState(!!p.kampus_perlu_input);
  const [editingCampus, setEditingCampus] = useState(false);
  const [rubricSaved, setRubricSaved] = useState(() => rubric.length > 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const weightPoints = aspects.reduce((sum, row) => sum + Math.round(Number(row.bobot || 0) * 100), 0);
  const wrongWeight = aspectMode === "kustom" && weightMethod === "berbeda" && weightPoints !== 10000;
  const rubricLocked = Boolean(p.dinilai_at || p.disahkan_at);
  const guide = p.kebutuhan_kampus;
  const showWeights = p.metode_bobot !== "sama";
  const showAspectWeights = showWeights && rubric.some(row => row.bobot != null);
  const summary = p.ringkasan_nilai;
  const totalNilai = summary && ("rata_rata" in summary ? summary.rata_rata : summary.total_terbobot);

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
    markRubricUnsaved();
    setAspects(current => current.map((row, i) => i === index ? { ...row, ...changes } : row));
  }

  function markRubricUnsaved() {
    setRubricSaved(false);
    setNotice("");
    setError("");
  }

  function addAspect(aspek = "") {
    if (aspects.length >= 30 || (aspek && aspects.some(row => row.aspek.trim() === aspek))) return;
    markRubricUnsaved();
    setAspects(current => [...current, { aspek, bobot: "" }]);
  }

  function removeAspect(index: number) {
    markRubricUnsaved();
    setAspects(current => current.filter((_, i) => i !== index));
  }

  function saveCampus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (!campusRequired && !p.kampus_perlu_input)) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("kampus_perlu_input", campusRequired ? "1" : "0");
    const file = form.elements.namedItem("dokumen");
    if (file instanceof HTMLInputElement && !file.files?.length) data.delete("dokumen");
    if (removeGuideFile && campusRequired && file instanceof HTMLInputElement && !file.files?.length) data.set("hapus_dokumen", "1");

    void save(() => simpanKebutuhanKampus(p.id, data), "Kebutuhan kampus disimpan.", () => {
      if (!campusRequired) form.reset();
      if (file instanceof HTMLInputElement) file.value = "";
      setGuideUploadName("");
      setRemoveGuideFile(false);
      setEditingCampus(false);
    });
  }

  function cancelCampusEdit() {
    setCampusRequired(!!p.kampus_perlu_input);
    setGuideUploadName("");
    setRemoveGuideFile(false);
    setEditingCampus(false);
  }

  function saveRubric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const aspectsToSave: AspekPenilaianMagang[] = aspectMode === "aptika"
      ? pilihanAspekPenilaianMagang.map(aspek => ({ aspek }))
      : aspects;
    const weightMethodToSave = aspectMode === "aptika" ? "sama" : weightMethod;
    if (!aspectsToSave.length) {
      setNotice("");
      setError("Tambahkan setidaknya satu aspek penilaian.");
      return;
    }
    if (wrongWeight) return;
    const min = Number(rangeMin);
    const max = Number(rangeMax);
    if (!rangeMin.trim() || !rangeMax.trim() || !Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      setNotice("");
      setError("Nilai terendah harus lebih kecil dari nilai tertinggi.");
      return;
    }
    void save(() => simpanKebutuhanKampus(p.id, {
      metode_bobot: weightMethodToSave,
      aspek_penilaian: aspectsToSave.map(row => ({
        aspek: row.aspek.trim(), nilai_min: min, nilai_maks: max,
        ...(weightMethodToSave === "berbeda" ? { bobot: Number(row.bobot) } : {}),
      })),
    }), "Formulir penilaian disimpan.", () => setRubricSaved(true));
  }

  function printGrades() {
    const popup = window.open("", "_blank");
    if (!popup) { setError("Izinkan pop-up untuk mencetak lembar nilai."); return; }
    const scoreRows = (p.penilaian ?? []).map(row => `<tr>
      <td>${esc(row.aspek)}</td><td class="numeric">${esc(row.nilai)}</td>
      ${showWeights ? `<td class="numeric">${row.bobot == null ? "—" : `${esc(row.bobot)}%`}</td><td class="numeric">${esc(row.nilai_terbobot ?? "—")}</td>` : ""}
    </tr>`).join("");
    const scoreColumns = showWeights ? 4 : 2;
    const printedTotal = summary && ("rata_rata" in summary ? summary.rata_rata : summary.total_terbobot);
    const printDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date());
    const mentorName = p.mentor?.name ? esc(p.mentor.name) : "........................................";

    popup.document.write(`<!doctype html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Lembar Penilaian Magang - ${esc(p.nama)}</title>
        <style>
          @page { size: A4 portrait; margin: 18mm 18mm 16mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #172033; font: 10pt/1.5 Arial, Helvetica, sans-serif; }
          .letterhead { display: grid; grid-template-columns: 82px 1fr; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 4px double #172033; }
          .logo { width: 76px; height: 82px; object-fit: contain; }
          .agency { text-align: center; }
          .government { margin: 0 0 2px; font-size: 10pt; font-weight: 700; letter-spacing: .04em; }
          .department { margin: 0 0 3px; font-size: 14pt; font-weight: 800; letter-spacing: .035em; }
          .contact { margin: 1px 0; color: #344054; font-size: 8pt; }
          .city { margin: 2px 0 0; font-size: 8pt; font-weight: 700; letter-spacing: .18em; }
          h1 { margin: 22px 0 4px; text-align: center; font-size: 15pt; letter-spacing: .06em; }
          .subtitle { margin: 0 0 20px; text-align: center; color: #475467; font-size: 9pt; }
          .details { width: 100%; margin: 0 0 16px; border-collapse: collapse; }
          .details td { padding: 3px 4px; vertical-align: top; }
          .details td:first-child { width: 125px; font-weight: 700; }
          .details td:nth-child(2) { width: 14px; text-align: center; }
          .scores { width: 100%; border-collapse: collapse; }
          .scores th, .scores td { border: 1px solid #98a2b3; padding: 8px 9px; text-align: center; }
          .scores thead th:first-child, .scores tbody td:first-child { text-align: left; }
          .scores th { background: #eaf0f6; color: #172033; font-size: 9pt; font-weight: 700; }
          .scores tfoot th, .scores tfoot td { background: #dce7f2; font-size: 10pt; }
          .scores tfoot th { text-align: left; }
          .scores tfoot td { text-align: center; font-weight: 700; }
          .scores tbody tr:nth-child(even) { background: #f8fafc; }
          .scores .numeric { text-align: center; white-space: nowrap; }
          .scores .empty { padding: 16px; color: #667085; text-align: center; }
          .summary { margin-top: 12px; padding: 9px 11px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 700; }
          .notes { margin-top: 16px; }
          .notes h2 { margin: 0 0 4px; font-size: 10pt; }
          .notes p { margin: 0; white-space: pre-wrap; }
          .signature { display: flex; justify-content: flex-end; margin-top: 28px; break-inside: avoid; }
          .signature-block { width: 240px; text-align: center; }
          .signature-block p { margin: 0; }
          .signature-space { height: 72px; }
          .mentor-name { font-weight: 700; text-decoration: underline; }
          .footer { margin-top: 24px; padding-top: 7px; border-top: 1px solid #cbd5e1; color: #667085; font-size: 8pt; text-align: center; }
          tr { break-inside: avoid; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <header class="letterhead">
          <img class="logo" src="${window.location.origin}/logo-jabar.png" alt="Lambang Provinsi Jawa Barat">
          <div class="agency">
            <p class="government">PEMERINTAH DAERAH PROVINSI JAWA BARAT</p>
            <p class="department">DINAS KOMUNIKASI DAN INFORMATIKA</p>
            <p class="contact">Jalan Tamansari No. 55 Telepon (022) 2502898 Faksimile (022) 2511505</p>
            <p class="contact">diskominfo.jabarprov.go.id · diskominfo@jabarprov.go.id</p>
            <p class="city">BANDUNG 40132</p>
          </div>
        </header>
        <main>
          <h1>LEMBAR PENILAIAN MAGANG</h1>
          <p class="subtitle">Dokumen evaluasi peserta magang</p>
          <table class="details"><tbody>
            <tr><td>Nama peserta</td><td>:</td><td>${esc(p.nama)}</td></tr>
            <tr><td>NIM / NIS</td><td>:</td><td>${esc(p.nim)}</td></tr>
            <tr><td>Institusi</td><td>:</td><td>${esc(p.nama_kampus)}</td></tr>
            <tr><td>Program studi</td><td>:</td><td>${esc(p.jurusan)}</td></tr>
            <tr><td>Periode magang</td><td>:</td><td>${esc(p.tgl_mulai)} s.d. ${esc(p.tgl_selesai)}</td></tr>
          </tbody></table>
          <table class="scores">
            <thead><tr><th>Aspek penilaian</th><th>Nilai</th>${showWeights ? "<th>Bobot</th><th>Nilai × bobot</th>" : ""}</tr></thead>
            <tbody>${scoreRows || `<tr><td colspan="${scoreColumns}" class="empty">Belum ada nilai yang dicatat.</td></tr>`}</tbody>
            <tfoot><tr><th scope="row" colspan="${showWeights ? 3 : 1}">Total nilai</th><td class="numeric">${esc(printedTotal ?? "—")}</td></tr></tfoot>
          </table>
          ${p.catatan_penilaian ? `<section class="notes"><h2>Catatan mentor</h2><p>${esc(p.catatan_penilaian)}</p></section>` : ""}
          <section class="signature">
            <div class="signature-block">
              <p>Bandung, ${esc(printDate)}</p>
              <p>Tertanda,</p>
              <p>Mentor / Pembimbing</p>
              <div class="signature-space"></div>
              <p class="mentor-name">${mentorName}</p>
            </div>
          </section>
          <footer class="footer">Lembar evaluasi peserta magang · Dinas Komunikasi dan Informatika Provinsi Jawa Barat</footer>
        </main>
        <script>window.onload = function () { window.print(); };</script>
      </body>
      </html>`);
    popup.document.close();
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
      {isParticipant && !editingCampus && <div className="space-y-3">
        {guideResources}
        {guide?.panduan && <div className={inset}>
          <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Petunjuk penilaian</p>
          <p className={`whitespace-pre-wrap break-words ${muted}`}>{guide.panduan}</p>
        </div>}
        {p.kampus_perlu_input && !guide?.link && !guide?.panduan && !guideFile && <p className={`${inset} ${muted}`}>Belum ada tautan atau panduan dari kampus.</p>}
      </div>}
      {isParticipant && editingCampus && <FormValidasiMagang className="space-y-4" onSubmit={saveCampus}>
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
            <input ref={guideUploadRef} id={guideUploadId} name="dokumen" type="file" accept="application/pdf,.pdf" className="peer sr-only" onChange={event => {
              const file = event.target.files?.[0];
              setGuideUploadName(file?.name ?? "");
              if (file) setRemoveGuideFile(false);
            }} />
            <label htmlFor={guideUploadId} className={`${secondary} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-50`}>
              <Upload size={16} aria-hidden="true" />{guideFile && !removeGuideFile ? "Ganti PDF panduan" : "Pilih PDF panduan"}
            </label>
            {removeGuideFile
              ? <span role="status" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-200">
                <Trash2 size={14} aria-hidden="true" />PDF akan dihapus setelah disimpan
              </span>
              : <span className={`min-w-0 break-all text-sm font-normal ${muted}`} aria-live="polite">{guideUploadName || "PDF · Maks. 10 MB"}</span>}
            {guideFile && !removeGuideFile && <button type="button" className={`${button} ml-auto min-h-9 border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs !text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:!text-rose-200 dark:hover:bg-rose-900`} onClick={() => {
              if (guideUploadRef.current) guideUploadRef.current.value = "";
              setGuideUploadName("");
              setRemoveGuideFile(true);
            }}><Trash2 size={14} aria-hidden="true" />Hapus PDF panduan</button>}
            {removeGuideFile && <button type="button" className={`${secondary} min-h-9 px-3 py-1.5 text-xs`} onClick={() => setRemoveGuideFile(false)}>Batalkan penghapusan</button>}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" disabled={busy} onClick={cancelCampusEdit} className={secondary}>Batal</button>
          <button disabled={busy || (!campusRequired && !p.kampus_perlu_input)} className={primary}>Simpan kebutuhan kampus</button>
        </div>
      </FormValidasiMagang>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${p.kampus_perlu_input
          ? p.kampus_sudah_input ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
          {p.kampus_perlu_input && p.kampus_sudah_input && <CheckCircle2 size={14} aria-hidden="true" />}
          {p.kampus_perlu_input ? (p.kampus_sudah_input ? "Dikonfirmasi selesai oleh mentor" : "Menunggu konfirmasi mentor") : "Belum ada kewajiban tambahan"}
        </span>
        {isParticipant && !editingCampus && <button type="button" disabled={busy} className={secondary} onClick={() => setEditingCampus(true)}>
          <Pencil size={16} aria-hidden="true" />Edit
        </button>}
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
      <SectionHeading icon={ListChecks} title="Formulir penilaian" />
      <p className={muted}>Aspek dikunci setelah mentor menyimpan nilai.</p>
      <FormValidasiMagang onSubmit={saveRubric}>
        <fieldset disabled={busy} aria-label="Pengaturan aspek penilaian" className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Pilihan aspek penilaian</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <KartuPilihan name="mode_aspek" value="aptika" label="Standar Diskominfo Jabar"
                detail="Gunakan 10 aspek standar dengan bobot sama."
                checked={aspectMode === "aptika"} onChange={() => {
                  markRubricUnsaved();
                  setAspectMode("aptika");
                  setRangeMin("0");
                  setRangeMax("100");
                }} />
              <KartuPilihan name="mode_aspek" value="kustom" label="Aspek kustom"
                detail="Susun aspek penilaian sesuai kebutuhan."
                checked={aspectMode === "kustom"} onChange={() => { markRubricUnsaved(); setAspectMode("kustom"); }} />
            </div>
          </fieldset>
          {aspectMode === "kustom" && <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Rentang nilai</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">Nilai terendah<input type="number" step="any" required value={rangeMin} onChange={event => { markRubricUnsaved(); setRangeMin(event.target.value); }} className={field} placeholder="Contoh: 1" /></label>
              <label className="block">Nilai tertinggi<input type="number" step="any" required value={rangeMax} onChange={event => { markRubricUnsaved(); setRangeMax(event.target.value); }} className={field} placeholder="Contoh: 5" /></label>
            </div>
          </fieldset>}
          {aspectMode === "kustom" && <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Pembobotan</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {weightOptions.map(option => <KartuPilihan key={option.value} {...option} name="metode_bobot"
                checked={weightMethod === option.value} onChange={() => { markRubricUnsaved(); setWeightMethod(option.value); }} />)}
            </div>
          </fieldset>}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100">Aspek penilaian</legend>
            {aspectMode === "aptika" ? <div className={`${inset} space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">10 aspek standar · bobot sama</p>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">Diskominfo Jabar</span>
              </div>
              <ol className="grid gap-2 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-5">
                {pilihanAspekPenilaianMagang.map((aspek, index) => <li key={aspek} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-blue-700 dark:bg-slate-900 dark:text-blue-300">{index + 1}</span>
                  <span>{aspek}</span>
                </li>)}
              </ol>
            </div> : <>
              {!aspects.length && <p className={muted}>Belum ada aspek penilaian. Tambahkan aspek terlebih dahulu.</p>}
              {!!aspects.length && <>
                {aspects.map((row, index) => <div key={index}
                  className={`grid items-end gap-3 ${weightMethod === "berbeda" ? "grid-cols-[minmax(0,1fr)_8rem_auto]" : "grid-cols-[minmax(0,1fr)_auto]"}`}>
                  <input aria-label={`Nama aspek ${index + 1}`} placeholder="Nama aspek" required maxLength={255} value={row.aspek} onChange={e => updateAspect(index, { aspek: e.target.value })} className={field} />
                  {weightMethod === "berbeda" && <input aria-label={`Bobot aspek ${index + 1}`} placeholder="Bobot (%)" type="number" min={0} max={100} step="0.01" required value={row.bobot ?? ""} onChange={e => updateAspect(index, { bobot: e.target.value })} className={field} />}
                  <button type="button" aria-label={`Hapus aspek ${index + 1}`} onClick={() => removeAspect(index)}
                    className={`${button} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950`}><Trash2 size={15} aria-hidden="true" />Hapus</button>
                </div>)}
              </>}
              <div className="flex flex-wrap items-end gap-2.5">
                <div className="inline-flex items-stretch overflow-hidden rounded-xl border border-blue-200 bg-blue-50 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:border-blue-800 dark:bg-blue-950 dark:focus-within:ring-offset-slate-900">
                  <button type="button" disabled={aspects.length >= 30} onClick={() => addAspect()}
                    className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-l-[11px] px-3.5 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-200 dark:hover:bg-blue-900">
                    <Plus size={16} aria-hidden="true" />Tambah aspek
                  </button>
                  <div className="relative flex w-12 shrink-0 items-center justify-center border-l border-blue-200 dark:border-blue-800">
                    <select aria-label="Tambah aspek dari daftar nama" value="" disabled={aspects.length >= 30 || pilihanAspekPenilaianMagang.every(aspek => aspects.some(row => row.aspek.trim() === aspek))}
                      onChange={event => addAspect(event.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih aspek penilaian</option>
                      {pilihanAspekPenilaianMagang.map(aspek => <option key={aspek} value={aspek} disabled={aspects.some(row => row.aspek.trim() === aspek)}>{aspek}</option>)}
                    </select>
                    <ChevronDown size={17} aria-hidden="true" className="pointer-events-none text-blue-800 dark:text-blue-200" />
                  </div>
                </div>
              </div>
            </>}
          </fieldset>
          {aspectMode === "kustom" && weightMethod === "berbeda" && <p className={wrongWeight ? warning : "text-sm font-semibold text-emerald-800 dark:text-emerald-300"} aria-live="polite">Total bobot {weightPoints / 100}%{wrongWeight && " · Harus tepat 100%."}</p>}
          <div className="flex flex-wrap items-end gap-2.5">
            <button disabled={aspectMode === "kustom" && (!aspects.length || wrongWeight)} className={`${primary} self-end`}>Simpan formulir penilaian</button>
            {rubricSaved && <span role="status" className="inline-flex min-h-10 items-center gap-1.5 self-end rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 size={16} aria-hidden="true" />Formulir tersimpan
            </span>}
          </div>
        </fieldset>
      </FormValidasiMagang>
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
      {!!rubric.length && <FormValidasiMagang onSubmit={event => {
        event.preventDefault();
        if (version) void save(() => nilaiMagang(p.id, version, scores), "Nilai disimpan.");
      }}>
        <fieldset disabled={busy || !!p.disahkan_at} aria-label="Isian nilai mentor" className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <div className={`grid ${showAspectWeights ? "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_15rem]" : "grid-cols-[minmax(0,1fr)_8rem] sm:grid-cols-[minmax(0,1fr)_9rem]"} bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300`}>
              <span>Aspek penilaian</span>
              {showAspectWeights ? <span className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
                <span className="text-center">Bobot</span>
                <span className="text-center">Nilai</span>
              </span> : <span className="text-center">Nilai</span>}
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {rubric.map((row, index) => {
                const scoreInput = <input aria-label={`Nilai ${row.aspek}`} required type={p.metode_bobot ? "number" : "text"} min={row.nilai_min ?? undefined} max={row.nilai_maks ?? undefined} step="any" maxLength={255} value={scores[index] ?? ""} onChange={event => {
                  const value = event.target.value;
                  setScores(current => current.map((score, i) => i === index ? value : score));
                }} className={`${field} !mt-0 !py-2 text-center tabular-nums`} />;

                return <div key={row.aspek} className={`grid ${showAspectWeights ? "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_15rem]" : "grid-cols-[minmax(0,1fr)_8rem] sm:grid-cols-[minmax(0,1fr)_9rem]"} items-center gap-3 px-4 py-1.5 text-sm`}>
                  <span className="min-w-0 break-words font-semibold text-slate-900 dark:text-slate-100">{row.aspek}</span>
                  {showAspectWeights ? <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
                    <span className="text-center text-xs text-slate-600 dark:text-slate-300">{row.bobot != null ? `${row.bobot}%` : "—"}</span>
                    {scoreInput}
                  </div> : scoreInput}
                </div>;
              })}
            </div>
          </div>
          {!p.disahkan_at && <button disabled={busy || !periodEnded || ndaBlocks || !optionsReady || !version} className={primary}>Simpan nilai</button>}
        </fieldset>
      </FormValidasiMagang>}
    </section>}

    {(isParticipant || isAdmin) && p.dinilai_at && <section className={card}>
      <SectionHeading icon={GraduationCap} title="Hasil penilaian" />
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-center text-sm text-slate-700 dark:text-slate-200 [&_td]:px-3.5 [&_td]:py-2.5 [&_th]:px-3.5 [&_th]:py-2.5">
          <thead className="whitespace-nowrap bg-slate-100 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"><tr><th scope="col" className="text-left">Aspek</th><th scope="col">Nilai</th>{showWeights && <><th scope="col">Bobot</th><th scope="col">Nilai × bobot</th></>}</tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{p.penilaian?.map((row, i) => <tr key={i}>
            <td className="min-w-24 break-words text-left font-medium">{row.aspek}</td><td className="font-semibold tabular-nums text-blue-800 dark:text-blue-200">{row.nilai}</td>
            {showWeights && <><td className="tabular-nums">{row.bobot == null ? "—" : `${row.bobot}%`}</td><td className="tabular-nums">{row.nilai_terbobot ?? "—"}</td></>}
          </tr>)}</tbody>
        </table>
      </div>
      {p.catatan_penilaian && <p className={`${inset} ${muted} whitespace-pre-wrap break-words`}>{p.catatan_penilaian}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {totalNilai != null && <div className="inline-flex min-w-48 items-center justify-between gap-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-950/60">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Nilai</span>
          <strong className="text-lg tabular-nums text-blue-800 dark:text-blue-200">{totalNilai}</strong>
        </div>}
        <button type="button" className={secondary} onClick={printGrades}><Printer size={16} aria-hidden="true" />Cetak lembar nilai / simpan PDF</button>
      </div>
    </section>}

  </div>;
}
