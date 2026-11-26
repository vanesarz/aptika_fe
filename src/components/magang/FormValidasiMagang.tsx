"use client";

import { type ChangeEvent, type FormEvent, type FormHTMLAttributes, useState } from "react";
import { CircleAlert } from "lucide-react";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FormValidasiMagangProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

function isControl(element: Element): element is Control {
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement;
}

function pesanValidasi(control: Control) {
  const { validity } = control;
  const type = control instanceof HTMLInputElement ? control.type : "";

  if (validity.valueMissing) {
    if (control instanceof HTMLSelectElement) return "Pilih salah satu opsi.";
    if (type === "checkbox" || type === "radio") return "Centang atau pilih opsi ini untuk melanjutkan.";
    if (type === "file") return "Pilih berkas yang diminta.";
    return "Kolom ini wajib diisi.";
  }
  if (validity.typeMismatch) return type === "url" ? "Masukkan tautan dengan format yang valid." : "Masukkan alamat email dengan format yang valid.";
  if (validity.tooShort) return "Isian terlalu pendek.";
  if (validity.tooLong) return "Isian melebihi batas panjang.";
  if (validity.patternMismatch) return "Format isian belum sesuai.";
  if (validity.rangeUnderflow) return "Nilai berada di bawah batas minimum.";
  if (validity.rangeOverflow) return "Nilai melebihi batas maksimum.";
  if (validity.stepMismatch) return "Gunakan kelipatan nilai yang sesuai.";
  if (validity.badInput) return "Masukkan nilai dengan format yang benar.";
  return "Periksa kembali isian ini.";
}

function labelKontrol(control: Control) {
  const label = control.getAttribute("aria-label") || control.labels?.[0]?.textContent?.replace(/\s+/g, " ").trim();
  return label ? `${label}: ` : "";
}

function firstInvalid(form: HTMLFormElement) {
  return Array.from(form.elements).find((element): element is Control =>
    isControl(element) && element.willValidate && !element.validity.valid,
  );
}

function markInvalid(control: Control) {
  control.setAttribute("aria-invalid", "true");
  if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) return;
  control.classList.add("!border-rose-400", "focus:!border-rose-500", "dark:!border-rose-500");
}

function clearInvalid(control: Control) {
  control.removeAttribute("aria-invalid");
  control.classList.remove("!border-rose-400", "focus:!border-rose-500", "dark:!border-rose-500");
}

export function FormValidasiMagang({ children, onSubmit, onChange, ...props }: FormValidasiMagangProps) {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = firstInvalid(event.currentTarget);
    if (invalid) {
      markInvalid(invalid);
      setMessage(`${labelKontrol(invalid)}${pesanValidasi(invalid)}`);
      invalid.focus();
      invalid.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setMessage("");
    onSubmit?.(event);
  }

  function handleChange(event: ChangeEvent<HTMLFormElement>) {
    onChange?.(event);
    if (!message) return;

    for (const element of Array.from(event.currentTarget.elements)) {
      if (isControl(element) && element.validity.valid && element.hasAttribute("aria-invalid")) clearInvalid(element);
    }
    const invalid = firstInvalid(event.currentTarget);
    if (invalid) markInvalid(invalid);
    setMessage(invalid ? `${labelKontrol(invalid)}${pesanValidasi(invalid)}` : "");
  }

  return <form {...props} noValidate onSubmit={handleSubmit} onChange={handleChange}>
    {message && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
      <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>}
    {children}
  </form>;
}
