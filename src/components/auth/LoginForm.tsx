import React, { useRef, useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { setSession } from "../utils/sessionHelper";
import { AuthFlow } from "../../lib/loginradius-react-sdk";
import { QRCodeCanvas } from "qrcode.react";
import { showToast } from "../utils/showToast";
import { QRLoginService } from "../../services/qrLogin";
import { DIDVerifyService } from "../../services/didVerify";
import { createPoller } from "../../services/polling";

interface LoginFormProps { onToggleMode: () => void }
interface ApiError { error: string }

export const LoginForm: React.FC<LoginFormProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // QR modal state
  const [qrValue, setQrValue] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [qrLoading, setQrLoading] = useState(false);

  // DID modal state
  const [showDidModal, setShowDidModal] = useState<boolean>(false);
  const [didQrValue, setDidQrValue] = useState<string>("");
  const [didEmail, setDidEmail] = useState<string>("");
  const [showDidQr, setShowDidQr] = useState<boolean>(false);
  const [emailError, setEmailError] = useState("");
  const [didSubmitLoading, setDidSubmitLoading] = useState(false); // <-- split loading

  // query param
  const [searchParams] = useSearchParams();
  const hideQR = searchParams.get("vtype") === "orginvite";

  // poll controls
  const qrAbortRef = useRef<AbortController | null>(null);
  const didAbortRef = useRef<AbortController | null>(null);
  const qrPollStopRef = useRef<(() => void) | null>(null);
  const didPollStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (qrPollStopRef.current) qrPollStopRef.current();
      if (didPollStopRef.current) didPollStopRef.current();
      if (qrAbortRef.current) qrAbortRef.current.abort();
      if (didAbortRef.current) didAbortRef.current.abort();
    };
  }, []);

  const handleLoginSuccess = (response: any) => {
    const token = response?.access_token || response?.data?.access_token;
    if (token) {
      setSession(token);
      showToast("Logged in successfully.");
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");
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

  // ---- Normal QR Login ----
  const generateQrCode = async () => {
    try {
      setQrLoading(true);
      // abort any previous
      if (qrAbortRef.current) qrAbortRef.current.abort();
      qrAbortRef.current = new AbortController();

      const data = await QRLoginService.generate(qrAbortRef.current.signal);
      if (data?.code) {
        setQrValue(data.code);
        setShowModal(true);
        startQrPolling(data.code);
      } else {
        showToast("Failed to generate QR code.", "error");
        console.error("QR generate did not return a code");
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
    // stop previous
    if (qrPollStopRef.current) qrPollStopRef.current();
    if (qrAbortRef.current) qrAbortRef.current.abort();

    qrAbortRef.current = new AbortController();
    const poller = createPoller(3000);

    qrPollStopRef.current = await poller.start(async () => {
      const data = await QRLoginService.pollToken(code, qrAbortRef.current?.signal);
      if (data?.access_token) {
        // success: stop polling and proceed
        poller.stop();
        qrPollStopRef.current = null;
        setShowModal(false);
        const token = data.access_token;
        setSession(token);
        showToast("Logged in via QR successfully.");
        const params = new URLSearchParams(location.search);
        const redirect = params.get("redirect");
        navigate(redirect || "/dashboard", { replace: true });
        return true; // done
      }
      return false; // keep polling
    });
  };

  const closeQrModal = () => {
    // closing the modal should halt polling immediately
    if (qrPollStopRef.current) qrPollStopRef.current();
    qrPollStopRef.current = null;
    if (qrAbortRef.current) qrAbortRef.current.abort();
    setShowModal(false);
    setQrValue("");
  };

  // ---- DID Verify flow ----
  const handleDidSubmit = async () => {
    // validate email first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(didEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setDidSubmitLoading(true);
      if (didAbortRef.current) didAbortRef.current.abort();
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
        console.error("DID start verify missing fields", data);
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
    if (didPollStopRef.current) didPollStopRef.current();
    if (didAbortRef.current) didAbortRef.current.abort();

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
        const token = data.access_token;
        setSession(token);
        showToast("DID verified successfully.");
        const params = new URLSearchParams(location.search);
        const redirect = params.get("redirect");
        navigate(redirect || "/dashboard", { replace: true });
        return true;
      }
      return false;
    });
  };

  const openDidModal = () => {
    // opening the modal should NOT set loading on the outer button anymore
    setShowDidModal(true);
    setShowDidQr(false);
    setDidEmail("");
    setEmailError("");
    // stop any previous DID poll if it existed
    if (didPollStopRef.current) didPollStopRef.current();
    if (didAbortRef.current) didAbortRef.current.abort();
    setDidQrValue("");
  };

  const closeDidModal = () => {
    if (didPollStopRef.current) didPollStopRef.current();
    didPollStopRef.current = null;
    if (didAbortRef.current) didAbortRef.current.abort();
    setShowDidModal(false);
    setShowDidQr(false);
    setDidQrValue("");
  };

  return (
    <div>
      <AuthFlow onSuccess={handleLoginSuccess} onError={handleError} />

      {!hideQR && (
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button
            onClick={generateQrCode}
            disabled={qrLoading}
            style={{
              width: "var(--sdk-card-width, 400px)",
              margin: "10px auto",
              display: "block",
              backgroundColor: qrLoading ? "#5a9bd6" : "#0078d4",
              color: "#fff",
              border: "none",
              padding: "10px 0",
              fontSize: "16px",
              borderRadius: "6px",
              cursor: qrLoading ? "not-allowed" : "pointer",
              opacity: qrLoading ? 0.9 : 1
            }}
          >
            {qrLoading ? "Generating QR…" : "Scan QR Code For Login"}
          </button>

          <button
            onClick={openDidModal}
            // IMPORTANT: this button no longer shows loading when submitting email
            style={{
              width: "var(--sdk-card-width, 400px)",
              margin: "10px auto",
              display: "block",
              backgroundColor: "#0078d4",
              color: "#fff",
              border: "none",
              padding: "10px 0",
              fontSize: "16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            DID Verify Credentials
          </button>
        </div>
      )}

      {showModal && (
        <Modal onClose={closeQrModal} title="Scan this QR Code">
          <QRCodeCanvas value={qrValue} size={220} />
        </Modal>
      )}

      {showDidModal && (
        <Modal onClose={closeDidModal}
          title={
            !showDidQr ? (
              "DID Verification"
            ) : (
              <>
                Use Microsoft Authenticator <br />
                to scan this QR code and present
                <br />
                your credential securely.
              </>
            )
          }
        >
          {!showDidQr ? (
            <div style={{ textAlign: "center" }}>
              <input
                type="email"
                value={didEmail}
                onChange={(e) => {
                  setDidEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="Enter your email"
                style={{
                  padding: "10px",
                  width: "100%",
                  marginBottom: "5px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                }}
              />
              {emailError && (
                <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>
                  {emailError}
                </div>
              )}
              <button
                onClick={handleDidSubmit}
                disabled={didSubmitLoading}
                style={{
                  backgroundColor: didSubmitLoading ? "#5a9bd6" : "#0078d4",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: didSubmitLoading ? "not-allowed" : "pointer",
                  opacity: didSubmitLoading ? 0.9 : 1
                }}
              >
                {didSubmitLoading ? "Submitting…" : "Submit"}
              </button>
            </div>
          ) : (
            <QRCodeCanvas value={didQrValue} size={250} />
          )}
        </Modal>
      )}
    </div>
  );
};

// Reusable Modal component (backdrop click closes; inner click does not)
const Modal: React.FC<{ onClose: () => void; title: React.ReactNode; children: React.ReactNode }> = ({
  onClose,
  title,
  children,
}) => {
  return (
    <div
      onClick={onClose} // click outside closes
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex",
        justifyContent: "center", alignItems: "center", zIndex: 9999,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent overlay close when clicking inside
        style={{
          background: "#fff", padding: "30px", borderRadius: "12px",
          textAlign: "center", position: "relative", minWidth: "300px",
          maxWidth: "90vw",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "10px", right: "10px",
            background: "transparent", border: "none", fontSize: "22px", cursor: "pointer",
          }}
          aria-label="Close modal"
        >
          ×
        </button>
        <h3 style={{ marginBottom: "20px" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
};
