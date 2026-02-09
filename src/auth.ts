import { ZOOM_OAUTH_URL } from "./config.js";
import type { AppConfig, TokenResponse } from "./types.js";

export async function getAccessToken(config: AppConfig): Promise<string> {
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
    const errorText = await response.text();
    process.stderr.write(`OAuth error (${response.status}): ${errorText}\n`);
    process.exit(1);
  }

  const data = (await response.json()) as TokenResponse;
  return data.access_token;
}
