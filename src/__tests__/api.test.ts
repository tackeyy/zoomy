import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Meeting } from "../types.js";
import { ApiError } from "../errors.js";

// Mock the config module to avoid dotenv side effects
vi.mock("../config.js", () => ({
  ZOOM_MEETINGS_URL: "https://api.zoom.us/v2/users/me/meetings",
}));

const sampleMeeting: Meeting = {
  id: 12345678901,
  topic: "Test Meeting",
  type: 2,
  start_time: "2026-02-10T10:00:00Z",
  duration: 60,
  timezone: "Asia/Tokyo",
  join_url: "https://zoom.us/j/12345678901",
  start_url: "https://zoom.us/s/12345678901",
  created_at: "2026-02-09T00:00:00Z",
};

function createMockResponse(
  ok: boolean,
  status: number,
  body: unknown
): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("createMeeting", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should return Meeting object on successful response", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 201, sampleMeeting);
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { createMeeting } = await import("../api.js");
    const meeting = await createMeeting("test-token", {
      topic: "Test Meeting",
      startTime: "2026-02-10T10:00:00",
      duration: 60,
      timezone: "Asia/Tokyo",
    });

    // Assert
    expect(meeting.id).toBe(12345678901);
    expect(meeting.topic).toBe("Test Meeting");
    expect(meeting.join_url).toBe("https://zoom.us/j/12345678901");
  });

  it("should send correct Authorization header", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 201, sampleMeeting);
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { createMeeting } = await import("../api.js");
    await createMeeting("my-bearer-token", {
      topic: "Test",
      startTime: "2026-02-10T10:00:00",
      duration: 30,
      timezone: "UTC",
    });

    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.zoom.us/v2/users/me/meetings",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer my-bearer-token",
        }),
      })
    );
  });

  it("should send correct JSON body with type 2 (scheduled)", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 201, sampleMeeting);
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { createMeeting } = await import("../api.js");
    await createMeeting("token", {
      topic: "My Meeting",
      startTime: "2026-03-01T14:00:00",
      duration: 45,
      timezone: "America/New_York",
    });

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.topic).toBe("My Meeting");
    expect(body.type).toBe(2);
    expect(body.start_time).toBe("2026-03-01T14:00:00");
    expect(body.duration).toBe(45);
    expect(body.timezone).toBe("America/New_York");
  });

  it("should throw ApiError on 400 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 400, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { createMeeting } = await import("../api.js");
    await expect(
      createMeeting("token", {
        topic: "Test",
        startTime: "2026-02-10T10:00:00",
        duration: 60,
        timezone: "UTC",
      })
    ).rejects.toThrow("Invalid request parameters for create meeting.");
  });

  it("should throw ApiError on 401 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 401, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { createMeeting } = await import("../api.js");
    await expect(
      createMeeting("token", {
        topic: "Test",
        startTime: "2026-02-10T10:00:00",
        duration: 60,
        timezone: "UTC",
      })
    ).rejects.toThrow("Authentication expired. Please try again.");
  });

  it("should throw ApiError on 403 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 403, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { createMeeting } = await import("../api.js");
    await expect(
      createMeeting("token", {
        topic: "Test",
        startTime: "2026-02-10T10:00:00",
        duration: 60,
        timezone: "UTC",
      })
    ).rejects.toThrow("Insufficient permissions to create meeting.");
  });

  it("should throw ApiError on 404 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 404, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { createMeeting } = await import("../api.js");
    await expect(
      createMeeting("token", {
        topic: "Test",
        startTime: "2026-02-10T10:00:00",
        duration: 60,
        timezone: "UTC",
      })
    ).rejects.toThrow("Resource not found.");
  });

  it("should throw ApiError on 429 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 429, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { createMeeting } = await import("../api.js");
    await expect(
      createMeeting("token", {
        topic: "Test",
        startTime: "2026-02-10T10:00:00",
        duration: 60,
        timezone: "UTC",
      })
    ).rejects.toThrow("Rate limit exceeded. Please try again later.");
  });

  it("should throw ApiError on unknown status code", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 503, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { createMeeting } = await import("../api.js");
    await expect(
      createMeeting("token", {
        topic: "Test",
        startTime: "2026-02-10T10:00:00",
        duration: 60,
        timezone: "UTC",
      })
    ).rejects.toThrow("Failed to create meeting (HTTP 503).");
  });

  it("should throw an error with name ApiError, not a plain Error", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 500, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { createMeeting } = await import("../api.js");
    try {
      await createMeeting("token", {
        topic: "Test",
        startTime: "2026-02-10T10:00:00",
        duration: 60,
        timezone: "UTC",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).name).toBe("ApiError");
    }
  });
});

describe("listMeetings", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should return Meeting array on successful response", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      page_count: 1,
      page_number: 1,
      page_size: 30,
      total_records: 1,
      meetings: [sampleMeeting],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    const meetings = await listMeetings("test-token", {});

    // Assert
    expect(meetings).toHaveLength(1);
    expect(meetings[0].id).toBe(12345678901);
  });

  it("should return empty array when no meetings exist", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      page_count: 0,
      page_number: 1,
      page_size: 30,
      total_records: 0,
      meetings: [],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    const meetings = await listMeetings("test-token", {});

    // Assert
    expect(meetings).toHaveLength(0);
  });

  it("should include type=scheduled in URL", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      meetings: [],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    await listMeetings("token", {});

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const url = callArgs[0] as string;
    expect(url).toContain("type=scheduled");
  });

  it("should add from parameter to URL when provided", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      meetings: [],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    await listMeetings("token", { from: "2026-02-01" });

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const url = callArgs[0] as string;
    expect(url).toContain("from=2026-02-01");
  });

  it("should add to parameter to URL when provided", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      meetings: [],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    await listMeetings("token", { to: "2026-02-28" });

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const url = callArgs[0] as string;
    expect(url).toContain("to=2026-02-28");
  });

  it("should add both from and to parameters to URL", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      meetings: [],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    await listMeetings("token", { from: "2026-02-01", to: "2026-02-28" });

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const url = callArgs[0] as string;
    expect(url).toContain("from=2026-02-01");
    expect(url).toContain("to=2026-02-28");
  });

  it("should not add from/to parameters when not provided", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      meetings: [],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    await listMeetings("token", {});

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const url = callArgs[0] as string;
    expect(url).not.toContain("from=");
    expect(url).not.toContain("to=");
  });

  it("should send correct Authorization header", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      meetings: [],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    await listMeetings("my-list-token", {});

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const options = callArgs[1] as RequestInit;
    expect(options.headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer my-list-token",
      })
    );
  });

  it("should use GET method", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      meetings: [],
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { listMeetings } = await import("../api.js");
    await listMeetings("token", {});

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const options = callArgs[1] as RequestInit;
    expect(options.method).toBe("GET");
  });

  it("should throw ApiError on 401 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 401, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { listMeetings } = await import("../api.js");
    await expect(listMeetings("token", {})).rejects.toThrow(
      "Authentication expired. Please try again."
    );
  });

  it("should throw ApiError on 429 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 429, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { listMeetings } = await import("../api.js");
    await expect(listMeetings("token", {})).rejects.toThrow(
      "Rate limit exceeded. Please try again later."
    );
  });

  it("should throw ApiError with operation name in message for unknown status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 502, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { listMeetings } = await import("../api.js");
    await expect(listMeetings("token", {})).rejects.toThrow(
      "Failed to list meetings (HTTP 502)."
    );
  });

  it("should throw an error with name ApiError on error", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 500, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { listMeetings } = await import("../api.js");
    try {
      await listMeetings("token", {});
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).name).toBe("ApiError");
    }
  });
});
