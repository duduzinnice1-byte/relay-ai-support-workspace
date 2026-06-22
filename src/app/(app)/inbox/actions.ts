"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/data/organizations";
import type { Database, Json, TablesUpdate } from "@/lib/database.types";
import {
  addCommentSchema,
  createCustomerSchema,
  createTagSchema,
  createTicketSchema,
  updateTicketSchema,
} from "@/lib/validation/ticket";

type DB = SupabaseClient<Database>;
type Result<T = unknown> = ({ error: string } | ({ ok: true } & T));

async function logEvent(
  supabase: DB,
  orgId: string,
  ticketId: string,
  actorId: string | null,
  type: string,
  data: Json = {},
) {
  await supabase.from("ticket_events").insert({
    organization_id: orgId,
    ticket_id: ticketId,
    actor_id: actorId,
    type,
    data,
  });
}

export async function createTicket(
  input: unknown,
): Promise<Result<{ ticketId: string }>> {
  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid ticket." };
  }

  const [org, user] = await Promise.all([getActiveOrganization(), getUser()]);
  if (!org || !user) return { error: "Not authenticated." };

  const supabase = await createClient();

  // Next per-org ticket number (the trigger is a fallback for null values).
  const { data: maxRow } = await supabase
    .from("tickets")
    .select("number")
    .eq("organization_id", org.organization.id)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextNumber = (maxRow?.number ?? 0) + 1;

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      organization_id: org.organization.id,
      subject: parsed.data.subject,
      body: parsed.data.body || null,
      priority: parsed.data.priority,
      category: parsed.data.category || null,
      customer_id: parsed.data.customerId ?? null,
      created_by: user.id,
      number: nextNumber,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create ticket." };

  await logEvent(supabase, org.organization.id, data.id, user.id, "created", {
    subject: parsed.data.subject,
  });

  revalidatePath("/inbox");
  return { ok: true, ticketId: data.id };
}

export async function updateTicket(
  ticketId: string,
  input: unknown,
): Promise<Result> {
  const parsed = updateTicketSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid update." };

  const user = await getUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("tickets")
    .select("organization_id, status, priority, assignee_id, resolved_at, first_response_at")
    .eq("id", ticketId)
    .maybeSingle();

  if (!current) return { error: "Ticket not found." };

  const patch: TablesUpdate<"tickets"> = {};
  const events: { type: string; data: Json }[] = [];

  if (parsed.data.status && parsed.data.status !== current.status) {
    patch.status = parsed.data.status;
    events.push({ type: "status_changed", data: { from: current.status, to: parsed.data.status } });
    if (
      (parsed.data.status === "resolved" || parsed.data.status === "closed") &&
      !current.resolved_at
    ) {
      patch.resolved_at = new Date().toISOString();
    }
  }

  if (parsed.data.priority && parsed.data.priority !== current.priority) {
    patch.priority = parsed.data.priority;
    events.push({ type: "priority_changed", data: { from: current.priority, to: parsed.data.priority } });
  }

  if (
    parsed.data.assigneeId !== undefined &&
    parsed.data.assigneeId !== current.assignee_id
  ) {
    patch.assignee_id = parsed.data.assigneeId;
    events.push({
      type: parsed.data.assigneeId ? "assigned" : "unassigned",
      data: { from: current.assignee_id, to: parsed.data.assigneeId },
    });
  }

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from("tickets").update(patch).eq("id", ticketId);
  if (error) return { error: error.message };

  for (const e of events) {
    await logEvent(supabase, current.organization_id, ticketId, user.id, e.type, e.data);
  }

  revalidatePath(`/inbox/${ticketId}`);
  revalidatePath("/inbox");
  return { ok: true };
}

export async function addComment(input: unknown): Promise<Result> {
  const parsed = addCommentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid comment." };

  const user = await getUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("organization_id, first_response_at")
    .eq("id", parsed.data.ticketId)
    .maybeSingle();
  if (!ticket) return { error: "Ticket not found." };

  const { error } = await supabase.from("ticket_comments").insert({
    ticket_id: parsed.data.ticketId,
    organization_id: ticket.organization_id,
    author_id: user.id,
    body: parsed.data.body,
    is_internal: parsed.data.isInternal,
  });
  if (error) return { error: error.message };

  // First public reply stamps the response time (powers the dashboard metric).
  if (!parsed.data.isInternal && !ticket.first_response_at) {
    await supabase
      .from("tickets")
      .update({ first_response_at: new Date().toISOString() })
      .eq("id", parsed.data.ticketId);
  }

  await logEvent(supabase, ticket.organization_id, parsed.data.ticketId, user.id, "commented", {
    internal: parsed.data.isInternal,
  });

  revalidatePath(`/inbox/${parsed.data.ticketId}`);
  return { ok: true };
}

export async function createTag(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid tag." };

  const org = await getActiveOrganization();
  if (!org) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({
      organization_id: org.organization.id,
      name: parsed.data.name,
      color: parsed.data.color ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create tag." };
  revalidatePath("/inbox");
  return { ok: true, id: data.id };
}

export async function setTicketTag(
  ticketId: string,
  tagId: string,
  attach: boolean,
): Promise<Result> {
  const supabase = await createClient();

  if (attach) {
    const { error } = await supabase
      .from("ticket_tags")
      .insert({ ticket_id: ticketId, tag_id: tagId });
    if (error && error.code !== "23505") return { error: error.message };
  } else {
    const { error } = await supabase
      .from("ticket_tags")
      .delete()
      .eq("ticket_id", ticketId)
      .eq("tag_id", tagId);
    if (error) return { error: error.message };
  }

  revalidatePath(`/inbox/${ticketId}`);
  return { ok: true };
}

export async function createCustomer(
  input: unknown,
): Promise<Result<{ id: string }>> {
  const parsed = createCustomerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid customer." };

  const org = await getActiveOrganization();
  if (!org) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      organization_id: org.organization.id,
      name: parsed.data.name,
      email: parsed.data.email || null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not create customer." };

  revalidatePath("/customers");
  revalidatePath("/inbox");
  return { ok: true, id: data.id };
}
