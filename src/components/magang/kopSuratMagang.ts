export const namaDinasMagang = "DINAS KOMUNIKASI DAN INFORMATIKA PROVINSI JAWA BARAT";

export const gayaKopSuratMagang = `
  @page {
    size: A4;
    margin: 2cm 20mm 15mm 20mm;
  }
  .logo-container {
    text-align: center;
    margin-bottom: 12px;
  }
  .logo-container img {
    width: 80px;
    height: auto;
  }
  .title-header {
    text-align: center;
    font-weight: bold;
    font-size: 11pt;
    line-height: 1.35;
    margin-bottom: 18px;
  }
  .title-header .doc-no {
    margin-top: 8px;
    font-size: 10pt;
    font-weight: bold;
  }
`;

export function kopSuratMagang(origin: string, judulHtml: string) {
  return `
    <div class="logo-container">
      <img src="${origin}/logo-jabar.png" alt="Logo Jawa Barat" />
    </div>
    <div class="title-header">
      <strong>DRAF — BELUM DISAHKAN</strong><br>${judulHtml}
    </div>
  `;
}
