// src/pages/VerifiedCredentials.tsx
import React, { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Button } from "../ui/button";
import { UserConfigAPI, VerifiedCredentialsResponse } from "../../services/userConfig";

const Description: React.FC = () => (
  <div className="space-y-2 text-sm text-gray-600">
    <p className="font-medium text-gray-900">
      Scan this QR code in the Microsoft Authenticator app to add your Verifiable Credential.
    </p>
    <p>
      <span className="font-medium">Open</span> Microsoft Authenticator →{" "}
      <span className="font-medium">Verified IDs</span> →{" "}
      <span className="font-medium">Scan QR code</span> → point your camera at this code.
    </p>
    <p>
      Follow the instructions in the app to review and accept your credential. Once done, it will appear in your
      <span className="font-medium"> Verified IDs</span> list.
    </p>
  </div>
);

const QRSkeleton: React.FC = () => (
  <div className="w-full flex flex-col items-center gap-6">
    <div className="animate-pulse rounded-2xl bg-gray-200" style={{ width: 256, height: 256 }} />
    <div className="w-full max-w-md space-y-3">
      <div className="animate-pulse h-4 bg-gray-200 rounded" />
      <div className="animate-pulse h-4 bg-gray-200 rounded w-5/6" />
      <div className="animate-pulse h-4 bg-gray-200 rounded w-4/6" />
    </div>
  </div>
);

export const VerifiedCredentials: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [qrPayload, setQrPayload] = useState<string>("");
  const [qrImage, setQrImage] = useState<string>("");
  const [guid, setGuid] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // prevent StrictMode double-fetch + dedupe concurrent clicks
  const didInit = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const parseResponse = (res: VerifiedCredentialsResponse) => {
    const raw = res?.qrcode ?? "";
    console.log(raw)
    const looksLikeImage =
      typeof raw === "string" &&
      (raw.startsWith("data:image") || raw.startsWith("http://") || raw.startsWith("https://"));

    if (looksLikeImage) {
      setQrImage(raw);
      setQrPayload("");
    } else if (typeof raw === "string" && raw.trim().length > 0) {
      setQrPayload(raw);
      setQrImage("");
    } else {
      throw new Error("QR code payload was empty.");
    }

    setGuid(res?.guid ?? "");
  };

  const load = async () => {
    // dedupe clicks
    if (inFlight.current) return inFlight.current;

    const run = (async () => {
      setLoading(true);
      setError(null);
      setQrPayload("");
      setQrImage("");

      // cancel any prior request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        if (!import.meta.env.VITE_LOGINRADIUS_WRAPPER_BASE_URL) {
          throw new Error("API base URL is not configured (VITE_LOGINRADIUS_WRAPPER_BASE_URL).");
        }

        // NOTE: If your API client supports signal, pass abortRef.current.signal into it.
        const res = await UserConfigAPI.getVerfiedCredentials();

        // If the backend returns success=false, show its reason
        if (!res?.success) {
          const reason = (res as any)?.message || (res as any)?.reason || "Server returned success=false.";
          throw new Error(reason);
        }

        parseResponse(res);
      } catch (e: any) {
        const serverMsg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Something went wrong while generating your credential QR.";
        setError(serverMsg);
        // eslint-disable-next-line no-console
        console.error("getVerfiedCredentials failed:", e);
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    })();

    inFlight.current = run;
    return run;
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    // ignore promise
    load();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderQR = () => {
    console.log(qrImage)
    if (qrImage) {
      return (
        <img
          src={qrImage}
          alt="Verifiable Credential QR"
          className="rounded-2xl border shadow-sm"
          style={{ width: 256, height: 256 }}
        />
      );
    }
    return <QRCodeCanvas value={qrPayload} size={256} includeMargin />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">Verified Credentials</h1>
          <p className="text-sm text-gray-500">Issue your Verifiable Credential using Microsoft Authenticator.</p>
        </CardHeader>

        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: QR block */}
            <div className="flex flex-col items-center">
              {loading ? (
                <QRSkeleton />
              ) : error ? (
                <div className="w-full max-w-sm rounded-xl border border-red-200 p-4 text-red-700 bg-red-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Couldn’t load QR code</p>
                      <p className="text-sm mt-1">{error}</p>
                      <div className="mt-3">
                        <Button onClick={load} className="gap-2">
                          <RefreshCcw className="h-4 w-4" />
                          Try again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border">{renderQR()}</div>
                  {guid ? (
                    <div className="text-xs text-gray-500">
                      Request ID: <span className="font-mono">{guid}</span>
                    </div>
                  ) : null}
                  <div>
                    <Button onClick={load} variant="outline" className="gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Refresh QR
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Instructions */}
            <div className="space-y-6">
              <Description />
              <div className="rounded-xl bg-gray-50 border p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Tips</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Use the latest Microsoft Authenticator.</li>
                  <li>If the QR expires, click <span className="font-medium">Refresh QR</span>.</li>
                  <li>Some managed devices block the camera—use a personal device if needed.</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifiedCredentials;
