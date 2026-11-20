"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { emptyIdentitasMagang, appendIdentitasMagang } from "@/components/magang/IdentitasMagangFields";
import { BerkasPendaftaran } from "@/components/magang/PendaftaranDokumenFields";
import { PendaftaranMagangFields } from "@/components/magang/PendaftaranMagangFields";
import { RingkasanPendaftaran, BuktiPendaftaran } from "@/components/magang/RingkasanPendaftaran";
import { createMagang, getBidangs } from "@/services/api";

export function FormPendaftaranMagang({ onClose, onRegistered, bannerAction }: { onClose: () => void; onRegistered?: () => void; bannerAction?: ReactNode }) {
  const [magangSubmitting, setMagangSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitError, setSubmitError] = useState("");
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
      const response = isAxiosError<{ message?: string }>(error) ? error.response : undefined;
      if (response?.status === 413) {
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
      <ol aria-label="Langkah pendaftaran" className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        {(["Isi formulir", "Ringkasan"] as const).map((label, index) => {
          const number = index + 1;
          const active = step === number;
          return (
            <li key={label} aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 text-xs font-semibold sm:text-sm ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
              <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
                {number < step ? <Check size={15} /> : number}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {!buktiPendaftaran && <div hidden={step !== 1}>
        <h2 ref={step === 1 ? stepHeading : undefined} tabIndex={-1} className="sr-only">Isi formulir pendaftaran</h2>
        <form onSubmit={handleReview} className="space-y-5">
          <PendaftaranMagangFields bannerAction={bannerAction} value={formData} onChange={data => setFormData(previous => ({ ...previous, ...data }))}
            bidangs={bidangs} username={username} onUsername={setUsername} cv={cvFile} onCv={setCvFile}
            files={registrationFiles} onFiles={setRegistrationFiles} onReady={setRegistrationReady}
            photo={pasFoto} onPhoto={setPasFoto} latar={fotoLatar} onLatar={setFotoLatar} />
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
