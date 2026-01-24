import { describe, test, expect } from "bun:test";
import { logger } from "@/utils/logger.js";

/**
 * Logger Unit Tests
 *
 * Run with: bun test src/tests/logger.test.ts
 */

describe("Logger", () => {
  describe("log methods exist", () => {
    test("has debug method", () => {
      expect(typeof logger.debug).toBe("function");
    });

    test("has info method", () => {
      expect(typeof logger.info).toBe("function");
    });

    test("has warn method", () => {
      expect(typeof logger.warn).toBe("function");
    });

    test("has error method", () => {
      expect(typeof logger.error).toBe("function");
    });

    test("has request method", () => {
      expect(typeof logger.request).toBe("function");
    });
  });

  describe("log methods don't throw", () => {
    test("logger.info works without error", () => {
      expect(() => logger.info("Test message")).not.toThrow();
    });

    test("logger.info with metadata works", () => {
      expect(() => logger.info("Test message", { foo: "bar" })).not.toThrow();
    });

    test("logger.error works", () => {
      expect(() => logger.error("Test error", { code: 500 })).not.toThrow();
    });

    test("logger.request works", () => {
      expect(() => logger.request("GET", "/health", 200, 15)).not.toThrow();
    });
  });
});
