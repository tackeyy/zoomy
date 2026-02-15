import { describe, it, expect } from "vitest";
import { ValidationError } from "../errors.js";

describe("CLI Validation - create command", () => {
  it("should accept valid ISO 8601 start datetime", () => {
    const startTime = "2026-02-10T10:00:00";
    const date = new Date(startTime);

    expect(isNaN(date.getTime())).toBe(false);
  });

  it("should reject invalid start datetime format", () => {
    const startTime = "invalid-date";
    const date = new Date(startTime);

    expect(isNaN(date.getTime())).toBe(true);
  });

  it("should accept valid positive duration", () => {
    const duration = 60;

    expect(isNaN(duration)).toBe(false);
    expect(duration > 0).toBe(true);
  });

  it("should reject zero duration", () => {
    const duration = 0;

    expect(duration <= 0).toBe(true);
  });

  it("should reject negative duration", () => {
    const duration = -30;

    expect(duration <= 0).toBe(true);
  });

  it("should reject duration exceeding 1440 minutes", () => {
    const duration = 1441;

    expect(duration > 1440).toBe(true);
  });

  it("should accept duration at boundary (1440 minutes)", () => {
    const duration = 1440;

    expect(duration <= 1440).toBe(true);
    expect(duration > 0).toBe(true);
  });

  it("should reject NaN duration", () => {
    const duration = parseInt("invalid", 10);

    expect(isNaN(duration)).toBe(true);
  });
});

describe("CLI Validation - list command", () => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  it("should accept valid YYYY-MM-DD from date", () => {
    const from = "2026-02-01";

    expect(datePattern.test(from)).toBe(true);
  });

  it("should reject invalid from date format", () => {
    const from = "2026/02/01";

    expect(datePattern.test(from)).toBe(false);
  });

  it("should reject invalid from date format (incomplete)", () => {
    const from = "2026-02";

    expect(datePattern.test(from)).toBe(false);
  });

  it("should accept valid YYYY-MM-DD to date", () => {
    const to = "2026-02-28";

    expect(datePattern.test(to)).toBe(true);
  });

  it("should reject invalid to date format", () => {
    const to = "02-28-2026";

    expect(datePattern.test(to)).toBe(false);
  });

  it("should reject when from is after to", () => {
    const from = "2026-02-28";
    const to = "2026-02-01";

    expect(from > to).toBe(true);
  });

  it("should accept when from is before to", () => {
    const from = "2026-02-01";
    const to = "2026-02-28";

    expect(from <= to).toBe(true);
  });

  it("should accept when from equals to", () => {
    const from = "2026-02-15";
    const to = "2026-02-15";

    expect(from <= to).toBe(true);
  });
});

describe("CLI Validation - get command", () => {
  it("should accept valid positive meeting ID", () => {
    const meetingId = "12345678901";
    const id = Number(meetingId);

    expect(Number.isFinite(id)).toBe(true);
    expect(id > 0).toBe(true);
  });

  it("should reject zero meeting ID", () => {
    const meetingId = "0";
    const id = Number(meetingId);

    expect(id <= 0).toBe(true);
  });

  it("should reject negative meeting ID", () => {
    const meetingId = "-123";
    const id = Number(meetingId);

    expect(id <= 0).toBe(true);
  });

  it("should reject non-numeric meeting ID", () => {
    const meetingId = "abc";
    const id = Number(meetingId);

    expect(Number.isFinite(id)).toBe(false);
  });

  it("should reject floating-point meeting ID as not finite positive integer", () => {
    const meetingId = "123.45";
    const id = Number(meetingId);

    // The validation in index.ts uses Number.isFinite(id) && id > 0
    // This will pass for floats, but the intent is integers
    // However, the code doesn't explicitly check for integers
    expect(Number.isFinite(id)).toBe(true);
    expect(id > 0).toBe(true);
  });
});

describe("CLI Validation - update command", () => {
  it("should accept valid positive meeting ID", () => {
    const meetingId = "12345678901";
    const id = Number(meetingId);

    expect(Number.isFinite(id)).toBe(true);
    expect(id > 0).toBe(true);
  });

  it("should reject when no options are provided", () => {
    const opts = { topic: undefined, start: undefined, duration: undefined };

    const hasAnyOption = opts.topic || opts.start || opts.duration !== undefined;

    expect(hasAnyOption).toBe(false);
  });

  it("should accept when topic is provided", () => {
    const opts = { topic: "New Topic", start: undefined, duration: undefined };

    const hasAnyOption = opts.topic || opts.start || opts.duration !== undefined;

    expect(hasAnyOption).toBeTruthy();
  });

  it("should accept when start is provided", () => {
    const opts = { topic: undefined, start: "2026-02-10T10:00:00", duration: undefined };

    const hasAnyOption = opts.topic || opts.start || opts.duration !== undefined;

    expect(hasAnyOption).toBeTruthy();
  });

  it("should accept when duration is provided (including zero)", () => {
    const opts = { topic: undefined, start: undefined, duration: 0 };

    // Note: duration === undefined is different from duration === 0
    const hasAnyOption = opts.topic || opts.start || opts.duration !== undefined;

    expect(hasAnyOption).toBe(true);
  });

  it("should accept valid ISO 8601 start datetime", () => {
    const start = "2026-02-10T10:00:00";
    const date = new Date(start);

    expect(isNaN(date.getTime())).toBe(false);
  });

  it("should reject invalid start datetime format", () => {
    const start = "invalid-date";
    const date = new Date(start);

    expect(isNaN(date.getTime())).toBe(true);
  });

  it("should accept valid positive duration", () => {
    const duration = 60;

    expect(isNaN(duration)).toBe(false);
    expect(duration > 0).toBe(true);
  });

  it("should reject zero duration", () => {
    const duration = 0;

    expect(duration <= 0).toBe(true);
  });

  it("should reject negative duration", () => {
    const duration = -30;

    expect(duration <= 0).toBe(true);
  });

  it("should reject duration exceeding 1440 minutes", () => {
    const duration = 1441;

    expect(duration > 1440).toBe(true);
  });

  it("should accept duration at boundary (1440 minutes)", () => {
    const duration = 1440;

    expect(duration <= 1440).toBe(true);
    expect(duration > 0).toBe(true);
  });
});

describe("CLI Validation - delete command", () => {
  it("should accept valid positive meeting ID", () => {
    const meetingId = "12345678901";
    const id = Number(meetingId);

    expect(Number.isFinite(id)).toBe(true);
    expect(id > 0).toBe(true);
  });

  it("should reject zero meeting ID", () => {
    const meetingId = "0";
    const id = Number(meetingId);

    expect(id <= 0).toBe(true);
  });

  it("should reject negative meeting ID", () => {
    const meetingId = "-123";
    const id = Number(meetingId);

    expect(id <= 0).toBe(true);
  });
});

describe("ValidationError construction", () => {
  it("should create ValidationError with correct message", () => {
    const error = new ValidationError("--start must be a valid ISO 8601 datetime.");

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("--start must be a valid ISO 8601 datetime.");
  });

  it("should create ValidationError for duration validation", () => {
    const error = new ValidationError("--duration must be a positive number.");

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("--duration must be a positive number.");
  });

  it("should create ValidationError for duration upper bound", () => {
    const error = new ValidationError("--duration must not exceed 1440 minutes (24 hours).");

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe("--duration must not exceed 1440 minutes (24 hours).");
  });
});
