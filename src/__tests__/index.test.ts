import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock commander to prevent CLI from executing on import
vi.mock("commander", () => {
  class MockCommand {
    name() { return this; }
    description() { return this; }
    version() { return this; }
    command() { return this; }
    requiredOption() { return this; }
    option() { return this; }
    action() { return this; }
    async parseAsync() { return undefined; }
  }
  return { Command: MockCommand };
});

// Mock config, auth, and api to prevent side effects
vi.mock("../config.js", () => ({
  loadConfig: vi.fn(),
}));
vi.mock("../auth.js", () => ({
  getAccessToken: vi.fn(),
}));
vi.mock("../api.js", () => ({
  createMeeting: vi.fn(),
  listMeetings: vi.fn(),
}));

describe("formatDate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should format date with yyyy/MM/dd HH:mm pattern in Asia/Tokyo timezone", async () => {
    // Arrange
    // 2026-02-10T10:00:00Z = 2026-02-10T19:00:00 in Asia/Tokyo (UTC+9)
    const date = new Date("2026-02-10T10:00:00Z");
    const format = "yyyy/MM/dd HH:mm";
    const timezone = "Asia/Tokyo";

    // Act
    const { formatDate } = await import("../index.js");
    const result = formatDate(date, format, timezone);

    // Assert
    expect(result).toBe("2026/02/10 19:00");
  });

  it("should format date in UTC timezone", async () => {
    // Arrange
    const date = new Date("2026-06-15T08:30:00Z");
    const format = "yyyy/MM/dd HH:mm";
    const timezone = "UTC";

    // Act
    const { formatDate } = await import("../index.js");
    const result = formatDate(date, format, timezone);

    // Assert
    expect(result).toBe("2026/06/15 08:30");
  });

  it("should handle different format patterns", async () => {
    // Arrange
    const date = new Date("2026-12-25T15:45:00Z");
    const format = "yyyy-MM-dd";
    const timezone = "UTC";

    // Act
    const { formatDate } = await import("../index.js");
    const result = formatDate(date, format, timezone);

    // Assert
    expect(result).toBe("2026-12-25");
  });

  it("should handle midnight correctly", async () => {
    // Arrange
    const date = new Date("2026-01-01T00:00:00Z");
    const format = "HH:mm";
    const timezone = "UTC";

    // Act
    const { formatDate } = await import("../index.js");
    const result = formatDate(date, format, timezone);

    // Assert
    expect(result).toBe("00:00");
  });

  it("should pad single-digit months and days with zeros", async () => {
    // Arrange
    const date = new Date("2026-03-05T07:03:00Z");
    const format = "yyyy/MM/dd HH:mm";
    const timezone = "UTC";

    // Act
    const { formatDate } = await import("../index.js");
    const result = formatDate(date, format, timezone);

    // Assert
    expect(result).toBe("2026/03/05 07:03");
  });

  it("should handle America/New_York timezone", async () => {
    // Arrange
    // 2026-07-04T18:00:00Z = 2026-07-04T14:00:00 in America/New_York (EDT, UTC-4)
    const date = new Date("2026-07-04T18:00:00Z");
    const format = "yyyy/MM/dd HH:mm";
    const timezone = "America/New_York";

    // Act
    const { formatDate } = await import("../index.js");
    const result = formatDate(date, format, timezone);

    // Assert
    expect(result).toBe("2026/07/04 14:00");
  });
});

describe("buildTopic", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should build topic with withPerson using topicTemplate", async () => {
    // Arrange
    const startTime = "2026-02-10T10:00:00Z";
    const withPerson = "John";
    const config = {
      accountId: "id",
      clientId: "cid",
      clientSecret: "secret",
      timezone: "UTC",
      dateFormat: "yyyy/MM/dd HH:mm",
      topicTemplate: "{{date}} | {{with}}",
      topicTemplateNoWith: "{{date}}",
    };

    // Act
    const { buildTopic } = await import("../index.js");
    const result = buildTopic(startTime, withPerson, config);

    // Assert
    expect(result).toBe("2026/02/10 10:00 | John");
  });

  it("should build topic without withPerson using topicTemplateNoWith", async () => {
    // Arrange
    const startTime = "2026-02-10T10:00:00Z";
    const withPerson = undefined;
    const config = {
      accountId: "id",
      clientId: "cid",
      clientSecret: "secret",
      timezone: "UTC",
      dateFormat: "yyyy/MM/dd HH:mm",
      topicTemplate: "{{date}} | {{with}}",
      topicTemplateNoWith: "{{date}}",
    };

    // Act
    const { buildTopic } = await import("../index.js");
    const result = buildTopic(startTime, withPerson, config);

    // Assert
    expect(result).toBe("2026/02/10 10:00");
  });

  it("should apply custom topicTemplate", async () => {
    // Arrange
    const startTime = "2026-03-15T14:00:00Z";
    const withPerson = "Alice";
    const config = {
      accountId: "id",
      clientId: "cid",
      clientSecret: "secret",
      timezone: "UTC",
      dateFormat: "yyyy-MM-dd",
      topicTemplate: "Meeting with {{with}} on {{date}}",
      topicTemplateNoWith: "Meeting on {{date}}",
    };

    // Act
    const { buildTopic } = await import("../index.js");
    const result = buildTopic(startTime, withPerson, config);

    // Assert
    expect(result).toBe("Meeting with Alice on 2026-03-15");
  });

  it("should apply custom topicTemplateNoWith when withPerson is undefined", async () => {
    // Arrange
    const startTime = "2026-03-15T14:00:00Z";
    const config = {
      accountId: "id",
      clientId: "cid",
      clientSecret: "secret",
      timezone: "UTC",
      dateFormat: "yyyy-MM-dd",
      topicTemplate: "Meeting with {{with}} on {{date}}",
      topicTemplateNoWith: "Solo meeting on {{date}}",
    };

    // Act
    const { buildTopic } = await import("../index.js");
    const result = buildTopic(startTime, undefined, config);

    // Assert
    expect(result).toBe("Solo meeting on 2026-03-15");
  });

  it("should apply timezone from config when formatting date", async () => {
    // Arrange
    // 2026-02-10T10:00:00Z = 2026-02-10T19:00:00 in Asia/Tokyo
    const startTime = "2026-02-10T10:00:00Z";
    const config = {
      accountId: "id",
      clientId: "cid",
      clientSecret: "secret",
      timezone: "Asia/Tokyo",
      dateFormat: "yyyy/MM/dd HH:mm",
      topicTemplate: "{{date}} | {{with}}",
      topicTemplateNoWith: "{{date}}",
    };

    // Act
    const { buildTopic } = await import("../index.js");
    const result = buildTopic(startTime, "Bob", config);

    // Assert
    expect(result).toBe("2026/02/10 19:00 | Bob");
  });

  it("should handle empty string withPerson as truthy (non-empty template)", async () => {
    // Arrange
    const startTime = "2026-02-10T10:00:00Z";
    const withPerson = ""; // empty string is falsy
    const config = {
      accountId: "id",
      clientId: "cid",
      clientSecret: "secret",
      timezone: "UTC",
      dateFormat: "yyyy/MM/dd HH:mm",
      topicTemplate: "{{date}} | {{with}}",
      topicTemplateNoWith: "{{date}}",
    };

    // Act
    const { buildTopic } = await import("../index.js");
    const result = buildTopic(startTime, withPerson, config);

    // Assert
    // Empty string is falsy, so topicTemplateNoWith should be used
    expect(result).toBe("2026/02/10 10:00");
  });
});
