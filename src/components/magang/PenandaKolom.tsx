export function PenandaKolom({ wajib = false }: { wajib?: boolean }) {
  if (wajib) {
    return <span aria-hidden="true" className="text-xs font-semibold text-rose-600 dark:text-rose-400">*</span>;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium leading-4 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Opsional
    </span>
  );
}
