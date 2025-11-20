/**
 * Payroll API Routes
 * Handles /uploadPayroll and /claimPay endpoints
 * Uses Zod for request validation
 */

import { Request, Response, Router } from "express";
import { ZodError } from "zod";
import { ClaimPaySchema, UploadPayrollSchema } from "../schemas/payroll";
import { generateClaimId, generatePayrollId } from "../services/stellar";

interface UploadPayrollResponse {
  success: boolean;
  message: string;
  payrollId: string;
  employeeCount: number;
  status: string;
  timestamp: string;
}

interface ErrorResponse {
  success: boolean;
  error: string;
  details?: Record<string, string[]>;
}

interface ClaimPayResponse {
  success: boolean;
  message: string;
  claimId: string;
  employeeId: string;
  payrollId: string;
  status: string;
  timestamp: string;
}

const router = Router();

/**
 * Format Zod validation errors
 */
function formatZodErrors(error: ZodError<unknown>): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    const key = path || "root";
    if (!formatted[key]) {
      formatted[key] = [];
    }
    formatted[key].push(issue.message);
  });
  return formatted;
}

/**
 * POST /uploadPayroll
 * Upload payroll information for employees
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
router.post(
  "/uploadPayroll",
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body with Zod
      const validationResult = UploadPayrollSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error);
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors,
        } as ErrorResponse);
        return;
      }

      const { employees } = validationResult.data;

      // Generate payroll ID
      const payrollId = generatePayrollId();

      // TODO: In future implementation:
      // 1. Store payroll data in database
      // 2. Prepare Soroban contract invocation
      // 3. Execute transaction on Stellar testnet
      // 4. Return transaction hash

      const response: UploadPayrollResponse = {
        success: true,
        message: "Payroll uploaded successfully",
        payrollId,
        employeeCount: employees.length,
        status: "uploaded",
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error in /uploadPayroll:", errorMessage);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: { error: [errorMessage] },
      } as ErrorResponse);
    }
  }
);

/**
 * POST /claimPay
 * Employee claims their payment
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
router.post("/claimPay", async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body with Zod
    const validationResult = ClaimPaySchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error);
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      } as ErrorResponse);
      return;
    }

    const { employeeId, payrollId, walletAddress } = validationResult.data;

    // Generate claim ID
    const claimId = generateClaimId();

    // TODO: In future implementation:
    // 1. Verify payroll exists and employee is in it
    // 2. Check if employee already claimed this payroll
    // 3. Invoke Soroban contract to process payment
    // 4. Handle transaction response
    // 5. Update claim status to 'success' or 'failed'

    const response: ClaimPayResponse = {
      success: true,
      message: "Payment claim initiated",
      claimId,
      employeeId,
      payrollId,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /claimPay:", errorMessage);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: { error: [errorMessage] },
    } as ErrorResponse);
  }
});

export default router;
