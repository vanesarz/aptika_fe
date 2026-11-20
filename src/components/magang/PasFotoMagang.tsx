"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Camera, ImagePlus, RotateCcw, UserRound, X } from "lucide-react";
import { api } from "@/services/api";
import { PesanValidasi, useValidasiPendaftaran } from "./ValidasiPendaftaran";
import { PenandaKolom } from "./PenandaKolom";

export function PasFotoMagang({ file, onChange }: {
  file: File | null; onChange: (file: File | null) => void;
  latar: string; onLatarChange: (value: string) => void;
}) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const { kolom, clearError } = useValidasiPendaftaran();
  const field = kolom("pas_foto", error);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <fieldset className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <legend className="px-1.5 text-sm font-bold text-slate-800 dark:text-white">
        Pas foto <PenandaKolom />
      </legend>
      <div className="relative">
        <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 px-3 py-4 text-center transition hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-600 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 [&:has([aria-invalid=true])]:border-rose-400">
          <span className="relative flex aspect-[3/4] w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-blue-100/70 shadow-sm">
            {file && preview ? (
              <Image unoptimized width={112} height={148} src={preview} alt="Pratinjau pas foto" className="h-full w-full object-contain" />
            ) : (
              <>
                <span aria-hidden="true" className="absolute inset-2 rounded-lg border border-dashed border-blue-300" />
                <UserRound size={39} strokeWidth={1.4} className="text-blue-400" />
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
            {file ? <RotateCcw size={14} /> : <ImagePlus size={15} />}
            {file ? "Ganti pas foto" : "Tambah pas foto"}
          </span>
          <span className="max-w-full truncate text-xs text-slate-500 dark:text-slate-300" title={file?.name}>
            {file?.name ?? "JPG/PNG · Maks. 2 MB"}
          </span>
          <input key={file?.name ?? "empty"} {...field.attributes} type="file" accept="image/jpeg,image/png"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={file ? "Ganti pas foto" : "Tambah pas foto"}
            onChange={event => {
              const selected = event.target.files?.[0];
              if (!selected) return;
              if (!["image/jpeg", "image/png"].includes(selected.type) || selected.size > 2 * 1024 * 1024) {
                setError("Pilih JPG/PNG maksimal 2 MB.");
                event.target.value = "";
                return;
              }
              setError("");
              setPreview(URL.createObjectURL(selected));
              onChange(selected);
            }} />
        </label>
        {file && <button type="button" aria-label="Hapus pas foto"
          className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-slate-600 shadow hover:text-rose-700"
          onClick={() => { setPreview(""); setError(""); clearError?.("pas_foto"); onChange(null); }}><X size={15} /></button>}
      </div>
      <PesanValidasi {...field.feedback} />
    </fieldset>
  );
}

export function FotoPeserta({ url, nama }: { url?: string | null; nama: string }) {
  const [photo, setPhoto] = useState<{ source: string; blob: string } | null>(null);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController(); let objectUrl: string | undefined;
    api.get(url, { responseType: "blob", signal: controller.signal }).then(response => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(response.data); setPhoto({ source: url, blob: objectUrl });
    }).catch(() => {});
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);
  return <div className="flex aspect-[3/4] w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/80 bg-white/10 shadow-xl sm:w-32">
    {photo && photo.source === url ? <Image unoptimized width={128} height={171} src={photo.blob} alt={`Pas foto ${nama}`} className="h-full w-full object-cover" /> : <Camera className="text-white/50" size={36} />}
  </div>;
}
