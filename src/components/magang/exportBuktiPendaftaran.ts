import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BuktiPendaftaran } from "./RingkasanPendaftaran";

export function buatBuktiPendaftaran(data: BuktiPendaftaran) {
  const doc = new jsPDF();
  const navy: [number, number, number] = [15, 35, 65];
  const blue: [number, number, number] = [30, 80, 155];
  const ref = `MG-${String(data.id).padStart(6, "0")}`;
  doc.setFillColor(...navy); doc.rect(0, 0, 210, 59, "F");
  doc.setFillColor(38, 151, 177); doc.rect(0, 59, 210, 2, "F");
  doc.setTextColor(160, 205, 235); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("APTIKA TOOLS / PROGRAM MAGANG", 16, 16);
  doc.setTextColor(255); doc.setFontSize(23); doc.text("Bukti Pendaftaran", 16, 30);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(`Referensi ${ref}`, 16, 41);
  doc.setFillColor(241, 195, 85); doc.roundedRect(133, 38, 61, 11, 3, 3, "F");
  doc.setTextColor(...navy); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("MENUNGGU VERIFIKASI", 163.5, 45, { align: "center" });
  let y = 70;
  const rows: BuktiPendaftaran["rows"] = [
    ...data.rows,
    ["Tanggal mulai", data.mulai],
    ["Tanggal selesai", data.selesai],
  ];
  const sections: [string, string[]][] = [
    ["01   IDENTITAS PENDAFTAR", ["Nama lengkap", "NIM / NIS", "Sekolah / kampus", "Jurusan", "Email pribadi", "Telepon / WhatsApp", "Alamat", "Ketersediaan laptop"]],
    ["02   RENCANA MAGANG DAN AKUN", ["Bidang tujuan", "Tanggal mulai", "Tanggal selesai", "Email login setelah approval", "Keterangan"]],
  ];
  const table = (title: string, rows: string[][]) => {
    autoTable(doc, { startY: y, head: [[{ content: title, colSpan: 2 }]], body: rows,
      theme: "plain", margin: { top: 38, left: 16, right: 16, bottom: 20 },
      styles: { font: "helvetica", fontSize: 10, cellPadding: 3.5, overflow: "linebreak", textColor: navy, lineColor: [228, 234, 242], lineWidth: 0.15 },
      headStyles: { fillColor: blue, textColor: [255, 255, 255], fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [244, 247, 251] }, columnStyles: { 0: { cellWidth: 54, textColor: [85, 100, 120] }, 1: { cellWidth: 124 } },
      rowPageBreak: "avoid",
      didDrawPage: hooks => { y = hooks.cursor?.y ?? 38; },
    });
    y += 8;
  };
  const values = new Map(rows);
  for (const [title, labels] of sections) table(title, labels.map(label => [label, values.get(label) || "-"]));
  const known = new Set([...sections.flatMap(([, labels]) => labels), "Status pendaftaran"]);
  const extra = rows.filter(([label]) => !known.has(label));
  if (extra.length) table("INFORMASI TAMBAHAN", extra);
  table("03   BERKAS TERLAMPIR", data.files.map(({ label, file }) => [label, file.name]));
  table("04   LANGKAH SELANJUTNYA", [
    ["Verifikasi", "Pendaftaran akan ditinjau mentor. Dokumen ini adalah bukti pengiriman data, bukan surat penerimaan."],
    ["Pemberitahuan", "Pantau email pribadi, termasuk folder Spam/Junk. Tandai Bukan spam jika pemberitahuan masuk ke folder tersebut."],
    ["Setelah diterima", "Login setelah approval mentor, lalu buka tab Dokumen untuk mengakses surat penerimaan yang tersedia dan mengurus NDA."],
  ]);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    if (page > 1) {
      doc.setFillColor(...navy); doc.rect(0, 0, 210, 26, "F"); doc.setTextColor(255); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("APTIKA TOOLS | Bukti Pendaftaran", 16, 16);
      doc.setFontSize(9); doc.text(ref, 194, 16, { align: "right" });
    }
    doc.setDrawColor(218, 226, 237); doc.line(16, 281, 194, 281);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text(`${ref} / Simpan sebagai arsip pribadi`, 16, 287); doc.text(`${page} / ${pages}`, 194, 287, { align: "right" });
  }
  return doc;
}
