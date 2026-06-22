"use server";

import { getActiveOrganization } from "@/lib/data/organizations";
import { getOrgMembers } from "@/lib/data/members";
import { getTicket, getTicketComments } from "@/lib/data/tickets";
import { getAIProvider, type CopilotContext } from "@/lib/ai";

type Fail = { error: string };

async function buildContext(ticketId: string): Promise<
  { ok: true; ctx: CopilotContext } | Fail
> {
  const org = await getActiveOrganization();
  if (!org) return { error: "Not authenticated." };

  const ticket = await getTicket(org.organization.id, ticketId);
  if (!ticket) return { error: "Ticket not found." };

  const [comments, members] = await Promise.all([
    getTicketComments(ticketId),
    getOrgMembers(org.organization.id),
  ]);
  const nameById = new Map(members.map((m) => [m.userId, m.name]));

  const ctx: CopilotContext = {
    subject: ticket.subject,
    description: ticket.body,
    customerName: ticket.customers?.name ?? null,
    existingTags: ticket.ticket_tags
      .map((tt) => tt.tags?.name)
      .filter((n): n is string => Boolean(n)),
    messages: comments.map((c) => ({
      author: c.author_id ? nameById.get(c.author_id) ?? "Agent" : "System",
      body: c.body,
      internal: c.is_internal,
    })),
  };
  return { ok: true, ctx };
}

export async function summarizeTicket(
  ticketId: string,
): Promise<{ ok: true; summary: string; provider: string } | Fail> {
  const built = await buildContext(ticketId);
  if ("error" in built) return built;
  try {
    const provider = getAIProvider();
    const summary = await provider.summarize(built.ctx);
    return { ok: true, summary, provider: provider.name };
  } catch {
    return { error: "The copilot is unavailable right now. Try again." };
  }
}

export async function suggestTicketTags(
  ticketId: string,
): Promise<{ ok: true; tags: string[]; provider: string } | Fail> {
  const built = await buildContext(ticketId);
  if ("error" in built) return built;
  try {
    const provider = getAIProvider();
    const tags = await provider.suggestTags(built.ctx);
    return { ok: true, tags, provider: provider.name };
  } catch {
    return { error: "The copilot is unavailable right now. Try again." };
  }
}

export async function draftTicketReply(
  ticketId: string,
): Promise<{ ok: true; draft: string; provider: string } | Fail> {
  const built = await buildContext(ticketId);
  if ("error" in built) return built;
  try {
    const provider = getAIProvider();
    const draft = await provider.draftReply(built.ctx);
    return { ok: true, draft, provider: provider.name };
  } catch {
    return { error: "The copilot is unavailable right now. Try again." };
  }
}
