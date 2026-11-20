"use client";

import { useState } from "react";
import { TautanDokumenMagang } from "./TautanDokumenMagang";
import { MagangWorkflow, DokumenMagang, JenisDokumenMagang, simpanDokumenMagang } from "@/services/magangWorkflow";

export const escapeMagangHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const labels: Record<JenisDokumenMagang, string> = { penerimaan: "Surat penerimaan", selesai: "Surat selesai magang", penilaian: "Lembar nilai disahkan" };

export function MagangDokumenPanel({ participant: p, isAdmin, canManage, busy, action }: {
  participant: MagangWorkflow; isAdmin: boolean; canManage: boolean; busy: boolean;
  action: (work: () => Promise<unknown>) => Promise<void>;
}) {
  return <div className="space-y-3 border-t pt-4">
    <h4 className="font-semibold">Administrasi surat</h4>
    <p className="text-xs text-slate-600">Catat perkembangan surat agar mentor dan staf terkait dapat melihat status yang sama. Draf perlu disesuaikan dengan template resmi dinas.</p>
    {(Object.keys(labels) as JenisDokumenMagang[]).map(jenis => <DocumentForm key={jenis} participant={p}
      jenis={jenis} document={p.dokumens?.find(d => d.jenis === jenis)} isAdmin={isAdmin}
      canManage={canManage} busy={busy} action={action} />)}
  </div>;
}

function DocumentForm({ participant: p, jenis, document: d, isAdmin, canManage, busy, action }: {
  participant: MagangWorkflow; jenis: JenisDokumenMagang; document?: DokumenMagang;
  isAdmin: boolean; canManage: boolean; busy: boolean; action: (work: () => Promise<unknown>) => Promise<void>;
}) {
  const [status, setStatus] = useState("diproses");
  const [number, setNumber] = useState(d?.nomor || "");
  const [signer, setSigner] = useState(d?.pengesah || "");
  const [note, setNote] = useState(d?.catatan || "");
  const [file, setFile] = useState<File | null>(null);
  const print = () => {
    const popup = window.open("", "_blank");
    if (!popup) { alert("Izinkan pop-up untuk mencetak draf."); return; }
    popup.document.write(`<html lang="id"><head><title>Draf ${labels[jenis]}</title><style>body{font-family:Arial;padding:48px;line-height:1.8}h1{font-size:22px}dt{font-weight:bold}</style></head><body><p><b>DRAF — BELUM DISAHKAN</b></p><h1>${labels[jenis]}</h1><p>Dinas Komunikasi dan Informatika Provinsi Jawa Barat</p><dl><dt>Nama peserta</dt><dd>${escapeMagangHtml(p.nama)}</dd><dt>NIM / NIS</dt><dd>${escapeMagangHtml(p.nim)}</dd><dt>Institusi</dt><dd>${escapeMagangHtml(p.nama_kampus)}</dd><dt>Jurusan</dt><dd>${escapeMagangHtml(p.jurusan)}</dd><dt>Periode</dt><dd>${escapeMagangHtml(p.tgl_mulai)} s.d. ${escapeMagangHtml(p.tgl_selesai)}</dd></dl><p>${jenis === "penerimaan" ? "Data di atas adalah peserta yang diterima pada proses seleksi magang." : "Draf ini disiapkan untuk administrasi akhir periode magang peserta di atas."}</p><p>Nomor surat, isi, tanggal, dan pejabat penandatangan mengikuti template serta prosedur dinas. Draf ini belum merupakan dokumen resmi.</p></body></html>`);
    popup.document.close(); popup.print();
  };
  return <details className="rounded-lg border bg-white p-3">
    <summary className="cursor-pointer text-sm font-semibold">{labels[jenis]} · {d?.status.replaceAll("_", " ") || "belum diproses"}</summary>
    <div className="mt-3 space-y-3 text-sm">
      {d?.nomor && <p>Nomor: {d.nomor} · Pengesah: {d.pengesah || "belum dicatat"}</p>}
      {d?.file && <TautanDokumenMagang label={d.status === "disahkan" ? "Dokumen disahkan" : "Berkas sebelumnya (perlu ditinjau)"} href={d.file} />}
      {jenis !== "penilaian" && <button type="button" onClick={print} className="text-blue-700 underline">Cetak draf / simpan PDF</button>}
      {canManage && d?.status !== "disahkan" && (jenis !== "penilaian" || p.dinilai_at) && <form className="space-y-3" onSubmit={e => {
        e.preventDefault(); const data = new FormData(); data.append("jenis", jenis); data.append("status", status);
        if (number) data.append("nomor", number); if (signer) data.append("pengesah", signer);
        data.append("catatan", note); if (file) data.append("file", file);
        action(() => simpanDokumenMagang(p.id, data));
      }}>
        <label className="block">Status<select value={status} onChange={e => setStatus(e.target.value)} className="block w-full border rounded-lg p-2">
          <option value="diproses">Sedang diproses</option>{isAdmin && <option value="disahkan">Sudah disahkan (unggah dokumen resmi)</option>}
        </select></label>
        <label className="block">Nomor resmi<input required={status === "disahkan"} value={number} maxLength={255} onChange={e => setNumber(e.target.value)} className="block w-full border rounded-lg p-2" /></label>
        <label className="block">Pejabat pengesah sesuai dokumen<input required={status === "disahkan"} value={signer} maxLength={255} onChange={e => setSigner(e.target.value)} className="block w-full border rounded-lg p-2" /></label>
        {status === "disahkan" && <label className="block">Dokumen disahkan (PDF, maks. 10 MB)<input required type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full py-2" /></label>}
        <label className="block">Catatan<textarea value={note} maxLength={5000} onChange={e => setNote(e.target.value)} className="block w-full border rounded-lg p-2" /></label>
        <button disabled={busy} className="rounded-lg bg-blue-700 text-white px-3 py-2 disabled:opacity-50">Simpan status surat</button>
      </form>}
      {d?.catatan && <p>Catatan: {d.catatan}</p>}
    </div>
  </details>;
}
