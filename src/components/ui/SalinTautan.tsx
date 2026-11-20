"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function SalinTautan({ path, label, appearance = "button" }: {
  path: string;
  label: string;
  appearance?: "button" | "icon";
}) {
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState("");

  async function salinLink() {
    const url = new URL(path, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setManualLink("");
    } catch {
      setCopied(false);
      setManualLink(url);
    }
  }

  const iconOnly = appearance === "icon";
  return (
    <div className={iconOnly ? "shrink-0" : "space-y-2"}>
      <button type="button" onClick={salinLink} aria-label={`Salin link ${label}`}
        title={iconOnly ? (copied ? "Link tersalin" : `Salin link ${label}`) : undefined}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${iconOnly
          ? `h-9 w-9 ${copied ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`
          : "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"}`}>
        {copied ? <Check size={17} aria-hidden="true" /> : <Link2 size={17} aria-hidden="true" />}
        {!iconOnly && <span>{copied ? "Tersalin" : `Salin link ${label}`}</span>}
      </button>
      <span role="status" className="sr-only">{copied ? "Link tersalin" : ""}</span>
      {manualLink && <input aria-label={`Link ${label}`} readOnly value={manualLink} onFocus={event => event.currentTarget.select()}
        className={`block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 ${iconOnly ? "absolute right-0 top-full z-10 mt-1 w-60 max-w-[calc(100vw-3rem)] shadow-md" : "w-full max-w-md"}`} />}
    </div>
  );
}
