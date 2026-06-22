import { describe, it, expect } from "vitest";

import {
  ticketRef,
  STATUS_META,
  PRIORITY_META,
  TICKET_STATUSES,
} from "@/lib/domain";

describe("domain helpers", () => {
  it("formats the ticket reference", () => {
    expect(ticketRef(1042)).toBe("RLY-1042");
  });

  it("has metadata for every status", () => {
    for (const status of TICKET_STATUSES) {
      expect(STATUS_META[status]?.label).toBeTruthy();
    }
  });

  it("orders priority levels low → urgent", () => {
    expect(PRIORITY_META.urgent.level).toBeGreaterThan(PRIORITY_META.high.level);
    expect(PRIORITY_META.high.level).toBeGreaterThan(PRIORITY_META.low.level);
  });
});
