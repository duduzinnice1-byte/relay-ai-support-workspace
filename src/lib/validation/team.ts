import { z } from "zod";

import { USER_ROLES } from "@/lib/domain";

export const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(USER_ROLES),
});
export type InviteInput = z.infer<typeof inviteSchema>;
