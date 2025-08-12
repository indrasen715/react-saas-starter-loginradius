import { APIClient } from "./http";
const organizationAPIClient = new APIClient(import.meta.env.VITE_LOGINRADIUS_WRAPPER_BASE_URL);

export interface UserOrg { Id: string; Name: string }
export interface TenantRole { Id: string; Name: string }
export interface UserInfo { Email: string; Uid: string }

export interface UserConfigResponse {
  success: boolean;
  organizations: UserOrg[];
  tenantRoles: TenantRole[];
  userInfo: UserInfo;
}

/** Raw shape from backend (note the typo 'sucess') */
type RawVerifiedCredentialsResponse = {
  sucess?: boolean;     // backend typo
  success?: boolean;    // future-proof if they fix it
  qrcode?: string;
  guid?: string;
};

/** Normalized shape used by the app */
export interface VerifiedCredentialsResponse {
  success: boolean;
  qrcode: string;
  guid: string;
}

export const UserConfigAPI = {
  get: async (): Promise<UserConfigResponse> => {
    const res = await organizationAPIClient.get<UserConfigResponse>("/users/config");
    return (res as any)?.data ?? res;
  },

  getVerfiedCredentials: async (): Promise<VerifiedCredentialsResponse> => {
    const res = await organizationAPIClient.get<RawVerifiedCredentialsResponse>("/credential/create");
    const data: RawVerifiedCredentialsResponse = (res as any)?.data ?? res ?? {};

    // Normalize: map `sucess` → `success`, ensure strings
    const success = Boolean(data.success ?? data.sucess ?? false);
    const qrcode = String(data.qrcode ?? "");
    const guid = String(data.guid ?? "");

    return { success, qrcode, guid };
  },
};
