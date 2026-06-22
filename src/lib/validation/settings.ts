import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Tell us your name").max(80, "Too long"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(80, "Too long"),
});
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
