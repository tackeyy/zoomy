import { ZOOM_MEETINGS_URL } from "./config.js";
import type {
  CreateMeetingRequest,
  ListMeetingsResponse,
  Meeting,
} from "./types.js";

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
    const errorText = await response.text();
    process.stderr.write(
      `Failed to create meeting (${response.status}): ${errorText}\n`
    );
    process.exit(1);
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
    const errorText = await response.text();
    process.stderr.write(
      `Failed to list meetings (${response.status}): ${errorText}\n`
    );
    process.exit(1);
  }

  const data = (await response.json()) as ListMeetingsResponse;
  return data.meetings;
}
