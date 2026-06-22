import { describe, it, expect } from "vitest";

import { loginSchema, signupSchema } from "@/lib/validation/auth";
import { createOrganizationSchema, slugify } from "@/lib/validation/organization";
import { createTicketSchema } from "@/lib/validation/ticket";

describe("auth schemas", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
  it("rejects a bad email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
  it("requires an 8-character signup password", () => {
    expect(
      signupSchema.safeParse({ fullName: "Ada", email: "a@b.com", password: "short" }).success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({ fullName: "Ada", email: "a@b.com", password: "longenough" }).success,
    ).toBe(true);
  });
});

describe("slugify", () => {
  it("produces url-safe slugs", () => {
    expect(slugify("Acme Support")).toBe("acme-support");
    expect(slugify("My Cool Co!!!")).toBe("my-cool-co");
    expect(slugify("--Trim--Me--")).toBe("trim-me");
  });
});

describe("createOrganizationSchema", () => {
  it("accepts a valid name + slug", () => {
    expect(
      createOrganizationSchema.safeParse({ name: "Acme Support", slug: "acme-support" }).success,
    ).toBe(true);
  });
  it("rejects a short name and an invalid slug", () => {
    expect(createOrganizationSchema.safeParse({ name: "A", slug: "acme" }).success).toBe(false);
    expect(createOrganizationSchema.safeParse({ name: "Acme", slug: "Acme Co" }).success).toBe(false);
  });
});

describe("createTicketSchema", () => {
  it("accepts a valid ticket", () => {
    expect(
      createTicketSchema.safeParse({ subject: "Need help please", priority: "normal" }).success,
    ).toBe(true);
  });
  it("rejects a short subject and a bad priority", () => {
    expect(createTicketSchema.safeParse({ subject: "hi", priority: "normal" }).success).toBe(false);
    expect(
      createTicketSchema.safeParse({ subject: "valid subject", priority: "weird" }).success,
    ).toBe(false);
  });
});
