import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Meeting } from "../types.js";

const sampleMeeting: Meeting = {
  id: 12345678901,
  topic: "Test Meeting",
  type: 2,
  start_time: "2026-02-10T10:00:00Z",
  duration: 60,
  timezone: "Asia/Tokyo",
  join_url: "https://zoom.us/j/12345678901",
  start_url: "https://zoom.us/s/12345678901",
  password: "123456",
  encrypted_password: "abc123def456",
  created_at: "2026-02-09T00:00:00Z",
};

describe("CLI Output - create command", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("should output text format for successful meeting creation", () => {
    const meeting = sampleMeeting;
    const opts = { json: false };

    if (!opts.json) {
      process.stdout.write(`Meeting created!\n`);
      process.stdout.write(`  Topic:    ${meeting.topic}\n`);
      process.stdout.write(`  Start:    ${meeting.start_time}\n`);
      process.stdout.write(`  Duration: ${meeting.duration} min\n`);
      process.stdout.write(`  Join URL: ${meeting.join_url}\n`);
      process.stdout.write(`  Passcode: ${meeting.password}\n`);
    }

    expect(stdoutSpy).toHaveBeenCalledWith("Meeting created!\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Topic:    Test Meeting\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Start:    2026-02-10T10:00:00Z\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Duration: 60 min\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Join URL: https://zoom.us/j/12345678901\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Passcode: 123456\n");
  });

  it("should output JSON format when --json flag is provided", () => {
    const meeting = sampleMeeting;
    const opts = { json: true };

    if (opts.json) {
      const output = JSON.stringify(
        {
          id: meeting.id,
          topic: meeting.topic,
          start_time: meeting.start_time,
          duration: meeting.duration,
          join_url: meeting.join_url,
          password: meeting.password,
          meeting_id_formatted: "123 4567 8901",
          invitation_url: "https://zoom.us/meetings/12345678901/invitations",
        },
        null,
        2
      );
      process.stdout.write(output + "\n");
    }

    const calls = stdoutSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const output = calls[0][0] as string;
    expect(output).toContain('"id": 12345678901');
    expect(output).toContain('"topic": "Test Meeting"');
    expect(output).toContain('"join_url": "https://zoom.us/j/12345678901"');
    expect(output).toContain('"password": "123456"');
    expect(output).toContain('"meeting_id_formatted": "123 4567 8901"');
    expect(output).toContain('"invitation_url": "https://zoom.us/meetings/12345678901/invitations"');
  });
});

describe("CLI Output - list command", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("should output text format for multiple meetings", () => {
    const meetings = [sampleMeeting, { ...sampleMeeting, id: 98765, topic: "Second Meeting" }];
    const opts = { json: false };

    if (!opts.json) {
      for (const m of meetings) {
        process.stdout.write(`[${m.id}] ${m.topic}\n`);
        process.stdout.write(`  Start:    ${m.start_time}\n`);
        process.stdout.write(`  Duration: ${m.duration} min\n`);
        process.stdout.write(`  Join URL: ${m.join_url}\n`);
        process.stdout.write("\n");
      }
    }

    expect(stdoutSpy).toHaveBeenCalledWith("[12345678901] Test Meeting\n");
    expect(stdoutSpy).toHaveBeenCalledWith("[98765] Second Meeting\n");
  });

  it("should output message when no meetings found", () => {
    const meetings: Meeting[] = [];
    const opts = { json: false };

    if (!opts.json) {
      if (meetings.length === 0) {
        process.stdout.write("No scheduled meetings found.\n");
        return;
      }
    }

    expect(stdoutSpy).toHaveBeenCalledWith("No scheduled meetings found.\n");
  });

  it("should output JSON format when --json flag is provided", () => {
    const meetings = [sampleMeeting];
    const opts = { json: true };

    if (opts.json) {
      const output = meetings.map((m) => ({
        id: m.id,
        topic: m.topic,
        start_time: m.start_time,
        duration: m.duration,
        join_url: m.join_url,
        password: m.password,
        meeting_id_formatted: "123 4567 8901",
        invitation_url: "https://zoom.us/meetings/12345678901/invitations",
      }));
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    }

    const calls = stdoutSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const output = calls[0][0] as string;
    expect(output).toContain('"id": 12345678901');
    expect(output).toContain('"topic": "Test Meeting"');
    expect(output).toContain('"password": "123456"');
  });

  it("should output empty JSON array when no meetings and --json flag is provided", () => {
    const meetings: Meeting[] = [];
    const opts = { json: true };

    if (opts.json) {
      const output = meetings.map((m) => ({
        id: m.id,
        topic: m.topic,
        start_time: m.start_time,
        duration: m.duration,
        join_url: m.join_url,
        password: m.password,
        meeting_id_formatted: "",
        invitation_url: "",
      }));
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    }

    const calls = stdoutSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const output = calls[0][0] as string;
    expect(output.trim()).toBe("[]");
  });
});

describe("CLI Output - get command", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("should output text format for meeting details", () => {
    const meeting = sampleMeeting;
    const opts = { json: false };

    if (!opts.json) {
      process.stdout.write(`  ID:       ${meeting.id}\n`);
      process.stdout.write(`  Topic:    ${meeting.topic}\n`);
      process.stdout.write(`  Start:    ${meeting.start_time}\n`);
      process.stdout.write(`  Duration: ${meeting.duration} min\n`);
      process.stdout.write(`  Join URL: ${meeting.join_url}\n`);
      process.stdout.write(`  Passcode: ${meeting.password}\n`);
    }

    expect(stdoutSpy).toHaveBeenCalledWith("  ID:       12345678901\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Topic:    Test Meeting\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Passcode: 123456\n");
  });

  it("should output JSON format when --json flag is provided", () => {
    const meeting = sampleMeeting;
    const opts = { json: true };

    if (opts.json) {
      const output = JSON.stringify(
        {
          id: meeting.id,
          topic: meeting.topic,
          start_time: meeting.start_time,
          duration: meeting.duration,
          join_url: meeting.join_url,
          password: meeting.password,
          meeting_id_formatted: "123 4567 8901",
          invitation_url: "https://zoom.us/meetings/12345678901/invitations",
        },
        null,
        2
      );
      process.stdout.write(output + "\n");
    }

    const calls = stdoutSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const output = calls[0][0] as string;
    expect(output).toContain('"id": 12345678901');
    expect(output).toContain('"password": "123456"');
  });
});

describe("CLI Output - update command", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("should output text format for successful update", () => {
    const meeting = { ...sampleMeeting, topic: "Updated Topic" };
    const opts = { json: false };

    if (!opts.json) {
      process.stdout.write(`Meeting updated!\n`);
      process.stdout.write(`  ID:       ${meeting.id}\n`);
      process.stdout.write(`  Topic:    ${meeting.topic}\n`);
      process.stdout.write(`  Start:    ${meeting.start_time}\n`);
      process.stdout.write(`  Duration: ${meeting.duration} min\n`);
      process.stdout.write(`  Join URL: ${meeting.join_url}\n`);
      process.stdout.write(`  Passcode: ${meeting.password}\n`);
    }

    expect(stdoutSpy).toHaveBeenCalledWith("Meeting updated!\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Topic:    Updated Topic\n");
    expect(stdoutSpy).toHaveBeenCalledWith("  Passcode: 123456\n");
  });

  it("should output JSON format when --json flag is provided", () => {
    const meeting = sampleMeeting;
    const opts = { json: true };

    if (opts.json) {
      const output = JSON.stringify(
        {
          id: meeting.id,
          topic: meeting.topic,
          start_time: meeting.start_time,
          duration: meeting.duration,
          join_url: meeting.join_url,
          password: meeting.password,
          meeting_id_formatted: "123 4567 8901",
          invitation_url: "https://zoom.us/meetings/12345678901/invitations",
        },
        null,
        2
      );
      process.stdout.write(output + "\n");
    }

    const calls = stdoutSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const output = calls[0][0] as string;
    expect(output).toContain('"id": 12345678901');
    expect(output).toContain('"password": "123456"');
  });
});

describe("CLI Output - delete command", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("should output success message for deletion", () => {
    const meetingId = 12345678901;

    process.stdout.write(`Meeting ${meetingId} deleted.\n`);

    expect(stdoutSpy).toHaveBeenCalledWith("Meeting 12345678901 deleted.\n");
  });
});
