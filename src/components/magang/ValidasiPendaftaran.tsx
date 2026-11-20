"use client";

import { createContext, useContext } from "react";
import { CircleAlert } from "lucide-react";

export type KesalahanKolom = Record<string, string>;

export const ValidasiPendaftaran = createContext<{
  errors: KesalahanKolom;
  prefix: string;
  clearError: (name: string) => void;
} | null>(null);

export function useValidasiPendaftaran() {
  const validation = useContext(ValidasiPendaftaran);

  function kolom(name: string, localError = "") {
    const message = localError || validation?.errors[name];
    const id = message && validation ? `${validation.prefix}-${name}` : undefined;
    return {
      attributes: { name, "aria-invalid": message ? true : undefined, "aria-describedby": id },
      feedback: { id, message },
    };
  }

  return { kolom, clearError: validation?.clearError };
}

export function PesanValidasi({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-relaxed text-rose-700 dark:text-rose-300">
      <CircleAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </span>
  );
}

export function validasiKolomPendaftaran(form: HTMLFormElement): KesalahanKolom {
  const errors: KesalahanKolom = {};
  for (const control of Array.from(form.elements)) {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) continue;
    const { name, validity } = control;
    if (!name || !control.willValidate) continue;

    if (validity.badInput) errors[name] = "Masukkan nilai yang valid.";
    else if (validity.valueMissing || (control.required && !control.value.trim())) {
      errors[name] = control instanceof HTMLSelectElement
        ? "Pilih bidang tujuan."
        : control instanceof HTMLInputElement && control.type === "file"
          ? "Unggah berkas ini."
          : "Kolom ini wajib diisi.";
    } else if (validity.typeMismatch) errors[name] = "Masukkan alamat email yang valid.";
    else if (validity.tooShort) errors[name] = "Nama akun minimal 3 karakter.";
    else if (validity.patternMismatch) errors[name] = "Awali dengan huruf atau angka. Gunakan huruf kecil, angka, titik, garis bawah, atau tanda hubung.";
    else if (validity.rangeUnderflow && name === "tgl_selesai_magang") errors[name] = "Tanggal selesai harus sama dengan atau setelah tanggal mulai.";
    else if (validity.tooLong) errors[name] = "Teks melebihi batas panjang kolom ini.";
    else if (!validity.valid) errors[name] = "Periksa kembali isian kolom ini.";
  }
  return errors;
}
