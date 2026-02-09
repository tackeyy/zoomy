import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { AppConfig } from "./types.js";

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (one level up from src/)
config({ path: resolve(__dirname, "..", ".env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    process.stderr.write(`Error: ${key} is not set. Check your .env file.\n`);
    process.exit(2);
  }
  return value;
}

export function loadConfig(): AppConfig {
  return {
    accountId: requireEnv("ZOOM_ACCOUNT_ID"),
    clientId: requireEnv("ZOOM_CLIENT_ID"),
    clientSecret: requireEnv("ZOOM_CLIENT_SECRET"),
    timezone: process.env["ZOOM_TIMEZONE"] || "Asia/Tokyo",
    dateFormat: process.env["ZOOM_DATE_FORMAT"] || "yyyy/MM/dd HH:mm",
    topicTemplate:
      process.env["ZOOM_TOPIC_TEMPLATE"] || "{{date}} | {{with}}",
    topicTemplateNoWith:
      process.env["ZOOM_TOPIC_TEMPLATE_NO_WITH"] || "{{date}}",
  };
}

// API URL constants (whitelist)
export const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
export const ZOOM_API_BASE = "https://api.zoom.us/v2";
export const ZOOM_MEETINGS_URL = `${ZOOM_API_BASE}/users/me/meetings`;
