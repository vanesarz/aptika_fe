import { api } from "./api";

export type MetodeBobotMagang = "sama" | "berbeda";
export interface AspekPenilaianMagang {
  aspek: string;
  skala?: string | null;
  nilai_min?: number | string | null;
  nilai_maks?: number | string | null;
  bobot?: number | string | null;
}
export interface NilaiMagang extends AspekPenilaianMagang { nilai: string; nilai_terbobot?: number | null }
export type JenisDokumenMagang = "penerimaan" | "selesai" | "penilaian";
export interface DokumenMagang {
  jenis: JenisDokumenMagang;
  status: "diproses" | "disahkan" | "perlu_revisi";
  nomor?: string;
  pengesah?: string;
  file?: string;
  catatan?: string;
}
export interface MagangWorkflow {
  id: number;
  nama: string;
  created_at?: string;
  foto_url?: string | null;
  foto_latar?: string;
  status_magang?: string;
  keterangan?: string;
  bidang?: { name: string; code: string };
  mentor?: { id: number; name: string } | null;
  cv_magang?: string;
  user_id?: number;
  email_login?: string;
  lampiran_pendaftaran?: { jenis: string; nama: string; label: string; url: string }[];
  ringkasan_nilai?: { rata_rata: number } | { total_bobot: number; total_terbobot: number | null };
  nama_kampus?: string;
  bidang_id?: number;
  nim?: string;
  jurusan?: string;
  email?: string;
  telepon?: string;
  alamat?: string;
  memiliki_laptop?: boolean;
  mentor_id?: number;
  status_seleksi: "menunggu" | "diterima" | "ditolak";
  catatan_seleksi?: string;
  nomor_nda?: string;
  nda_file?: string;
  nda_validated_at?: string;
  penilaian?: NilaiMagang[];
  kebutuhan_kampus?: { link?: string; panduan?: string } | null;
  metode_bobot?: MetodeBobotMagang | null;
  rubrik_penilaian?: AspekPenilaianMagang[];
  versi_rubrik_penilaian?: string | null;
  format_penilaian?: string;
  catatan_penilaian?: string;
  kampus_perlu_input?: boolean;
  kampus_sudah_input?: boolean;
  dinilai_at?: string;
  disahkan_at?: string;
  nomor_sertifikat?: string;
  sertifikat_file?: string;
  tgl_mulai: string;
  tgl_selesai: string;
  pengingat?: string;
  pengingat_hari?: number[];
  dokumens?: DokumenMagang[];
  riwayat_perubahan?: { waktu: string; oleh: number; kolom: string[]; alasan?: string }[];
}
export interface OpsiMagang {
  rubrik_telkom: { aspek: string; bobot: number }[];
  mentors: { id: number; name: string; kuota: number | null }[];
  jurusan_prioritas: string[];
  nda_wajib_sebelum_penilaian: boolean;
}
export const opsiMagang = async (bidang_id?: number): Promise<OpsiMagang> =>
  (await api.get("/magang/options", { params: { bidang_id } })).data.data;
export const seleksiMagang = (id: number, status_seleksi: string, catatan_seleksi: string, mentor_id?: number, jurusan_sesuai?: boolean) =>
  api.patch(`/magang/${id}/seleksi`, { status_seleksi, catatan_seleksi, mentor_id, jurusan_sesuai });
export const validasiNdaMagang = (id: number) => api.post(`/magang/${id}/validasi-nda`);
export const simpanKebutuhanKampus = (id: number, payload: FormData | { metode_bobot: MetodeBobotMagang; aspek_penilaian: AspekPenilaianMagang[] }) =>
  api.post(`/magang/${id}/kebutuhan-kampus`, payload);
export const nilaiMagang = (id: number, versi_rubrik_penilaian: string, nilai: string[]) =>
  api.post(`/magang/${id}/penilaian`, { versi_rubrik_penilaian, nilai });
export const sahkanMagang = (id: number, payload: FormData) => api.post(`/magang/${id}/pengesahan`, payload);
export const simpanDokumenMagang = (id: number, payload: FormData) => api.post(`/magang/${id}/dokumen`, payload);
export const aturPengingatMagang = (id: number, pengingat_hari: number[]) => api.patch(`/magang/${id}/pengingat`, { pengingat_hari });
export const tandaiInputKampusSelesai = (id: number) =>
  api.patch(`/magang/${id}/kampus`, { kampus_sudah_input: true });

export const aktivasiAkunMagang = (id: number) => api.post(`/magang/${id}/akun`);
