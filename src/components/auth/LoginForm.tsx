// src/components/LoginForm.tsx
import React, { useRef, useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { setSession } from "../utils/sessionHelper";
import { AuthFlow } from "../../lib/loginradius-react-sdk";
import { showToast } from "../utils/showToast";
import { QRLoginService } from "../../services/qrLogin";
import { DIDVerifyService } from "../../services/didVerify";
import { createPoller } from "../../services/polling";

import QrLoginModal from "./../modals/QrLoginModal";
import DidVerifyModal from "./../modals/DidVerifyModal";

interface LoginFormProps {
  onToggleMode?: () => void;
}
interface ApiError {
  error: string;
}

export const LoginForm: React.FC<LoginFormProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // QR login state
  const [qrValue, setQrValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  // DID verify state
  const [showDidModal, setShowDidModal] = useState(false);
  const [didQrValue, setDidQrValue] = useState("");
  const [didEmail, setDidEmail] = useState("");
  const [showDidQr, setShowDidQr] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [didSubmitLoading, setDidSubmitLoading] = useState(false);

  // Query param control
  const [searchParams] = useSearchParams();
  const hideQR = searchParams.get("vtype") === "orginvite";

  // Polling control refs
  const qrAbortRef = useRef<AbortController | null>(null);
  const didAbortRef = useRef<AbortController | null>(null);
  const qrPollStopRef = useRef<(() => void) | null>(null);
  const didPollStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      qrPollStopRef.current?.();
      didPollStopRef.current?.();
      qrAbortRef.current?.abort();
      didAbortRef.current?.abort();
    };
  }, []);

  const handleLoginSuccess = (response: any) => {
    const token = response?.access_token || response?.data?.access_token;
    if (token) {
      setSession(token);
      showToast("Logged in successfully.");
      const redirect = new URLSearchParams(location.search).get("redirect");
      navigate(redirect || "/dashboard", { replace: true });
    } else {
      showToast("No access token found.", "error");
      console.error("No access token found");
    }
  };

  const handleError = (error: ApiError) => {
    console.error("Auth error:", error?.error || error);
    showToast(error?.error || "Authentication error.", "error");
  };

  /** ---------- QR Login Flow ---------- **/
  const generateQrCode = async () => {
    try {
      setQrLoading(true);
      qrAbortRef.current?.abort();
      qrAbortRef.current = new AbortController();

      const data = await QRLoginService.generate(qrAbortRef.current.signal);
      if (data?.code) {
        setQrValue(data.code);
        setShowModal(true);
        startQrPolling(data.code);
      } else {
        showToast("Failed to generate QR code.", "error");
      }
    } catch (err) {
      if ((err as any)?.name !== "AbortError") {
        console.error("Error generating QR code:", err);
        showToast("Error generating QR code.", "error");
      }
    } finally {
      setQrLoading(false);
    }
  };

  const startQrPolling = async (code: string) => {
    qrPollStopRef.current?.();
    qrAbortRef.current?.abort();
    qrAbortRef.current = new AbortController();

    const poller = createPoller(3000);
    qrPollStopRef.current = await poller.start(async () => {
      const data = await QRLoginService.pollToken(code, qrAbortRef.current?.signal);
      if (data?.access_token) {
        poller.stop();
        qrPollStopRef.current = null;
        setShowModal(false);
        setSession(data.access_token);
        showToast("Logged in via QR successfully.");
        const redirect = new URLSearchParams(location.search).get("redirect");
        navigate(redirect || "/dashboard", { replace: true });
        return true;
      }
      return false;
    });
  };

  const closeQrModal = () => {
    qrPollStopRef.current?.();
    qrAbortRef.current?.abort();
    setShowModal(false);
    setQrValue("");
  };

  /** ---------- DID Verify Flow ---------- **/
  const handleDidSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(didEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setDidSubmitLoading(true);
      didAbortRef.current?.abort();
      didAbortRef.current = new AbortController();

      const data = await DIDVerifyService.start(didEmail, didAbortRef.current.signal);
      const success = data?.success === true || data?.sucess === true;

      if (success && data?.qrcode && data?.guid) {
        setDidQrValue(data.qrcode);
        setShowDidQr(true);
        showToast("DID QR generated. Please scan with Microsoft Authenticator.");
        startDidPolling(data.guid);
      } else {
        showToast("Failed to start DID verification.", "error");
      }
    } catch (err) {
      if ((err as any)?.name !== "AbortError") {
        console.error("Error in DID verify API:", err);
        showToast("Error starting DID verification.", "error");
      }
    } finally {
      setDidSubmitLoading(false);
    }
  };

  const startDidPolling = async (guid: string) => {
    didPollStopRef.current?.();
    didAbortRef.current?.abort();
    didAbortRef.current = new AbortController();

    const poller = createPoller(3000);
    didPollStopRef.current = await poller.start(async () => {
      const data = await DIDVerifyService.poll(guid, didAbortRef.current?.signal);
      if (data?.access_token) {
        poller.stop();
        didPollStopRef.current = null;
        setShowDidModal(false);
        setShowDidQr(false);
        setDidQrValue("");
        setSession(data.access_token);
        showToast("DID verified successfully.");
        const redirect = new URLSearchParams(location.search).get("redirect");
        navigate(redirect || "/dashboard", { replace: true });
        return true;
      }
      return false;
    });
  };

  const openDidModal = () => {
    setShowDidModal(true);
    setShowDidQr(false);
    setDidEmail("");
    setEmailError("");
    didPollStopRef.current?.();
    didAbortRef.current?.abort();
    setDidQrValue("");
  };

  const closeDidModal = () => {
    didPollStopRef.current?.();
    didAbortRef.current?.abort();
    setShowDidModal(false);
    setShowDidQr(false);
    setDidQrValue("");
  };

  return (
    <div>
      <AuthFlow onSuccess={handleLoginSuccess} onError={handleError} />

      {!hideQR && (
        <div className="mt-4 text-center space-y-2">
          <button
            onClick={generateQrCode}
            disabled={qrLoading}
            className={`mx-auto block w-[var(--sdk-card-width,400px)] rounded-md px-4 py-2 text-sm font-semibold text-white transition
              ${qrLoading ? "bg-blue-500 opacity-90 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {qrLoading ? "Generating QR…" : "Scan QR Code For Login"}
          </button>

          <button
            onClick={openDidModal}
            className="mx-auto block w-[var(--sdk-card-width,400px)] rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            DID Verify Credentials
          </button>
        </div>
      )}

      {/* QR Login Modal */}
      <QrLoginModal
        open={showModal}
        onClose={closeQrModal}
        qrValue={qrValue}
        onRefresh={() => startQrPolling(qrValue)}
      />

      {/* DID Verify Modal */}
      <DidVerifyModal
        open={showDidModal}
        onClose={closeDidModal}
        showQr={showDidQr}
        didQrValue={didQrValue}
        didEmail={didEmail}
        setDidEmail={setDidEmail}
        emailError={emailError}
        onSubmitEmail={handleDidSubmit}
        submitLoading={didSubmitLoading}
      />
    </div>
  );
};

export default LoginForm;
