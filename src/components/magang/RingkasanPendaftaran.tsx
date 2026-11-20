"use client";

import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import { ArrowUpRight, CalendarDays, Download, FileText, Mail, UserRound } from "lucide-react";

type LampiranPendaftaran = { label: string; file: File };

export interface BuktiPendaftaran {
  id: number;
  rows: [string, string][];
  mulai: string;
  selesai: string;
  files: LampiranPendaftaran[];
}

const formatTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

function TautanLampiran({ label, file }: LampiranPendaftaran) {
  const link = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const anchor = link.current;
    const type = file.type === "image/jpeg" || file.type === "image/png" ? file.type : "application/pdf";
    const url = URL.createObjectURL(file.slice(0, file.size, type));
    if (anchor) anchor.href = url;
    return () => {
      anchor?.removeAttribute("href");
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <a ref={link} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:hover:bg-slate-800">
      <FileText size={17} aria-hidden="true" className="shrink-0 text-blue-600 dark:text-blue-400" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <span className="block break-words text-sm font-medium text-slate-800 dark:text-slate-100">{file.name}</span>
      </span>
      <ArrowUpRight size={16} aria-hidden="true" className="shrink-0 text-slate-500 dark:text-slate-400" />
      <span className="sr-only"> (buka di tab baru)</span>
    </a>
  );
}

function PratinjauPasFoto({ file }: { file: File }) {
  const setImage = useCallback((image: HTMLImageElement | null) => {
    if (!image) return;
    const url = URL.createObjectURL(file);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The preview uses a browser-local object URL rather than an optimizable asset.
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={setImage} alt="Pas foto peserta" width={72} height={96}
    className="aspect-[3/4] w-[72px] shrink-0 rounded-lg bg-slate-100 object-contain dark:bg-slate-800" />;
}

export function RingkasanPendaftaran({ data, receipt, photo, headingRef }: {
  data: Omit<BuktiPendaftaran, "id">;
  receipt: BuktiPendaftaran | null;
  photo: File | null;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const documents = data.files.filter(({ file }) => file !== photo);
  const download = async () => {
    if (!receipt || busy) return;
    setBusy(true);
    setError("");
    try {
      const { buatBuktiPendaftaran } = await import("./exportBuktiPendaftaran");
      const doc = buatBuktiPendaftaran(receipt);
      doc.save(`bukti-pendaftaran-magang-${receipt.id}.pdf`);
    } catch {
      setError("PDF belum berhasil dibuat. Silakan coba unduh lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="grid items-start gap-6 text-left md:grid-cols-2 lg:gap-8">
      <div className="min-w-0 space-y-4">
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-6 text-xl font-bold text-slate-900 dark:text-white">
            {receipt ? "Pendaftaran berhasil dikirim" : "Tinjau pendaftaran"}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {receipt ? `Pendaftaran #${receipt.id} · Menunggu verifikasi mentor` : "Periksa data dan berkas sebelum mengirim pendaftaran."}
          </p>
        </div>
        {receipt && (
          <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
            <Mail size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Pantau email pribadi Anda</h3>
              <p className="mt-1 text-xs leading-relaxed">Jika diterima, pemberitahuan dan petunjuk login dikirim ke email pribadi Anda. Periksa juga folder Spam/Junk.</p>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Data pendaftaran</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {data.rows.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm font-medium text-slate-800 dark:text-slate-100">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        <div>
          <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">Berkas pendaftaran</h3>
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            {photo ? <PratinjauPasFoto file={photo} /> : (
              <div className="flex aspect-[3/4] w-[72px] shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                <UserRound size={24} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Pas foto</p>
              <p className="break-words text-xs text-slate-500 dark:text-slate-400">{photo?.name ?? "Belum ditambahkan"}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {documents.map(({ label, file }) => (
              <li key={label}><TautanLampiran label={label} file={file} /></li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/25">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-950 dark:text-blue-100">
            <CalendarDays size={16} aria-hidden="true" /> Periode magang
          </h3>
          <dl className="grid grid-cols-2 divide-x divide-blue-100 dark:divide-blue-900/60">
            {([["Tanggal mulai", data.mulai], ["Tanggal selesai", data.selesai]] as const).map(([label, date], index) => (
              <div key={label} className={index === 0 ? "min-w-0 pr-2" : "min-w-0 pl-3"}>
                <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <time dateTime={date}>{formatTanggal.format(new Date(date))}</time>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        {receipt && (
          <div className="space-y-2">
            <button type="button" onClick={download} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-800 disabled:opacity-50">
              <Download size={16} aria-hidden="true" />{busy ? "Menyiapkan PDF…" : "Unduh bukti pendaftaran"}
            </button>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
