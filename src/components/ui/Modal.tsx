import * as React from "react";
import { createPortal } from "react-dom";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useDialog } from "./useDialog";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  allowFullscreen?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  allowFullscreen = false,
}: ModalProps) {
  const [minimized, setMinimized] = React.useState(false);
  const fullscreen = allowFullscreen && !minimized;
  const dialogRef = useDialog(isOpen, onClose);
  const titleId = React.useId();

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const dialog = (
    <div className={`fixed inset-0 ${allowFullscreen ? "z-[80]" : "z-50"} flex items-center justify-center ${fullscreen ? "p-0" : "p-4"}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`
          relative w-full ${fullscreen ? "h-dvh max-w-none rounded-none" : `${sizeClasses[size]} max-h-[90vh] rounded-2xl`} bg-white dark:bg-[#0d1d36] shadow-xl border border-slate-100 dark:border-slate-800
          overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 id={titleId} className="text-base font-bold text-slate-900 dark:text-slate-100">
            {title || "Konfirmasi"}
          </h3>
          <div className="flex items-center gap-2">
          {allowFullscreen && <button type="button" aria-label={fullscreen ? "Perkecil detail" : "Layar penuh"} onClick={() => setMinimized(!minimized)} className="p-1.5 rounded-lg hover:bg-slate-100">{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>}
          <button
            type="button"
            aria-label="Tutup dialog"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-5 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed scrollbar-hide">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-[#081326] border-t border-slate-100 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
  return allowFullscreen ? createPortal(dialog, document.body) : dialog;
}
export { Modal };
