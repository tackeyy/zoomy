export class ZoomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZoomError";
  }
}

export class ConfigError extends ZoomError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class AuthError extends ZoomError {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends ZoomError {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ZoomError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
