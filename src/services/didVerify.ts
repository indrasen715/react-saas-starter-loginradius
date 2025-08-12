// src/services/didVerify.ts
const API_KEY = import.meta.env.VITE_LOGINRADIUS_API_KEY as string;
const DID_BASE = (import.meta.env.VITE_AUTH_IGNITE_BASE_URL as string) || "https://auth-ignite.onrender.com";

type StartVerifyResp = {
  success?: boolean;   // correct
  sucess?: boolean;    // misspelled from backend (tolerated)
  qrcode?: string;
  guid?: string;
};

type PollVerifyResp = { access_token?: string };

export const DIDVerifyService = {
  async start(email: string, signal?: AbortSignal): Promise<StartVerifyResp> {
    const u = new URL(`${DID_BASE}/credential/verify`);
    u.searchParams.set("apikey", API_KEY);
    const res = await fetch(u.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      signal,
    });
    if (!res.ok) throw new Error(`DID start verify failed: ${res.status}`);
    return res.json();
  },

  async poll(guid: string, signal?: AbortSignal): Promise<PollVerifyResp> {
    const res = await fetch(`${DID_BASE}/credential/ping/${guid}`, { signal });
    if (!res.ok) throw new Error(`DID poll failed: ${res.status}`);
    return res.json();
  },
};
