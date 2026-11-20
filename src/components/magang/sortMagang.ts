export type SortMagang = "terbaru" | "terlama" | "nama_az" | "nama_za" | "kampus_az" | "kampus_za";
type Item = { id: number; created_at?: string; nama?: string; nama_kampus?: string };
const collator = new Intl.Collator("id", { sensitivity: "base", numeric: true });
const timestamp = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
export function sortMagang<T extends Item>(items: readonly T[], sort: SortMagang = "terbaru"): T[] {
  return [...items].sort((a, b) => {
    const newest = timestamp(b.created_at) - timestamp(a.created_at) || b.id - a.id;
    if (sort === "terbaru") return newest;
    if (sort === "terlama") return -newest;
    const field = sort.startsWith("nama") ? "nama" : "nama_kampus";
    const alphabetical = collator.compare(a[field] || "", b[field] || "");
    return (sort.endsWith("za") ? -alphabetical : alphabetical) || newest;
  });
}
