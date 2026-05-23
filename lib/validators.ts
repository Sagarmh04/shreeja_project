import { z } from "zod";

export const authSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
});

export const signupSchema = authSchema.extend({
  fullName: z
    .string()
    .min(2, "Enter your full name.")
    .max(80, "Name is too long."),
});

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Enter your full name.")
    .max(80, "Name is too long."),
  avatarUrl: z.string().trim().optional(),
});

export const recordSchema = z.object({
  title: z.string().min(2, "Title is required.").max(160, "Title is too long."),
  category: z
    .string()
    .min(2, "Category is required.")
    .max(80, "Category is too long."),
  description: z
    .string()
    .min(10, "Add a little more detail.")
    .max(4000, "Description is too long."),
  quickFacts: z.array(
    z.object({
      label: z.string().min(1).max(60),
      value: z.string().min(1).max(160),
    }),
  ),
});

export type FormState = {
  error?: string;
  success?: string;
};
