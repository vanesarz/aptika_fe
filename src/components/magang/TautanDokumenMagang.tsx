"use client";

import { useState } from "react";
import { ArrowUpRight, Download, FileText } from "lucide-react";
import { api } from "@/services/api";

const buttonClass = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800";
const inlineTypes = ["application/pdf", "image/jpeg", "image/png"];

export function TautanDokumenMagang({ label, filename, href, authenticated = false }: {
  label: string;
  filename?: string;
  href: string;
  authenticated?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function transfer(action: "open" | "download") {
    if (busy) return;
    setError("");

    // Reserve the tab during the click so asynchronous fetching doesn't trigger popup blocking.
    const tab = action === "open" ? window.open("about:blank", "_blank") : null;
    if (action === "open" && !tab) {
      setError("Izinkan pop-up untuk membuka dokumen di tab baru.");
      return;
    }
    if (tab) tab.opener = null;
    setBusy(true);
    try {
      let file: Blob;
      if (authenticated) {
        file = (await api.get<Blob>(href, { responseType: "blob" })).data;
      } else {
        const response = await fetch(href, { credentials: "omit" });
        if (!response.ok) throw new Error("Dokumen tidak tersedia");
        file = await response.blob();
      }

      if (tab) {
        if (tab.closed) return;
        const type = inlineTypes.includes(file.type) ? file.type : "application/octet-stream";
        const url = URL.createObjectURL(file.slice(0, file.size, type));
        tab.location.replace(url);
        const timer = window.setInterval(() => {
          if (!tab.closed) return;
          window.clearInterval(timer);
          URL.revokeObjectURL(url);
        }, 1000);
      } else {
        const pathName = new URL(href, window.location.href).pathname.split("/").pop();
        const link = document.createElement("a");
        link.download = filename || (pathName ? decodeURIComponent(pathName) : "") || label;
        const url = URL.createObjectURL(file);
        link.href = url;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      tab?.close();
      setError(action === "open" ? "Dokumen tidak dapat dibuka." : "Dokumen tidak dapat diunduh.");
    } finally {
      setBusy(false);
    }
  }

  const openLabel = `Buka ${label} di tab baru`;
  const downloadLabel = `Unduh ${label}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <FileText size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          {filename && <p className="mt-0.5 break-words text-xs text-slate-600 dark:text-slate-400">{filename}</p>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {authenticated ? (
            <button type="button" className={buttonClass} title={openLabel} aria-label={openLabel} disabled={busy} onClick={() => void transfer("open")}>
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          ) : (
            <a className={buttonClass} title={openLabel} aria-label={openLabel} href={href} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          )}
          <button type="button" className={buttonClass} title={downloadLabel} aria-label={downloadLabel} disabled={busy} onClick={() => void transfer("download")}>
            <Download size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{error}</p>}
    </div>
  );
}
