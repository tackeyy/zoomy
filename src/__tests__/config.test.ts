import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock dotenv before importing config module
vi.mock("dotenv", () => ({
  config: vi.fn(),
}));

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset module registry so loadConfig re-reads env vars
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return AppConfig when all required env vars are set", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "test-account-id";
    process.env["ZOOM_CLIENT_ID"] = "test-client-id";
    process.env["ZOOM_CLIENT_SECRET"] = "test-client-secret";

    // Act
    const { loadConfig } = await import("../config.js");
    const config = loadConfig();

    // Assert
    expect(config.accountId).toBe("test-account-id");
    expect(config.clientId).toBe("test-client-id");
    expect(config.clientSecret).toBe("test-client-secret");
  });

  it("should use default timezone when ZOOM_TIMEZONE is not set", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "id";
    process.env["ZOOM_CLIENT_ID"] = "cid";
    process.env["ZOOM_CLIENT_SECRET"] = "secret";
    delete process.env["ZOOM_TIMEZONE"];

    // Act
    const { loadConfig } = await import("../config.js");
    const config = loadConfig();

    // Assert
    expect(config.timezone).toBe("Asia/Tokyo");
  });

  it("should use custom timezone when ZOOM_TIMEZONE is set", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "id";
    process.env["ZOOM_CLIENT_ID"] = "cid";
    process.env["ZOOM_CLIENT_SECRET"] = "secret";
    process.env["ZOOM_TIMEZONE"] = "America/New_York";

    // Act
    const { loadConfig } = await import("../config.js");
    const config = loadConfig();

    // Assert
    expect(config.timezone).toBe("America/New_York");
  });

  it("should use default dateFormat when ZOOM_DATE_FORMAT is not set", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "id";
    process.env["ZOOM_CLIENT_ID"] = "cid";
    process.env["ZOOM_CLIENT_SECRET"] = "secret";
    delete process.env["ZOOM_DATE_FORMAT"];

    // Act
    const { loadConfig } = await import("../config.js");
    const config = loadConfig();

    // Assert
    expect(config.dateFormat).toBe("yyyy/MM/dd HH:mm");
  });

  it("should use default topicTemplate when ZOOM_TOPIC_TEMPLATE is not set", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "id";
    process.env["ZOOM_CLIENT_ID"] = "cid";
    process.env["ZOOM_CLIENT_SECRET"] = "secret";
    delete process.env["ZOOM_TOPIC_TEMPLATE"];

    // Act
    const { loadConfig } = await import("../config.js");
    const config = loadConfig();

    // Assert
    expect(config.topicTemplate).toBe("{{date}} | {{with}}");
  });

  it("should use default topicTemplateNoWith when ZOOM_TOPIC_TEMPLATE_NO_WITH is not set", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "id";
    process.env["ZOOM_CLIENT_ID"] = "cid";
    process.env["ZOOM_CLIENT_SECRET"] = "secret";
    delete process.env["ZOOM_TOPIC_TEMPLATE_NO_WITH"];

    // Act
    const { loadConfig } = await import("../config.js");
    const config = loadConfig();

    // Assert
    expect(config.topicTemplateNoWith).toBe("{{date}}");
  });

  it("should throw ConfigError when ZOOM_ACCOUNT_ID is not set", async () => {
    // Arrange
    delete process.env["ZOOM_ACCOUNT_ID"];
    process.env["ZOOM_CLIENT_ID"] = "cid";
    process.env["ZOOM_CLIENT_SECRET"] = "secret";

    // Act & Assert
    const { loadConfig } = await import("../config.js");
    expect(() => loadConfig()).toThrow("ZOOM_ACCOUNT_ID is not set");
  });

  it("should throw ConfigError when ZOOM_CLIENT_ID is not set", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "id";
    delete process.env["ZOOM_CLIENT_ID"];
    process.env["ZOOM_CLIENT_SECRET"] = "secret";

    // Act & Assert
    const { loadConfig } = await import("../config.js");
    expect(() => loadConfig()).toThrow("ZOOM_CLIENT_ID is not set");
  });

  it("should throw ConfigError when ZOOM_CLIENT_SECRET is not set", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "id";
    process.env["ZOOM_CLIENT_ID"] = "cid";
    delete process.env["ZOOM_CLIENT_SECRET"];

    // Act & Assert
    const { loadConfig } = await import("../config.js");
    expect(() => loadConfig()).toThrow("ZOOM_CLIENT_SECRET is not set");
  });

  it("should throw ConfigError with descriptive message mentioning .env file", async () => {
    // Arrange
    delete process.env["ZOOM_ACCOUNT_ID"];
    delete process.env["ZOOM_CLIENT_ID"];
    delete process.env["ZOOM_CLIENT_SECRET"];

    // Act & Assert
    const { loadConfig } = await import("../config.js");
    expect(() => loadConfig()).toThrow("Check your .env file");
  });

  it("should treat empty string env var as missing", async () => {
    // Arrange
    process.env["ZOOM_ACCOUNT_ID"] = "";
    process.env["ZOOM_CLIENT_ID"] = "cid";
    process.env["ZOOM_CLIENT_SECRET"] = "secret";

    // Act & Assert
    const { loadConfig } = await import("../config.js");
    expect(() => loadConfig()).toThrow("ZOOM_ACCOUNT_ID is not set");
  });
});

describe("Config URL constants", () => {
  it("should export correct ZOOM_OAUTH_URL", async () => {
    vi.resetModules();
    const { ZOOM_OAUTH_URL } = await import("../config.js");

    expect(ZOOM_OAUTH_URL).toBe("https://zoom.us/oauth/token");
  });

  it("should export correct ZOOM_API_BASE", async () => {
    vi.resetModules();
    const { ZOOM_API_BASE } = await import("../config.js");

    expect(ZOOM_API_BASE).toBe("https://api.zoom.us/v2");
  });

  it("should export correct ZOOM_MEETINGS_URL", async () => {
    vi.resetModules();
    const { ZOOM_MEETINGS_URL } = await import("../config.js");

    expect(ZOOM_MEETINGS_URL).toBe(
      "https://api.zoom.us/v2/users/me/meetings"
    );
  });
});

describe("zoomMeetingUrl", () => {
  it("should construct correct URL with meeting ID", async () => {
    vi.resetModules();
    const { zoomMeetingUrl } = await import("../config.js");

    const url = zoomMeetingUrl(12345678901);

    expect(url).toBe("https://api.zoom.us/v2/meetings/12345678901");
  });

  it("should construct different URLs for different meeting IDs", async () => {
    vi.resetModules();
    const { zoomMeetingUrl } = await import("../config.js");

    const url1 = zoomMeetingUrl(111);
    const url2 = zoomMeetingUrl(222);

    expect(url1).toBe("https://api.zoom.us/v2/meetings/111");
    expect(url2).toBe("https://api.zoom.us/v2/meetings/222");
    expect(url1).not.toBe(url2);
  });
});
