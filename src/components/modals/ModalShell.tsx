// src/components/modals/ModalShell.tsx
import React, { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g., "max-w-lg" (default)
};

const ModalShell: React.FC<Props> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-lg",
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`w-[92vw] ${maxWidthClass} rounded-xl bg-white shadow-2xl border border-slate-200 p-5 md:p-6 transform transition-all duration-200 ease-out scale-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-3 top-3 inline-grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
        >
          ×
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default ModalShell;
