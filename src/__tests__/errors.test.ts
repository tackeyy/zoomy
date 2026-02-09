import { describe, it, expect } from "vitest";
import {
  ZoomError,
  ConfigError,
  AuthError,
  ApiError,
  ValidationError,
} from "../errors.js";

describe("ZoomError", () => {
  it("should set name to ZoomError", () => {
    const error = new ZoomError("test message");

    expect(error.name).toBe("ZoomError");
  });

  it("should set the message correctly", () => {
    const error = new ZoomError("something went wrong");

    expect(error.message).toBe("something went wrong");
  });

  it("should be an instance of Error", () => {
    const error = new ZoomError("test");

    expect(error).toBeInstanceOf(Error);
  });

  it("should be an instance of ZoomError", () => {
    const error = new ZoomError("test");

    expect(error).toBeInstanceOf(ZoomError);
  });
});

describe("ConfigError", () => {
  it("should set name to ConfigError", () => {
    const error = new ConfigError("config missing");

    expect(error.name).toBe("ConfigError");
  });

  it("should be an instance of ZoomError", () => {
    const error = new ConfigError("config missing");

    expect(error).toBeInstanceOf(ZoomError);
  });

  it("should be an instance of Error", () => {
    const error = new ConfigError("config missing");

    expect(error).toBeInstanceOf(Error);
  });

  it("should preserve the message", () => {
    const error = new ConfigError("ZOOM_ACCOUNT_ID is not set");

    expect(error.message).toBe("ZOOM_ACCOUNT_ID is not set");
  });
});

describe("AuthError", () => {
  it("should set name to AuthError", () => {
    const error = new AuthError("auth failed");

    expect(error.name).toBe("AuthError");
  });

  it("should be an instance of ZoomError", () => {
    const error = new AuthError("auth failed");

    expect(error).toBeInstanceOf(ZoomError);
  });

  it("should be an instance of Error", () => {
    const error = new AuthError("auth failed");

    expect(error).toBeInstanceOf(Error);
  });
});

describe("ApiError", () => {
  it("should set name to ApiError", () => {
    const error = new ApiError("api failed");

    expect(error.name).toBe("ApiError");
  });

  it("should be an instance of ZoomError", () => {
    const error = new ApiError("api failed");

    expect(error).toBeInstanceOf(ZoomError);
  });

  it("should be an instance of Error", () => {
    const error = new ApiError("api failed");

    expect(error).toBeInstanceOf(Error);
  });
});

describe("ValidationError", () => {
  it("should set name to ValidationError", () => {
    const error = new ValidationError("invalid input");

    expect(error.name).toBe("ValidationError");
  });

  it("should be an instance of ZoomError", () => {
    const error = new ValidationError("invalid input");

    expect(error).toBeInstanceOf(ZoomError);
  });

  it("should be an instance of Error", () => {
    const error = new ValidationError("invalid input");

    expect(error).toBeInstanceOf(Error);
  });
});

describe("Error discrimination via instanceof", () => {
  it("should distinguish ConfigError from AuthError", () => {
    const configErr = new ConfigError("config");
    const authErr = new AuthError("auth");

    expect(configErr).not.toBeInstanceOf(AuthError);
    expect(authErr).not.toBeInstanceOf(ConfigError);
  });

  it("should distinguish ApiError from ValidationError", () => {
    const apiErr = new ApiError("api");
    const validationErr = new ValidationError("validation");

    expect(apiErr).not.toBeInstanceOf(ValidationError);
    expect(validationErr).not.toBeInstanceOf(ApiError);
  });

  it("should identify all subclasses as ZoomError", () => {
    const errors = [
      new ConfigError("a"),
      new AuthError("b"),
      new ApiError("c"),
      new ValidationError("d"),
    ];

    for (const error of errors) {
      expect(error).toBeInstanceOf(ZoomError);
    }
  });
});

describe("Edge cases", () => {
  it("should handle empty string message", () => {
    const error = new ZoomError("");

    expect(error.message).toBe("");
  });

  it("should handle very long message", () => {
    const longMessage = "x".repeat(10000);
    const error = new ZoomError(longMessage);

    expect(error.message).toBe(longMessage);
    expect(error.message.length).toBe(10000);
  });

  it("should handle message with special characters", () => {
    const special = "Error: 日本語 <script>alert('xss')</script> \n\t";
    const error = new ZoomError(special);

    expect(error.message).toBe(special);
  });
});
