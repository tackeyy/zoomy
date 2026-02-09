#!/usr/bin/env npx tsx
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { getAccessToken } from "./auth.js";
import { createMeeting, listMeetings } from "./api.js";

// Date formatting: supports yyyy, MM, dd, HH, mm patterns
function formatDate(date: Date, format: string, timezone: string): string {
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

function buildTopic(
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
  .name("zoom-cli")
  .description("Zoom meeting CLI tool using Server-to-Server OAuth")
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

    if (isNaN(opts.duration) || opts.duration <= 0) {
      process.stderr.write("Error: --duration must be a positive number.\n");
      process.exit(2);
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

program.parse();
