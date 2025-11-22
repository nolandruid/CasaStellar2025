/**
 * Employer Request Validation Schemas
 * Uses Zod for runtime type validation
 */

import { z } from "zod";

/**
 * Schema for employer registration
 */
export const RegisterEmployerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().min(1, "Company name is required"),
});

/**
 * Schema for employer login
 */
export const LoginEmployerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for updating employer profile
 */
export const UpdateEmployerSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  companyName: z.string().min(1, "Company name is required").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
});

export type RegisterEmployerInput = z.infer<typeof RegisterEmployerSchema>;
export type LoginEmployerInput = z.infer<typeof LoginEmployerSchema>;
export type UpdateEmployerInput = z.infer<typeof UpdateEmployerSchema>;
