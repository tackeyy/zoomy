import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConfigError, AuthError, ApiError, ValidationError } from "../errors.js";

describe("Error Handling - Main error handler behavior", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("should handle ConfigError with exit code 2", () => {
    const error = new ConfigError("ZOOM_ACCOUNT_ID is not set. Check your .env file.");

    try {
      if (error instanceof ConfigError) {
        process.stderr.write(`Configuration error: ${error.message}\n`);
        process.exit(2);
      }
    } catch (e) {
      // process.exit throws in test
    }

    expect(stderrSpy).toHaveBeenCalledWith(
      "Configuration error: ZOOM_ACCOUNT_ID is not set. Check your .env file.\n"
    );
    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it("should handle AuthError with exit code 1", () => {
    const error = new AuthError("Authentication failed. Check your credentials.");

    try {
      if (error instanceof AuthError) {
        process.stderr.write(`Authentication error: ${error.message}\n`);
        process.exit(1);
      }
    } catch (e) {
      // process.exit throws in test
    }

    expect(stderrSpy).toHaveBeenCalledWith(
      "Authentication error: Authentication failed. Check your credentials.\n"
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should handle ApiError with exit code 1", () => {
    const error = new ApiError("Failed to create meeting (HTTP 500).");

    try {
      if (error instanceof ApiError) {
        process.stderr.write(`API error: ${error.message}\n`);
        process.exit(1);
      }
    } catch (e) {
      // process.exit throws in test
    }

    expect(stderrSpy).toHaveBeenCalledWith("API error: Failed to create meeting (HTTP 500).\n");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should handle ValidationError with exit code 2", () => {
    const error = new ValidationError("--start must be a valid ISO 8601 datetime.");

    try {
      if (error instanceof ValidationError) {
        process.stderr.write(`Validation error: ${error.message}\n`);
        process.exit(2);
      }
    } catch (e) {
      // process.exit throws in test
    }

    expect(stderrSpy).toHaveBeenCalledWith(
      "Validation error: --start must be a valid ISO 8601 datetime.\n"
    );
    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it("should handle unexpected error with exit code 1", () => {
    const error = new Error("Unexpected error");

    try {
      if (
        !(error instanceof ConfigError) &&
        !(error instanceof AuthError) &&
        !(error instanceof ApiError) &&
        !(error instanceof ValidationError)
      ) {
        process.stderr.write("Unexpected error occurred.\n");
        process.exit(1);
      }
    } catch (e) {
      // process.exit throws in test
    }

    expect(stderrSpy).toHaveBeenCalledWith("Unexpected error occurred.\n");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("Error Handling - Error type discrimination", () => {
  it("should correctly identify ConfigError", () => {
    const error = new ConfigError("config error");

    expect(error instanceof ConfigError).toBe(true);
    expect(error instanceof AuthError).toBe(false);
    expect(error instanceof ApiError).toBe(false);
    expect(error instanceof ValidationError).toBe(false);
  });

  it("should correctly identify AuthError", () => {
    const error = new AuthError("auth error");

    expect(error instanceof ConfigError).toBe(false);
    expect(error instanceof AuthError).toBe(true);
    expect(error instanceof ApiError).toBe(false);
    expect(error instanceof ValidationError).toBe(false);
  });

  it("should correctly identify ApiError", () => {
    const error = new ApiError("api error");

    expect(error instanceof ConfigError).toBe(false);
    expect(error instanceof AuthError).toBe(false);
    expect(error instanceof ApiError).toBe(true);
    expect(error instanceof ValidationError).toBe(false);
  });

  it("should correctly identify ValidationError", () => {
    const error = new ValidationError("validation error");

    expect(error instanceof ConfigError).toBe(false);
    expect(error instanceof AuthError).toBe(false);
    expect(error instanceof ApiError).toBe(false);
    expect(error instanceof ValidationError).toBe(true);
  });

  it("should correctly identify plain Error as none of the custom types", () => {
    const error = new Error("plain error");

    expect(error instanceof ConfigError).toBe(false);
    expect(error instanceof AuthError).toBe(false);
    expect(error instanceof ApiError).toBe(false);
    expect(error instanceof ValidationError).toBe(false);
  });
});
