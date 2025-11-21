/**
 * Employee Request Validation Schemas
 * Uses Zod for runtime type validation
 */

import { z } from "zod";

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  salary: z.number().int().min(0, "Salary must be a positive integer (in cents)"),
  walletAddress: z.string().min(1, "Wallet address is required"),
});

export const UpdateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  salary: z.number().int().min(0, "Salary must be a positive integer (in cents)").optional(),
  walletAddress: z.string().min(1, "Wallet address is required").optional(),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
