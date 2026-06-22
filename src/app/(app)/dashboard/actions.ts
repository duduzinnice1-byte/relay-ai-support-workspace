"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrganization } from "@/lib/data/organizations";
import type { TicketStatus, TicketPriority } from "@/lib/domain";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export async function seedSampleData(): Promise<{ error: string } | { ok: true }> {
  const [org, user] = await Promise.all([getActiveOrganization(), getUser()]);
  if (!org || !user) return { error: "Not authenticated." };
  if (org.role !== "admin") {
    return { error: "Only admins can load sample data." };
  }

  const orgId = org.organization.id;
  const supabase = await createClient();
  const now = Date.now();

  const { count } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);
  if ((count ?? 0) > 0) {
    return { error: "This workspace already has tickets." };
  }

  // Customers
  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .insert([
      { organization_id: orgId, name: "Ava Stenberg", email: "ava@northwind.io" },
      { organization_id: orgId, name: "Theo Park", email: "theo@kanboard.app" },
      { organization_id: orgId, name: "Mara Okafor", email: "mara@lumenpay.co" },
      { organization_id: orgId, name: "Ivo Salgado", email: "ivo@brightcart.io" },
      { organization_id: orgId, name: "Lena Voss", email: "lena@finchdesk.com" },
      { organization_id: orgId, name: "Sam Reyes", email: "sam@orbitmail.io" },
    ])
    .select("id");
  if (custErr || !customers) return { error: "Could not seed customers." };

  // Tags
  const { data: tags, error: tagErr } = await supabase
    .from("tags")
    .insert([
      { organization_id: orgId, name: "billing", color: "#2d6be4" },
      { organization_id: orgId, name: "bug", color: "#e5484d" },
      { organization_id: orgId, name: "auth", color: "#7c5cd6" },
      { organization_id: orgId, name: "performance", color: "#ec7a1c" },
      { organization_id: orgId, name: "api", color: "#1e9e6a" },
    ])
    .select("id, name");
  if (tagErr || !tags) return { error: "Could not seed tags." };
  const tagId = (name: string) => tags.find((t) => t.name === name)?.id;

  type Seed = {
    subject: string;
    body: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: string;
    customer: number;
    tags: string[];
    createdDaysAgo: number;
    firstResponseMin?: number;
    resolvedHours?: number;
    note?: string;
    reply?: string;
  };

  const seeds: Seed[] = [
    {
      subject: "Webhook retries spiking after the 4.2 deploy",
      body: "Since this morning we're seeing duplicate webhook deliveries. Can you check what changed?",
      status: "open", priority: "urgent", category: "Bug", customer: 0,
      tags: ["bug", "api"], createdDaysAgo: 0, firstResponseMin: 14,
      note: "Looks related to the retry backoff change — pinging eng.",
    },
    {
      subject: "Refund isn't reflected on the latest invoice",
      body: "I was refunded last week but the invoice still shows the original total.",
      status: "pending", priority: "high", category: "Billing", customer: 2,
      tags: ["billing"], createdDaysAgo: 1, firstResponseMin: 92,
      reply: "Thanks for flagging — I've re-synced the invoice and it should update within the hour.",
    },
    {
      subject: "SSO login loops on mobile Safari",
      body: "Tapping 'Sign in with SSO' just bounces back to the login screen on iOS.",
      status: "open", priority: "normal", category: "Auth", customer: 1,
      tags: ["auth", "bug"], createdDaysAgo: 2, firstResponseMin: 200,
    },
    {
      subject: "CSV export missing the tax columns",
      body: "Our finance export no longer includes VAT columns.",
      status: "resolved", priority: "low", category: "Export", customer: 3,
      tags: ["billing"], createdDaysAgo: 5, firstResponseMin: 50, resolvedHours: 26,
      reply: "Fixed — the tax columns are back in the export. Let me know if it looks right.",
    },
    {
      subject: "Dashboard loads slowly for large workspaces",
      body: "With ~10k tickets the dashboard takes 8-10s to load.",
      status: "on_hold", priority: "high", category: "Performance", customer: 4,
      tags: ["performance"], createdDaysAgo: 6, firstResponseMin: 130,
      note: "Waiting on the indexing work to land before we can close this out.",
    },
    {
      subject: "API rate limit headers are missing",
      body: "We can't see remaining quota — the X-RateLimit headers aren't returned.",
      status: "open", priority: "normal", category: "API", customer: 5,
      tags: ["api"], createdDaysAgo: 3,
    },
    {
      subject: "Can't reset password — email never arrives",
      body: "I've tried the reset flow three times and no email comes through.",
      status: "pending", priority: "high", category: "Auth", customer: 1,
      tags: ["auth"], createdDaysAgo: 1, firstResponseMin: 38,
      reply: "Sorry about that — I've manually triggered a reset link to your address.",
    },
    {
      subject: "Feature request: bulk-assign tickets",
      body: "It would save us a lot of time to assign several tickets at once.",
      status: "closed", priority: "low", category: "Feedback", customer: 0,
      tags: [], createdDaysAgo: 9, firstResponseMin: 240, resolvedHours: 70,
    },
  ];

  const ticketRows = seeds.map((s, i) => {
    const createdAt = new Date(now - s.createdDaysAgo * DAY - HOUR).toISOString();
    return {
      organization_id: orgId,
      number: i + 1,
      subject: s.subject,
      body: s.body,
      status: s.status,
      priority: s.priority,
      category: s.category,
      customer_id: customers[s.customer]?.id ?? null,
      created_by: user.id,
      assignee_id: i % 2 === 0 ? user.id : null,
      created_at: createdAt,
      first_response_at:
        s.firstResponseMin != null
          ? new Date(new Date(createdAt).getTime() + s.firstResponseMin * MIN).toISOString()
          : null,
      resolved_at:
        s.resolvedHours != null
          ? new Date(new Date(createdAt).getTime() + s.resolvedHours * HOUR).toISOString()
          : null,
    };
  });

  const { data: tickets, error: tErr } = await supabase
    .from("tickets")
    .insert(ticketRows)
    .select("id, number");
  if (tErr || !tickets) return { error: `Could not seed tickets: ${tErr?.message ?? ""}` };

  const idByNumber = new Map(tickets.map((t) => [t.number, t.id]));

  // Tags, comments and events
  const ticketTagRows: { ticket_id: string; tag_id: string }[] = [];
  const commentRows: {
    ticket_id: string;
    organization_id: string;
    author_id: string;
    body: string;
    is_internal: boolean;
  }[] = [];
  const eventRows: {
    ticket_id: string;
    organization_id: string;
    actor_id: string;
    type: string;
    data: Record<string, string | boolean>;
  }[] = [];

  seeds.forEach((s, i) => {
    const id = idByNumber.get(i + 1);
    if (!id) return;
    for (const name of s.tags) {
      const tid = tagId(name);
      if (tid) ticketTagRows.push({ ticket_id: id, tag_id: tid });
    }
    eventRows.push({
      ticket_id: id, organization_id: orgId, actor_id: user.id, type: "created",
      data: { subject: s.subject },
    });
    if (s.reply) {
      commentRows.push({ ticket_id: id, organization_id: orgId, author_id: user.id, body: s.reply, is_internal: false });
      eventRows.push({ ticket_id: id, organization_id: orgId, actor_id: user.id, type: "commented", data: { internal: false } });
    }
    if (s.note) {
      commentRows.push({ ticket_id: id, organization_id: orgId, author_id: user.id, body: s.note, is_internal: true });
      eventRows.push({ ticket_id: id, organization_id: orgId, actor_id: user.id, type: "commented", data: { internal: true } });
    }
    if (s.resolvedHours != null) {
      eventRows.push({ ticket_id: id, organization_id: orgId, actor_id: user.id, type: "status_changed", data: { from: "open", to: s.status } });
    }
  });

  if (ticketTagRows.length) await supabase.from("ticket_tags").insert(ticketTagRows);
  if (commentRows.length) await supabase.from("ticket_comments").insert(commentRows);
  if (eventRows.length) await supabase.from("ticket_events").insert(eventRows);

  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  revalidatePath("/customers");
  return { ok: true };
}
