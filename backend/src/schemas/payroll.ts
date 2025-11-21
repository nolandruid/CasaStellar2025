/**
 * Zod Schemas for Payroll API Validation
 */

import { z } from 'zod';

/**
 * Employee data validation schema
 */
const EmployeeSchema = z.object({
  id: z
    .string()
    .min(1, 'Employee ID is required')
    .describe('Unique employee identifier'),
  name: z
    .string()
    .min(1, 'Employee name is required')
    .optional()
    .describe('Employee full name'),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .describe('Employee email address'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number')
    .min(1, 'Amount is required')
    .describe('Payment amount'),
  walletAddress: z
    .string()
    .regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar wallet address format')
    .describe('Stellar wallet address (GXXX... format)'),
});

/**
 * Upload Payroll request validation schema
 */
const UploadPayrollSchema = z.object({
  employees: z
    .array(EmployeeSchema)
    .min(1, 'At least one employee is required')
    .describe('Array of employees with payroll information'),
  employerAddress: z
    .string()
    .regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar wallet address format')
    .describe('Employer Stellar wallet address'),
  payoutDate: z
    .union([
      z.string().datetime('Invalid datetime format'),
      z.number().int().positive('Payout date must be a positive Unix timestamp')
    ])
    .describe('Payout date (ISO string or Unix timestamp)'),
});

/**
 * Claim Pay request validation schema
 */
const ClaimPaySchema = z.object({
  employeeId: z
    .string()
    .min(1, 'Employee ID is required')
    .describe('Employee identifier'),
  payrollId: z
    .string()
    .min(1, 'Payroll ID is required')
    .describe('Payroll identifier'),
  walletAddress: z
    .string()
    .regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar wallet address format')
    .describe('Employee wallet address for receiving payment'),
});

// Export types for TypeScript
export type Employee = z.infer<typeof EmployeeSchema>;
export type UploadPayrollRequest = z.infer<typeof UploadPayrollSchema>;
export type ClaimPayRequest = z.infer<typeof ClaimPaySchema>;

// Export schemas
export { EmployeeSchema, UploadPayrollSchema, ClaimPaySchema };
