import { jsPDF } from "jspdf";
import type { BuktiPendaftaran } from "./RingkasanPendaftaran";

const ink = "#0f172a";
const muted = "#475569";
const border = "#dbe4ef";
const blue = "#1e3a8a";

const formatTanggalPendaftaran = new Intl.DateTimeFormat("id-ID", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

export async function buatBuktiPendaftaran(data: BuktiPendaftaran) {
  const doc = new jsPDF({ compress: true });
  const ref = `MG-${String(data.id).padStart(6, "0")}`;
  doc.setProperties({ title: `Bukti Pendaftaran Magang - ${ref}`, author: "APTIKA Tools" });

  const left = 16;
  const right = 111;
  const leftWidth = 87;
  const rightWidth = 83;
  const bottom = 274;
  const continuedTop = 29;
  let page = 1;
  let y = 55;

  function style(size: number, color: string, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
  }

  function nextPage() {
    page += 1;
    if (page > doc.getNumberOfPages()) doc.addPage();
    else doc.setPage(page);
    y = continuedTop;
  }

  function ensure(height: number) {
    if (y + height > bottom) nextPage();
  }

  function band(x: number, width: number, heading: string) {
    ensure(17);
    doc.setFillColor("#f1f5f9");
    doc.roundedRect(x, y, width, 9, 2, 2, "F");
    style(11, ink, true);
    doc.text(heading, x + 3.5, y + 5.9);
    y += 14;
  }

  function fieldLines(value: string, width: number) {
    style(10, ink);
    return doc.splitTextToSize(value || "-", width) as string[];
  }

  function detailRows(x: number, width: number, rows: BuktiPendaftaran["rows"], columns: 1 | 2) {
    const cellWidth = width / columns;
    for (let i = 0; i < rows.length; i += columns) {
      const cells = rows.slice(i, i + columns).map(([label, value]) => ({
        label, lines: fieldLines(value, cellWidth - 7),
      }));
      const lineCount = Math.max(...cells.map(cell => cell.lines.length));

      // Keep normal rows together and allow long addresses or notes to continue.
      const rowHeight = 11 + lineCount * 4.4;
      if (rowHeight <= bottom - continuedTop) ensure(rowHeight);
      let offset = 0;
      while (offset < lineCount) {
        ensure(16);
        const count = Math.min(lineCount - offset, Math.floor((bottom - y - 10) / 4.4));
        cells.forEach(({ label, lines }, index) => {
          const chunk = lines.slice(offset, offset + count);
          if (!chunk.length) return;
          const cellX = x + index * cellWidth + 3.5;
          style(8.5, muted);
          doc.text(offset ? `${label} (lanjutan)` : label, cellX, y + 3);
          style(10, ink);
          doc.text(chunk, cellX, y + 8, { lineHeightFactor: 1.24 });
        });
        y += 10 + count * 4.4;
        doc.setDrawColor(border);
        doc.line(x + 3.5, y - 2, x + width - 3.5, y - 2);
        offset += count;
        if (offset < lineCount) nextPage();
      }
    }
  }

  band(left, leftWidth, "Data pendaftaran");
  const notes = data.rows.find(([label]) => label === "Keterangan");
  detailRows(left, leftWidth, data.rows.filter(([label]) => label !== "Status pendaftaran" && label !== "Keterangan"), 2);
  y += 3;
  ensure(37);
  doc.setFillColor("#eff6ff");
  doc.roundedRect(left, y, leftWidth, 29, 2, 2, "F");
  style(10, blue, true);
  doc.text("Pantau email pribadi Anda", left + 4, y + 7);
  style(9, muted);
  doc.text(doc.splitTextToSize(
    "Jika diterima, pemberitahuan dan petunjuk masuk dikirim ke email pribadi Anda. Periksa juga folder Spam/Junk.",
    leftWidth - 8,
  ), left + 4, y + 13);

  const endOfData = { page, y: y + 29 };

  page = 1;
  doc.setPage(page);
  y = 55;
  band(right, rightWidth, "Berkas pendaftaran");
  const photo = data.files.find(({ label }) => label === "Pas foto");
  if (photo) {
    let embedded = false;
    try {
      const bytes = new Uint8Array(await photo.file.arrayBuffer());
      const image = doc.getImageProperties(bytes);
      const scale = Math.min(21 / image.width, 28 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      doc.addImage(bytes, image.fileType, right + 3.5 + (21 - width) / 2, y + (28 - height) / 2, width, height);
      embedded = true;
    } catch {
      // Keep the receipt downloadable if the image cannot be embedded.
    }
    if (embedded) {
      style(10, ink, true);
      doc.text(photo.label, right + 29, y + 5);
      style(8.5, muted);
      const lines = doc.splitTextToSize(photo.file.name, rightWidth - 33) as string[];
      if (lines.length <= 4) doc.text(lines, right + 29, y + 11);
      y += 31;
      if (lines.length > 4) detailRows(right, rightWidth, [[photo.label, photo.file.name]], 1);
    } else {
      detailRows(right, rightWidth, [[photo.label, photo.file.name]], 1);
    }
  }
  detailRows(right, rightWidth, data.files.filter(file => file !== photo).map(({ label, file }) => [label, file.name]), 1);

  y += 4;
  ensure(32);
  doc.setFillColor("#eff6ff");
  doc.roundedRect(right, y, rightWidth, 29, 2, 2, "F");
  style(11, blue, true);
  doc.text("Periode magang", right + 4, y + 7);
  const dates = [["Tanggal mulai", data.mulai], ["Tanggal selesai", data.selesai]];
  dates.forEach(([label, date], index) => {
    const x = right + 4 + index * (rightWidth / 2);
    style(8.5, muted);
    doc.text(label, x, y + 15);
    style(10, ink, true);
    doc.text(formatTanggalPendaftaran.format(new Date(date)), x, y + 21);
  });
  doc.setDrawColor("#bfdbfe");
  doc.line(right + rightWidth / 2, y + 12, right + rightWidth / 2, y + 23);

  y += 29;
  if (notes && notes[1] && notes[1] !== "-") {
    if (endOfData.page > page || (endOfData.page === page && endOfData.y > y)) {
      page = endOfData.page;
      doc.setPage(page);
      y = endOfData.y;
    }
    y += 8;
    detailRows(left, 178, [notes], 1);
  }

  const pages = doc.getNumberOfPages();
  for (let number = 1; number <= pages; number++) {
    doc.setPage(number);
    if (number === 1) {
      doc.setFillColor(blue);
      doc.roundedRect(left, 14, 178, 34, 3, 3, "F");
      style(8.5, "#bfdbfe", true);
      doc.text("APTIKA TOOLS  /  PROGRAM MAGANG", left + 6, 23);
      style(21, "#ffffff", true);
      doc.text("Bukti Pendaftaran Magang", left + 6, 33);
      style(9, "#dbeafe");
      doc.text(`Referensi ${ref}`, left + 6, 42);
      doc.setFillColor("#fef3c7");
      doc.roundedRect(137, 35, 51, 9, 4, 4, "F");
      style(8, "#92400e", true);
      doc.text("Menunggu verifikasi mentor", 162.5, 40.7, { align: "center" });
    } else {
      style(10, blue, true);
      doc.text("APTIKA Tools  /  Bukti Pendaftaran Magang", left, 17);
      style(9, muted);
      doc.text(ref, 194, 17, { align: "right" });
      doc.setDrawColor(border);
      doc.line(left, 21, 194, 21);
    }
    doc.setDrawColor(border);
    doc.line(left, 279, 194, 279);
    style(8, muted);
    doc.text("Bukti pengiriman pendaftaran", left, 285);
    doc.text(`${number} / ${pages}`, 194, 285, { align: "right" });
  }

  return doc;
}
