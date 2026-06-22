import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "At least 2 characters")
  .max(48, "At most 48 characters")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Lowercase letters, numbers and hyphens only",
  );

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(80, "At most 80 characters"),
  slug: slugSchema,
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/** Derive a URL-safe slug from a free-text workspace name. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
