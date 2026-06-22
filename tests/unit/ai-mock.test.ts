import { describe, it, expect } from "vitest";

import { getAIProvider, type CopilotContext } from "@/lib/ai";

const base: CopilotContext = {
  subject: "X",
  description: null,
  customerName: null,
  messages: [],
  existingTags: [],
};

describe("AI mock provider", () => {
  const provider = getAIProvider();

  it("defaults to the mock provider without a key", () => {
    expect(provider.name).toBe("mock");
  });

  it("summarize references the subject and customer", async () => {
    const s = await provider.summarize({ ...base, subject: "Login broken", customerName: "Ava" });
    expect(s).toContain("Login broken");
    expect(s.toLowerCase()).toContain("ava");
  });

  it("suggestTags maps keywords and excludes existing tags", async () => {
    const billing = await provider.suggestTags({
      ...base,
      subject: "Refund and invoice problem",
      description: "billing charge",
    });
    expect(billing).toContain("billing");

    const filtered = await provider.suggestTags({
      ...base,
      subject: "login bug",
      existingTags: ["auth"],
    });
    expect(filtered).not.toContain("auth");
    expect(filtered).toContain("bug");
  });

  it("draftReply greets the customer by first name", async () => {
    const d = await provider.draftReply({ ...base, customerName: "Theo Park" });
    expect(d).toContain("Theo");
  });
});
