import { ZOOM_OAUTH_URL } from "./config.js";
import type { AppConfig, TokenResponse } from "./types.js";
import { AuthError } from "./errors.js";

let cachedToken: string | null = null;
let cachedExpiresAt = 0;

function getAuthErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Check your account ID.";
    case 401:
      return "Authentication failed. Check your credentials.";
    case 403:
      return "Access denied. Check your app permissions.";
    case 429:
      return "Rate limit exceeded. Please try again later.";
    default:
      return `Authentication failed (HTTP ${status}).`;
  }
}

export async function getAccessToken(config: AppConfig): Promise<string> {
  if (cachedToken && Date.now() < cachedExpiresAt) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "account_credentials",
    account_id: config.accountId,
  });

  const response = await fetch(ZOOM_OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new AuthError(getAuthErrorMessage(response.status));
  }

  const data = (await response.json()) as TokenResponse;
  cachedToken = data.access_token;
  cachedExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return data.access_token;
}
