import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Tell us your name")
    .max(80, "That name is a little too long"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(72, "Keep it under 72 characters"),
});
export type SignupInput = z.infer<typeof signupSchema>;
