"use client";

import { useState } from "react";
import { FileCheck2, Upload } from "lucide-react";

export function UnggahDokumenMagang({ label, file, onFile, maxMb, required }: {
  label: string;
  file?: File | null;
  onFile: (file: File | null) => void;
  maxMb: number;
  required?: boolean;
}) {
  const [error, setError] = useState("");

  return (
    <div className="min-w-0">
      <label className="relative flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-3 transition hover:border-blue-400 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-600 dark:bg-slate-800">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${file ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
          {file ? <FileCheck2 size={20} /> : <Upload size={19} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100" title={file?.name}>
            {file?.name ?? "Pilih berkas"}
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-300">{file ? "Klik untuk mengganti berkas" : `PDF · Maks. ${maxMb} MB`}</span>
        </span>
        <input type="file" accept="application/pdf,.pdf" required={required} aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={event => {
            const selected = event.target.files?.[0] ?? null;
            if (selected && !/\.pdf$/i.test(selected.name)) {
              event.target.value = "";
              setError("Pilih berkas berformat PDF.");
              onFile(null);
              return;
            }
            if (selected && selected.size > maxMb * 1024 * 1024) {
              event.target.value = "";
              setError(`Ukuran berkas maksimal ${maxMb} MB.`);
              onFile(null);
              return;
            }
            setError("");
            onFile(selected);
          }} />
      </label>
      {error && <p role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}
    </div>
  );
}
