// src/services/qrLogin.ts
const API_KEY = import.meta.env.VITE_LOGINRADIUS_API_KEY as string;
const QR_BASE = (import.meta.env.VITE_LOGINRADIUS_CLOUD_API_BASE_URL as string) || "https://devcloud-api.lrinternal.com";

type GenerateQRResponse = { code?: string };
type PollQRTokenResponse = { access_token?: string };

export const QRLoginService = {
  async generate(signal?: AbortSignal): Promise<GenerateQRResponse> {
    const res = await fetch(`${QR_BASE}/sso/mobile/generate?apikey=${API_KEY}`, { signal });
    if (!res.ok) throw new Error(`QR generate failed: ${res.status}`);
    return res.json();
  },

  async pollToken(code: string, signal?: AbortSignal): Promise<PollQRTokenResponse> {
    const u = new URL(`${QR_BASE}/sso/mobile/token`);
    u.searchParams.set("code", code);
    u.searchParams.set("apikey", API_KEY);
    const res = await fetch(u.toString(), { signal });
    if (!res.ok) throw new Error(`QR token poll failed: ${res.status}`);
    return res.json();
  },
};
