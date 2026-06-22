import { describe, it, expect } from "vitest";

import { safeInternalPath } from "@/lib/safe-redirect";

describe("safeInternalPath", () => {
  it("accepts internal paths", () => {
    expect(safeInternalPath("/dashboard", "/x")).toBe("/dashboard");
    expect(safeInternalPath("/inbox?status=open", "/x")).toBe("/inbox?status=open");
    expect(safeInternalPath("/inbox/123", "/x")).toBe("/inbox/123");
  });

  it("rejects protocol-relative and external URLs", () => {
    expect(safeInternalPath("//evil.com", "/x")).toBe("/x");
    expect(safeInternalPath("https://evil.com", "/x")).toBe("/x");
    expect(safeInternalPath("evil.com", "/x")).toBe("/x");
  });

  it("rejects backslash-escaped open redirects", () => {
    expect(safeInternalPath("/\\evil.com", "/x")).toBe("/x");
    expect(safeInternalPath("/foo\\bar", "/x")).toBe("/x");
  });

  it("falls back on empty or nullish input", () => {
    expect(safeInternalPath("", "/x")).toBe("/x");
    expect(safeInternalPath(null, "/x")).toBe("/x");
    expect(safeInternalPath(undefined, "/x")).toBe("/x");
  });
});
