// src/components/modals/DidVerifyModal.tsx
import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import ModalShell from "./ModalShell";

type Props = {
  open: boolean;
  onClose: () => void;

  // email form props
  showQr: boolean;
  didQrValue: string;
  didEmail: string;
  setDidEmail: (v: string) => void;
  emailError?: string;
  onSubmitEmail: () => void;
  submitLoading?: boolean;
};

const DidVerifyModal: React.FC<Props> = ({
  open,
  onClose,
  showQr,
  didQrValue,
  didEmail,
  setDidEmail,
  emailError,
  onSubmitEmail,
  submitLoading,
}) => {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={
        showQr ? (
          <>
            Use Microsoft Authenticator <br /> to present your credential
          </>
        ) : (
          "DID Verification"
        )
      }
      subtitle={showQr ? "Scan the QR to proceed" : "Enter your email to start verification"}
      maxWidthClass="max-w-md"
    >
      {!showQr ? (
        <div className="space-y-3">
          <div>
            <input
              type="email"
              value={didEmail}
              onChange={(e) => setDidEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            {emailError ? (
              <div className="mt-1 text-xs text-red-600">{emailError}</div>
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onSubmitEmail}
              disabled={submitLoading}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {submitLoading ? "Submitting…" : "Submit"}
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <h4 className="mb-1 font-semibold text-slate-900">What happens next?</h4>
            <ul className="list-inside list-disc space-y-1">
              <li>We’ll generate a QR code tied to your request.</li>
              <li>Open Microsoft Authenticator → Verified IDs → Scan QR code.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-lg transition">
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-blue-500/10 blur-xl" />
            <QRCodeCanvas value={didQrValue} size={250} className="relative z-10" />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Open Microsoft Authenticator → Verified IDs → Scan QR code.
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>

          <div className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <h4 className="mb-1 font-semibold text-slate-900">Tips</h4>
            <ul className="list-inside list-disc space-y-1">
              <li>Ensure camera permissions are allowed for Microsoft Authenticator.</li>
              <li>If the QR expires, close and submit again to refresh.</li>
            </ul>
          </div>
        </div>
      )}
    </ModalShell>
  );
};

export default DidVerifyModal;
