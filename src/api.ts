import { ZOOM_MEETINGS_URL } from "./config.js";
import type {
  CreateMeetingRequest,
  ListMeetingsResponse,
  Meeting,
} from "./types.js";
import { ApiError } from "./errors.js";

function getApiErrorMessage(status: number, operation: string): string {
  switch (status) {
    case 400:
      return `Invalid request parameters for ${operation}.`;
    case 401:
      return "Authentication expired. Please try again.";
    case 403:
      return `Insufficient permissions to ${operation}.`;
    case 404:
      return "Resource not found.";
    case 429:
      return "Rate limit exceeded. Please try again later.";
    default:
      return `Failed to ${operation} (HTTP ${status}).`;
  }
}

export async function createMeeting(
  token: string,
  params: { topic: string; startTime: string; duration: number; timezone: string }
): Promise<Meeting> {
  const body: CreateMeetingRequest = {
    topic: params.topic,
    type: 2,
    start_time: params.startTime,
    duration: params.duration,
    timezone: params.timezone,
  };

  const response = await fetch(ZOOM_MEETINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(response.status, "create meeting"));
  }

  return (await response.json()) as Meeting;
}

export async function listMeetings(
  token: string,
  params: { from?: string; to?: string }
): Promise<Meeting[]> {
  const url = new URL(ZOOM_MEETINGS_URL);
  url.searchParams.set("type", "scheduled");
  if (params.from) url.searchParams.set("from", params.from);
  if (params.to) url.searchParams.set("to", params.to);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(response.status, "list meetings"));
  }

  const data = (await response.json()) as ListMeetingsResponse;
  return data.meetings;
}
