#!/usr/bin/env npx tsx
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { getAccessToken } from "./auth.js";
import { createMeeting, listMeetings, getMeeting, updateMeeting, deleteMeeting } from "./api.js";
import { ConfigError, AuthError, ApiError, ValidationError } from "./errors.js";

// Date formatting: supports yyyy, MM, dd, HH, mm patterns
export function formatDate(date: Date, format: string, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || "";

  return format
    .replace("yyyy", get("year"))
    .replace("MM", get("month"))
    .replace("dd", get("day"))
    .replace("HH", get("hour"))
    .replace("mm", get("minute"));
}

export function buildTopic(
  startTime: string,
  withPerson: string | undefined,
  config: ReturnType<typeof loadConfig>
): string {
  const date = new Date(startTime);
  const dateStr = formatDate(date, config.dateFormat, config.timezone);

  if (withPerson) {
    return config.topicTemplate
      .replace("{{date}}", dateStr)
      .replace("{{with}}", withPerson);
  }
  return config.topicTemplateNoWith.replace("{{date}}", dateStr);
}

const program = new Command();

program
  .name("zoomy")
  .description("A CLI tool for managing Zoom resources via Server-to-Server OAuth")
  .version("1.0.0");

program
  .command("create")
  .description("Create a new Zoom meeting")
  .requiredOption("--start <datetime>", "Start time (ISO 8601, e.g. 2026-02-10T10:00:00)")
  .requiredOption("--duration <minutes>", "Duration in minutes", parseInt)
  .option("--with <name>", "Meeting participant name (used in topic)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const config = loadConfig();

    const startDate = new Date(opts.start);
    if (isNaN(startDate.getTime())) {
      throw new ValidationError("--start must be a valid ISO 8601 datetime (e.g. 2026-02-10T10:00:00).");
    }

    if (isNaN(opts.duration) || opts.duration <= 0) {
      throw new ValidationError("--duration must be a positive number.");
    }

    if (opts.duration > 1440) {
      throw new ValidationError("--duration must not exceed 1440 minutes (24 hours).");
    }

    const topic = buildTopic(opts.start, opts.with, config);
    const token = await getAccessToken(config);
    const meeting = await createMeeting(token, {
      topic,
      startTime: opts.start,
      duration: opts.duration,
      timezone: config.timezone,
    });

    if (opts.json) {
      process.stdout.write(
        JSON.stringify(
          {
            id: meeting.id,
            topic: meeting.topic,
            start_time: meeting.start_time,
            duration: meeting.duration,
            join_url: meeting.join_url,
          },
          null,
          2
        ) + "\n"
      );
    } else {
      process.stdout.write(`Meeting created!\n`);
      process.stdout.write(`  Topic:    ${meeting.topic}\n`);
      process.stdout.write(`  Start:    ${meeting.start_time}\n`);
      process.stdout.write(`  Duration: ${meeting.duration} min\n`);
      process.stdout.write(`  Join URL: ${meeting.join_url}\n`);
    }
  });

program
  .command("list")
  .description("List scheduled Zoom meetings")
  .option("--from <date>", "Start date (YYYY-MM-DD)")
  .option("--to <date>", "End date (YYYY-MM-DD)")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (opts.from && !datePattern.test(opts.from)) {
      throw new ValidationError("--from must be in YYYY-MM-DD format.");
    }

    if (opts.to && !datePattern.test(opts.to)) {
      throw new ValidationError("--to must be in YYYY-MM-DD format.");
    }

    if (opts.from && opts.to && opts.from > opts.to) {
      throw new ValidationError("--from must not be after --to.");
    }

    const config = loadConfig();
    const token = await getAccessToken(config);
    const meetings = await listMeetings(token, {
      from: opts.from,
      to: opts.to,
    });

    if (opts.json) {
      const output = meetings.map((m) => ({
        id: m.id,
        topic: m.topic,
        start_time: m.start_time,
        duration: m.duration,
        join_url: m.join_url,
      }));
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    } else {
      if (meetings.length === 0) {
        process.stdout.write("No scheduled meetings found.\n");
        return;
      }
      for (const m of meetings) {
        process.stdout.write(`[${m.id}] ${m.topic}\n`);
        process.stdout.write(`  Start:    ${m.start_time}\n`);
        process.stdout.write(`  Duration: ${m.duration} min\n`);
        process.stdout.write(`  Join URL: ${m.join_url}\n`);
        process.stdout.write("\n");
      }
    }
  });

program
  .command("get")
  .description("Get details of a Zoom meeting")
  .argument("<meetingId>", "Meeting ID")
  .option("--json", "Output as JSON")
  .action(async (meetingId: string, opts: { json?: boolean }) => {
    const id = Number(meetingId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError("meetingId must be a positive number.");
    }

    const config = loadConfig();
    const token = await getAccessToken(config);
    const meeting = await getMeeting(token, id);

    if (opts.json) {
      process.stdout.write(
        JSON.stringify(
          {
            id: meeting.id,
            topic: meeting.topic,
            start_time: meeting.start_time,
            duration: meeting.duration,
            join_url: meeting.join_url,
          },
          null,
          2
        ) + "\n"
      );
    } else {
      process.stdout.write(`  ID:       ${meeting.id}\n`);
      process.stdout.write(`  Topic:    ${meeting.topic}\n`);
      process.stdout.write(`  Start:    ${meeting.start_time}\n`);
      process.stdout.write(`  Duration: ${meeting.duration} min\n`);
      process.stdout.write(`  Join URL: ${meeting.join_url}\n`);
    }
  });

program
  .command("update")
  .description("Update a Zoom meeting")
  .argument("<meetingId>", "Meeting ID")
  .option("--topic <topic>", "New topic")
  .option("--start <datetime>", "New start time (ISO 8601)")
  .option("--duration <minutes>", "New duration in minutes", parseInt)
  .option("--json", "Output as JSON")
  .action(async (meetingId: string, opts: { topic?: string; start?: string; duration?: number; json?: boolean }) => {
    const id = Number(meetingId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError("meetingId must be a positive number.");
    }

    if (!opts.topic && !opts.start && opts.duration === undefined) {
      throw new ValidationError("At least one of --topic, --start, or --duration is required.");
    }

    if (opts.start) {
      const startDate = new Date(opts.start);
      if (isNaN(startDate.getTime())) {
        throw new ValidationError("--start must be a valid ISO 8601 datetime (e.g. 2026-02-10T10:00:00).");
      }
    }

    if (opts.duration !== undefined) {
      if (isNaN(opts.duration) || opts.duration <= 0) {
        throw new ValidationError("--duration must be a positive number.");
      }
      if (opts.duration > 1440) {
        throw new ValidationError("--duration must not exceed 1440 minutes (24 hours).");
      }
    }

    const config = loadConfig();
    const token = await getAccessToken(config);

    const params: Record<string, unknown> = {};
    if (opts.topic) params.topic = opts.topic;
    if (opts.start) params.start_time = opts.start;
    if (opts.duration !== undefined) params.duration = opts.duration;

    await updateMeeting(token, id, params);

    const meeting = await getMeeting(token, id);

    if (opts.json) {
      process.stdout.write(
        JSON.stringify(
          {
            id: meeting.id,
            topic: meeting.topic,
            start_time: meeting.start_time,
            duration: meeting.duration,
            join_url: meeting.join_url,
          },
          null,
          2
        ) + "\n"
      );
    } else {
      process.stdout.write(`Meeting updated!\n`);
      process.stdout.write(`  ID:       ${meeting.id}\n`);
      process.stdout.write(`  Topic:    ${meeting.topic}\n`);
      process.stdout.write(`  Start:    ${meeting.start_time}\n`);
      process.stdout.write(`  Duration: ${meeting.duration} min\n`);
      process.stdout.write(`  Join URL: ${meeting.join_url}\n`);
    }
  });

program
  .command("delete")
  .description("Delete a Zoom meeting")
  .argument("<meetingId>", "Meeting ID")
  .action(async (meetingId: string) => {
    const id = Number(meetingId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ValidationError("meetingId must be a positive number.");
    }

    const config = loadConfig();
    const token = await getAccessToken(config);
    await deleteMeeting(token, id);

    process.stdout.write(`Meeting ${id} deleted.\n`);
  });

(async () => {
  try {
    await program.parseAsync();
  } catch (err) {
    if (err instanceof ConfigError) {
      process.stderr.write(`Configuration error: ${err.message}\n`);
      process.exit(2);
    }
    if (err instanceof AuthError) {
      process.stderr.write(`Authentication error: ${err.message}\n`);
      process.exit(1);
    }
    if (err instanceof ApiError) {
      process.stderr.write(`API error: ${err.message}\n`);
      process.exit(1);
    }
    if (err instanceof ValidationError) {
      process.stderr.write(`Validation error: ${err.message}\n`);
      process.exit(2);
    }
    process.stderr.write("Unexpected error occurred.\n");
    process.exit(1);
  }
})();
