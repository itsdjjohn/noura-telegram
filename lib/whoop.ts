import crypto from "node:crypto";

const AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const API_BASE = "https://api.prod.whoop.com/developer/v2";

export const WHOOP_SCOPES = [
  "read:recovery",
  "read:cycles",
  "read:workout",
  "read:sleep",
  "read:profile",
  "read:body_measurement",
  "offline",
].join(" ");

export type WhoopToken = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  expires_at: number;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getWhoopRedirectUri() {
  return process.env.WHOOP_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/whoop/callback`;
}

export function getWhoopAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: required("WHOOP_CLIENT_ID"),
    redirect_uri: getWhoopRedirectUri(),
    response_type: "code",
    scope: WHOOP_SCOPES,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeWhoopCode(code: string): Promise<WhoopToken> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: required("WHOOP_CLIENT_ID"),
      client_secret: required("WHOOP_CLIENT_SECRET"),
      redirect_uri: getWhoopRedirectUri(),
    }),
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error_description || body?.error || "WHOOP token exchange failed");
  return { ...body, expires_at: Date.now() + Number(body.expires_in || 3600) * 1000 };
}

export async function refreshWhoopToken(token: WhoopToken): Promise<WhoopToken> {
  if (!token.refresh_token) throw new Error("WHOOP refresh token is missing");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      client_id: required("WHOOP_CLIENT_ID"),
      client_secret: required("WHOOP_CLIENT_SECRET"),
      scope: "offline",
    }),
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error_description || body?.error || "WHOOP token refresh failed");
  return { ...body, expires_at: Date.now() + Number(body.expires_in || 3600) * 1000 };
}

export async function whoopApi<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.detail || body?.error || `WHOOP API ${response.status}`);
  return body as T;
}

function key() {
  return crypto.createHash("sha256").update(required("WHOOP_SESSION_SECRET")).digest();
}

export function sealToken(token: WhoopToken) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(token), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function openToken(value: string): WhoopToken {
  const payload = Buffer.from(value, "base64url");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"));
}
