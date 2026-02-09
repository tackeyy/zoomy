import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AppConfig } from "../types.js";
import { AuthError } from "../errors.js";

// Mock the config module to avoid dotenv side effects
vi.mock("../config.js", () => ({
  ZOOM_OAUTH_URL: "https://zoom.us/oauth/token",
}));

const mockConfig: AppConfig = {
  accountId: "test-account",
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  timezone: "Asia/Tokyo",
  dateFormat: "yyyy/MM/dd HH:mm",
  topicTemplate: "{{date}} | {{with}}",
  topicTemplateNoWith: "{{date}}",
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

describe("getAccessToken", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset module to clear cached token
    vi.resetModules();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should return access token on successful response", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      access_token: "mock-token-123",
      token_type: "bearer",
      expires_in: 3600,
      scope: "meeting:write",
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { getAccessToken } = await import("../auth.js");
    const token = await getAccessToken(mockConfig);

    // Assert
    expect(token).toBe("mock-token-123");
  });

  it("should call fetch with correct URL and headers", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      access_token: "token",
      token_type: "bearer",
      expires_in: 3600,
      scope: "",
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { getAccessToken } = await import("../auth.js");
    await getAccessToken(mockConfig);

    // Assert
    const expectedCredentials = Buffer.from(
      "test-client-id:test-client-secret"
    ).toString("base64");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://zoom.us/oauth/token",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: `Basic ${expectedCredentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
    );
  });

  it("should send account_id in request body", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      access_token: "token",
      token_type: "bearer",
      expires_in: 3600,
      scope: "",
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { getAccessToken } = await import("../auth.js");
    await getAccessToken(mockConfig);

    // Assert
    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
    const body = callArgs[1]?.body as string;
    expect(body).toContain("grant_type=account_credentials");
    expect(body).toContain("account_id=test-account");
  });

  it("should throw AuthError with message for 400 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 400, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { getAccessToken } = await import("../auth.js");
    await expect(getAccessToken(mockConfig)).rejects.toThrow(
      "Invalid request. Check your account ID."
    );
  });

  it("should throw AuthError with message for 401 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 401, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { getAccessToken } = await import("../auth.js");
    await expect(getAccessToken(mockConfig)).rejects.toThrow(
      "Authentication failed. Check your credentials."
    );
  });

  it("should throw AuthError with message for 403 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 403, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { getAccessToken } = await import("../auth.js");
    await expect(getAccessToken(mockConfig)).rejects.toThrow(
      "Access denied. Check your app permissions."
    );
  });

  it("should throw AuthError with message for 429 status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 429, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { getAccessToken } = await import("../auth.js");
    await expect(getAccessToken(mockConfig)).rejects.toThrow(
      "Rate limit exceeded. Please try again later."
    );
  });

  it("should throw AuthError with generic message for unknown status", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 500, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { getAccessToken } = await import("../auth.js");
    await expect(getAccessToken(mockConfig)).rejects.toThrow(
      "Authentication failed (HTTP 500)."
    );
  });

  it("should cache token and reuse on second call", async () => {
    // Arrange
    const mockResponse = createMockResponse(true, 200, {
      access_token: "cached-token",
      token_type: "bearer",
      expires_in: 3600,
      scope: "",
    });
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act
    const { getAccessToken } = await import("../auth.js");
    const token1 = await getAccessToken(mockConfig);
    const token2 = await getAccessToken(mockConfig);

    // Assert
    expect(token1).toBe("cached-token");
    expect(token2).toBe("cached-token");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("should re-fetch token after cache expires", async () => {
    // Arrange
    const mockResponse1 = createMockResponse(true, 200, {
      access_token: "token-1",
      token_type: "bearer",
      expires_in: 1, // 1 second, minus 60s safety margin means already expired
      scope: "",
    });
    const mockResponse2 = createMockResponse(true, 200, {
      access_token: "token-2",
      token_type: "bearer",
      expires_in: 3600,
      scope: "",
    });
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    // Act
    const { getAccessToken } = await import("../auth.js");
    const token1 = await getAccessToken(mockConfig);
    // The token should already be expired (expires_in=1, minus 60s safety)
    const token2 = await getAccessToken(mockConfig);

    // Assert
    expect(token1).toBe("token-1");
    expect(token2).toBe("token-2");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("should throw an error with name AuthError, not a plain Error", async () => {
    // Arrange
    const mockResponse = createMockResponse(false, 401, {});
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    // Act & Assert
    const { getAccessToken } = await import("../auth.js");
    try {
      await getAccessToken(mockConfig);
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).name).toBe("AuthError");
    }
  });
});
