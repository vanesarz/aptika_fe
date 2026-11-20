import { api } from "./api";

export interface NilaiMagang { aspek: string; nilai: string; skala?: string; bobot?: number }
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
  ringkasan_nilai?: { total_bobot: number; total_terbobot: number };
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
  kebutuhan_kampus?: { link?: string; panduan?: string };
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
export const nilaiMagang = (id: number, payload: {
  penilaian: NilaiMagang[]; format_penilaian: string; catatan_penilaian: string;
  kampus_perlu_input: boolean; kampus_sudah_input: boolean;
}) => api.post(`/magang/${id}/penilaian`, payload);
export const sahkanMagang = (id: number, payload: FormData) => api.post(`/magang/${id}/pengesahan`, payload);
export const simpanDokumenMagang = (id: number, payload: FormData) => api.post(`/magang/${id}/dokumen`, payload);
export const aturPengingatMagang = (id: number, pengingat_hari: number[]) => api.patch(`/magang/${id}/pengingat`, { pengingat_hari });
export const aturStatusKampus = (id: number, kampus_perlu_input: boolean, kampus_sudah_input: boolean) =>
  api.patch(`/magang/${id}/kampus`, { kampus_perlu_input, kampus_sudah_input });

export const aktivasiAkunMagang = (id: number) => api.post(`/magang/${id}/akun`);
