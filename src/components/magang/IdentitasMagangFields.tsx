import { PenandaKolom } from "./PenandaKolom";

export const emptyIdentitasMagang = {
  nim: "", jurusan: "", email: "", telepon: "", alamat: "", memiliki_laptop: false,
};

export type IdentitasMagang = typeof emptyIdentitasMagang;

export function IdentitasMagangFields({ value, onChange }: {
  value: IdentitasMagang;
  onChange: (value: IdentitasMagang) => void;
}) {
  const fields = [
    ["nim", "NIM / NIS", "text", 100, "Contoh: 231012345"],
    ["email", "Email kontak pribadi", "email", 255, "nama@email.com"],
    ["telepon", "Nomor telepon / WhatsApp", "tel", 30, "Contoh: 081234567890"],
    ["alamat", "Alamat", "text", 2000, "Jalan, nomor rumah, kota"],
  ] as const;
  return <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <legend className="font-semibold text-sm mb-3">Identitas peserta</legend>
    {fields.map(([name, label, type, maxLength, placeholder]) => <label key={name} className="text-sm text-slate-700">
      {label} <PenandaKolom wajib />
      <input required type={type} maxLength={maxLength} placeholder={placeholder} value={value[name]}
        onChange={e => onChange({ ...value, [name]: e.target.value })}
        className="mt-1.5 w-full border border-slate-200 bg-slate-50/60 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
    </label>)}
    <label className="text-sm text-slate-700">Jurusan <PenandaKolom wajib />
      <input required maxLength={255} value={value.jurusan} onChange={e => onChange({ ...value, jurusan: e.target.value })}
        placeholder="Contoh: Sistem Informasi"
        className="mt-1.5 w-full border border-slate-200 bg-slate-50/60 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
    </label>
    <label className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs leading-relaxed text-slate-700">
      <input type="checkbox" checked={value.memiliki_laptop}
        onChange={e => onChange({ ...value, memiliki_laptop: e.target.checked })} />
      Saya memiliki laptop untuk kegiatan magang.
    </label>
  </fieldset>;
}

export function appendIdentitasMagang(payload: FormData, value: IdentitasMagang) {
  for (const [key, item] of Object.entries(value)) {
    if (key in emptyIdentitasMagang) payload.append(key, typeof item === "boolean" ? (item ? "1" : "0") : String(item));
  }
}
