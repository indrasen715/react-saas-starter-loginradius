// src/components/modals/QrLoginModal.tsx
import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import ModalShell from "./ModalShell";

type Props = {
  open: boolean;
  onClose: () => void;
  qrValue: string;
  onRefresh?: () => void;
};

const QrLoginModal: React.FC<Props> = ({ open, onClose, qrValue, onRefresh }) => {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Scan this QR Code"
      subtitle="Use your mobile app to approve login"
      maxWidthClass="max-w-md"
    >
      <div className="flex flex-col items-center">
        <div className="relative mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-lg transition">
          <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-blue-500/10 blur-xl" />
          <QRCodeCanvas value={qrValue} size={220} className="relative z-10" />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Open your mobile app and scan the code to continue.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          {onRefresh ? (
            <button
              onClick={onRefresh}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Refresh QR
            </button>
          ) : null}
        </div>

        <div className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <h4 className="mb-1 font-semibold text-slate-900">Tips</h4>
          <ul className="list-inside list-disc space-y-1">
            <li>Make sure your phone is connected to the internet.</li>
            <li>Move closer if the camera can’t focus on the QR.</li>
          </ul>
        </div>
      </div>
    </ModalShell>
  );
};

export default QrLoginModal;
