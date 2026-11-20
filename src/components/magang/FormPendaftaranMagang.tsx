"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { emptyIdentitasMagang, appendIdentitasMagang } from "@/components/magang/IdentitasMagangFields";
import { BerkasPendaftaran } from "@/components/magang/PendaftaranDokumenFields";
import { PendaftaranMagangFields } from "@/components/magang/PendaftaranMagangFields";
import { RingkasanPendaftaran, BuktiPendaftaran } from "@/components/magang/RingkasanPendaftaran";
import { createMagang, getBidangs } from "@/services/api";
import { ValidasiPendaftaran, validasiKolomPendaftaran, type KesalahanKolom } from "./ValidasiPendaftaran";

export function FormPendaftaranMagang({ onClose, onRegistered, bannerAction }: { onClose: () => void; onRegistered?: () => void; bannerAction?: ReactNode }) {
  const [magangSubmitting, setMagangSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<KesalahanKolom>({});
  const fieldErrorPrefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const focusError = useRef(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const stepsChanged = useRef(false);
  const [buktiPendaftaran, setBuktiPendaftaran] = useState<BuktiPendaftaran | null>(null);
  const [bidangs, setBidangs] = useState<{ id: number; name: string }[]>([]);

  const [formData, setFormData] = useState({
    ...emptyIdentitasMagang,
    nama: "",
    nama_kampus: "",
    bidang_id: "",
    tgl_mulai_magang: "",
    tgl_selesai_magang: "",
    sertifikat: "Belum menerima",
    keterangan: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [fotoLatar, setFotoLatar] = useState("");
  const [registrationReady, setRegistrationReady] = useState(false);
  const [registrationFiles, setRegistrationFiles] = useState<BerkasPendaftaran>({});
  const [username, setUsername] = useState("");

  useEffect(() => {
    getBidangs()
      .then((res) => {
        setBidangs(res?.data ?? []);
      })
      .catch((err) => console.error("Gagal memuat bidang:", err));
  }, []);

  useEffect(() => {
    if (!stepsChanged.current) return;
    stepHeading.current?.focus();
    stepHeading.current?.scrollIntoView({ block: "start" });
  }, [step, buktiPendaftaran]);

  useEffect(() => {
    if (step !== 1 || !focusError.current) return;
    focusError.current = false;
    const control = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    control?.focus({ preventScroll: true });
    control?.closest("label")?.scrollIntoView({ block: "center" });
  }, [fieldErrors, step]);

  function clearError(name: string) {
    setFieldErrors(previous => {
      const clearEndDate = name === "tgl_mulai_magang" && Boolean(previous.tgl_selesai_magang);
      if (!previous[name] && !clearEndDate) return previous;
      const next = { ...previous };
      delete next[name];
      if (clearEndDate) delete next.tgl_selesai_magang;
      return next;
    });
  }

  const draft: Omit<BuktiPendaftaran, "id"> = {
    rows: [
      ["Nama lengkap", formData.nama], ["NIM / NIS", formData.nim],
      ["Sekolah / kampus", formData.nama_kampus], ["Jurusan", formData.jurusan],
      ["Email pribadi", formData.email], ["Telepon / WhatsApp", formData.telepon],
      ["Alamat", formData.alamat], ["Ketersediaan laptop", formData.memiliki_laptop ? "Memiliki laptop" : "Belum memiliki laptop"],
      ["Bidang tujuan", bidangs.find(bidang => String(bidang.id) === formData.bidang_id)?.name || formData.bidang_id],
      ["Email login setelah approval", `${username}@magang.com`],
      ["Keterangan", formData.keterangan || "-"],
    ],
    mulai: formData.tgl_mulai_magang,
    selesai: formData.tgl_selesai_magang,
    files: [
      ...(pasFoto ? [{ label: "Pas foto", file: pasFoto }] : []),
      ...(cvFile ? [{ label: "CV", file: cvFile }] : []),
      ...Object.entries(registrationFiles).map(([key, file]) => ({
        label: (key[0].toUpperCase() + key.slice(1)).replaceAll("_", " "),
        file,
      })),
    ],
  };

  function handleReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 1 || !registrationReady) return;
    const errors = validasiKolomPendaftaran(event.currentTarget);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusError.current = true;
      return;
    }
    stepsChanged.current = true;
    setSubmitError("");
    setStep(2);
  }

  async function handleSaveMagang() {
    if (step !== 2 || magangSubmitting || buktiPendaftaran) return;
    setSubmitError("");
    setMagangSubmitting(true);
    try {
      const payload = new FormData();
      appendIdentitasMagang(payload, formData);
      if (pasFoto) payload.append("pas_foto", pasFoto);
      if (fotoLatar) payload.append("foto_latar", fotoLatar);
      if (username) payload.append("username", username);
      Object.entries(registrationFiles).forEach(([key, file]) => payload.append(key, file));
      payload.append("nama", formData.nama);
      payload.append("nama_kampus", formData.nama_kampus);
      payload.append("bidang_id", formData.bidang_id);
      payload.append("tgl_mulai_magang", formData.tgl_mulai_magang);
      payload.append("tgl_selesai_magang", formData.tgl_selesai_magang);
      payload.append("sertifikat", formData.sertifikat);
      if (formData.keterangan) payload.append("keterangan", formData.keterangan);
      if (cvFile) payload.append("cv_magang", cvFile);

      const registered = await createMagang(payload);
      setBuktiPendaftaran({
        ...draft,
        id: registered.data.id,
        rows: draft.rows.map(([label, value]) => [
          label,
          label === "Email login setelah approval" ? registered.data.email_login : value,
        ]),
      });
      onRegistered?.();
    } catch (error) {
      const response = isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error) ? error.response : undefined;
      const serverErrors: KesalahanKolom = {};
      for (const [name, messages] of Object.entries(response?.data?.errors ?? {})) {
        if (messages[0] && formRef.current?.elements.namedItem(name)) serverErrors[name] = messages[0];
      }
      if (response?.status === 422 && Object.keys(serverErrors).length) {
        focusError.current = true;
        setFieldErrors(serverErrors);
        setStep(1);
      } else if (response?.status === 413) {
        setSubmitError("Total ukuran unggahan terlalu besar.");
      } else if (response?.data?.message) {
        setSubmitError(response.data.message);
      } else {
        setSubmitError("Pendaftaran belum berhasil disimpan. Silakan coba lagi.");
      }
      console.error("Error submitting magang application:", error);
    } finally {
      setMagangSubmitting(false);
    }
  }

  const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50";
  const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <div className="space-y-5">
      <ol aria-label="Langkah pendaftaran" className={`relative mx-auto grid max-w-md grid-cols-2 py-2 before:absolute before:left-1/4 before:right-1/4 before:top-6 before:h-px ${step === 2 ? "before:bg-blue-700 dark:before:bg-blue-400" : "before:bg-slate-300 dark:before:bg-slate-600"}`}>
        {(["Isi formulir", "Ringkasan"] as const).map((label, index) => {
          const number = index + 1;
          const active = step === number;
          return (
            <li key={label} aria-current={active ? "step" : undefined}
              className={`relative flex flex-col items-center gap-1.5 text-center text-xs sm:text-sm ${active ? "font-semibold text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}>
              <span aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${active
                ? "border-blue-700 bg-blue-700 text-white"
                : `bg-white dark:bg-slate-900 ${number < step ? "border-blue-700 text-blue-700 dark:border-blue-400 dark:text-blue-300" : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"}`}`}>
                {number}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {!buktiPendaftaran && <div hidden={step !== 1}>
        <h2 ref={step === 1 ? stepHeading : undefined} tabIndex={-1} className="sr-only">Isi formulir pendaftaran</h2>
        <form ref={formRef} noValidate onSubmit={handleReview}
          onChange={event => {
            const control = event.target;
            if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
              clearError(control.name);
            }
          }} className="space-y-5">
          <ValidasiPendaftaran.Provider value={{ errors: fieldErrors, prefix: fieldErrorPrefix, clearError }}>
            <PendaftaranMagangFields bannerAction={bannerAction} value={formData} onChange={data => setFormData(previous => ({ ...previous, ...data }))}
              bidangs={bidangs} username={username} onUsername={setUsername} cv={cvFile} onCv={setCvFile}
              files={registrationFiles} onFiles={setRegistrationFiles} onReady={setRegistrationReady}
              photo={pasFoto} onPhoto={setPasFoto} latar={fotoLatar} onLatar={setFotoLatar} />
          </ValidasiPendaftaran.Provider>
          {Object.keys(fieldErrors).length > 0 && (
            <p role="alert" className="text-sm font-medium text-rose-700 dark:text-rose-300">Periksa kolom yang ditandai sebelum melanjutkan.</p>
          )}
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className={secondaryButton}>Batal</button>
            <button type="submit" disabled={!registrationReady} className={primaryButton}>
              Lanjut ke ringkasan <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>}

      {step === 2 && (
        <div className="space-y-5">
          <RingkasanPendaftaran data={buktiPendaftaran ?? draft} receipt={buktiPendaftaran}
              photo={pasFoto} headingRef={stepHeading} />
          {submitError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{submitError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {buktiPendaftaran ? (
              <button type="button" onClick={onClose} className={`${secondaryButton} sm:col-start-2`}>Selesai</button>
            ) : (
              <>
                <button type="button" disabled={magangSubmitting} onClick={() => setStep(1)} className={secondaryButton}>
                  <ArrowLeft size={16} aria-hidden="true" /> Kembali untuk edit
                </button>
                <button type="button" disabled={magangSubmitting} onClick={handleSaveMagang} className={primaryButton}>
                  {magangSubmitting ? "Mengirim…" : "Kirim pendaftaran"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
