import { z } from "zod";

import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/domain";

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3, "Give the ticket a clear subject").max(200),
  body: optionalText(10_000),
  priority: z.enum(TICKET_PRIORITIES),
  category: optionalText(60),
  customerId: z.string().uuid().nullable().optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export const addCommentSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a message").max(10_000),
  isInternal: z.boolean(),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().max(20).optional(),
});
