/**
 * AI copilot abstraction. Defaults to a deterministic mock so the product works
 * with zero configuration; set AI_PROVIDER=anthropic (+ ANTHROPIC_API_KEY) to
 * use a real model. The interface is provider-agnostic on purpose.
 */

export type ThreadMessage = { author: string; body: string; internal: boolean };

export type CopilotContext = {
  subject: string;
  description: string | null;
  customerName: string | null;
  messages: ThreadMessage[];
  existingTags: string[];
};

export interface AIProvider {
  readonly name: string;
  summarize(ctx: CopilotContext): Promise<string>;
  suggestTags(ctx: CopilotContext): Promise<string[]>;
  draftReply(ctx: CopilotContext): Promise<string>;
}

function threadText(ctx: CopilotContext): string {
  const lines = [
    `Subject: ${ctx.subject}`,
    ctx.description ? `Description: ${ctx.description}` : null,
    ctx.customerName ? `Customer: ${ctx.customerName}` : null,
    "",
    "Conversation:",
    ...ctx.messages.map(
      (m) => `- ${m.author}${m.internal ? " (internal note)" : ""}: ${m.body}`,
    ),
  ].filter(Boolean);
  return lines.join("\n");
}

// ── Mock provider ──────────────────────────────────────────────────────────
const KEYWORD_TAGS: { match: RegExp; tag: string }[] = [
  { match: /refund|invoice|charge|billing|payment|subscription/i, tag: "billing" },
  { match: /login|password|sign[\s-]?in|sso|auth|2fa|otp/i, tag: "auth" },
  { match: /error|crash|bug|broken|fail|exception|500|stack/i, tag: "bug" },
  { match: /slow|latency|timeout|performance|lag/i, tag: "performance" },
  { match: /export|csv|download|report/i, tag: "export" },
  { match: /api|webhook|integration|token/i, tag: "api" },
  { match: /mobile|ios|android|safari|app/i, tag: "mobile" },
  { match: /cancel|churn|downgrade/i, tag: "retention" },
];

class MockProvider implements AIProvider {
  readonly name = "mock";

  async summarize(ctx: CopilotContext): Promise<string> {
    const count = ctx.messages.length;
    const last = ctx.messages.filter((m) => !m.internal).at(-1);
    const snippet = last ? last.body.slice(0, 140) : ctx.description?.slice(0, 140) ?? "";
    const who = ctx.customerName ?? "The customer";
    return [
      `${who} opened a ticket about "${ctx.subject}".`,
      count > 0
        ? `There ${count === 1 ? "is" : "are"} ${count} message${count === 1 ? "" : "s"} in the thread${snippet ? `; the latest reads: "${snippet}${snippet.length >= 140 ? "…" : ""}".` : "."}`
        : "No replies yet — this is a fresh ticket.",
      `Suggested next step: acknowledge the issue and confirm the details before resolving.`,
    ].join(" ");
  }

  async suggestTags(ctx: CopilotContext): Promise<string[]> {
    const haystack = `${ctx.subject} ${ctx.description ?? ""} ${ctx.messages.map((m) => m.body).join(" ")}`;
    const tags = new Set<string>();
    for (const { match, tag } of KEYWORD_TAGS) {
      if (match.test(haystack)) tags.add(tag);
    }
    if (tags.size === 0) tags.add("general");
    return [...tags].filter((t) => !ctx.existingTags.includes(t)).slice(0, 4);
  }

  async draftReply(ctx: CopilotContext): Promise<string> {
    const name = ctx.customerName?.split(" ")[0] ?? "there";
    return [
      `Hi ${name},`,
      "",
      `Thanks for reaching out about "${ctx.subject}" — sorry for the trouble, and I'm happy to help.`,
      "",
      "So I can dig in quickly, could you confirm a couple of details (when it started, and any steps to reproduce)? In the meantime I'm looking into it on our side and will keep you posted.",
      "",
      "Best,",
    ].join("\n");
  }
}

// ── Anthropic provider (fetch-based, no SDK dependency) ─────────────────────
class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  private async complete(system: string, user: string, maxTokens: number): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}`);
    }
    const json = (await res.json()) as { content?: { text?: string }[] };
    return json.content?.[0]?.text?.trim() ?? "";
  }

  summarize(ctx: CopilotContext) {
    return this.complete(
      "You are a support copilot. Summarize the ticket for an agent in 2-3 factual sentences.",
      threadText(ctx),
      400,
    );
  }

  async suggestTags(ctx: CopilotContext) {
    const out = await this.complete(
      "Suggest 3-5 short lowercase tags for this support ticket. Reply with ONLY a comma-separated list, no other text.",
      threadText(ctx),
      60,
    );
    return out
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .filter((t) => !ctx.existingTags.includes(t))
      .slice(0, 5);
  }

  draftReply(ctx: CopilotContext) {
    return this.complete(
      "Draft a warm, concise first reply to the customer for this support ticket. Plain text only. Do not invent facts.",
      threadText(ctx),
      500,
    );
  }
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER;
  const key = process.env.ANTHROPIC_API_KEY;
  if (provider === "anthropic" && key) {
    return new AnthropicProvider(
      key,
      process.env.AI_MODEL || "claude-haiku-4-5-20251001",
    );
  }
  return new MockProvider();
}
