/**
 * Payroll API Routes
 * Handles /uploadPayroll and /claimPay endpoints
 * Uses Zod for request validation
 */

import { Request, Response, Router } from "express";
import { ZodError } from "zod";
import { ClaimPaySchema, UploadPayrollSchema } from "../schemas/payroll";
import { generateClaimId, generatePayrollId } from "../services/stellar";
import { lockPayroll, releaseToSDP, getPayrollStatus, amountToStroops } from "../services/contract";
import supabaseService from "../services/supabase";
import { checkAndReleasePayrolls } from "../workflows/payroll-sdp-workflow";

interface UploadPayrollResponse {
  success: boolean;
  message: string;
  payrollId: string;
  batchId?: string;
  employeeCount: number;
  status: string;
  timestamp: string;
  txHash?: string;
  totalAmount?: string;
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
 * GET /test-supabase
 * Test Supabase connection
 */
router.get("/test-supabase", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!supabaseService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: "Supabase not configured",
        message: "SUPABASE_URL or SUPABASE_ANON_KEY missing in .env"
      });
      return;
    }

    // Try to fetch payrolls (will fail if tables don't exist or connection is bad)
    const payrolls = await supabaseService.getPayrollsReadyForRelease();
    
    res.json({
      success: true,
      message: "Supabase connection successful",
      payrollsCount: payrolls.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("❌ Supabase test failed:", error);
    res.status(500).json({
      success: false,
      error: "Supabase connection failed",
      details: error.message,
      code: error.code
    });
  }
});

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
      console.log('📥 Received payload:', JSON.stringify(req.body, null, 2));
      
      // Validate request body with Zod
      const validationResult = UploadPayrollSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error);
        console.error('❌ Validation failed:', JSON.stringify(errors, null, 2));
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors,
        } as ErrorResponse);
        return;
      }

      const { employees, employerAddress, payoutDate } = validationResult.data;

      // Generate payroll ID
      const payrollId = generatePayrollId();

      // Calculate total amount from all employees
      const totalAmount = employees.reduce((sum, emp) => {
        return sum + parseFloat(emp.amount);
      }, 0);

      // Convert to stroops (7 decimal places for Stellar)
      const totalStroops = amountToStroops(totalAmount);

      // Convert payout date to Unix timestamp if it's a string
      const payoutTimestamp = typeof payoutDate === 'string' 
        ? Math.floor(new Date(payoutDate).getTime() / 1000)
        : payoutDate;
      const payoutDateObj = typeof payoutDate === 'string'
        ? new Date(payoutDate)
        : new Date(payoutDate * 1000);

      // Lock payroll in smart contract
      let txHash: string | undefined;
      let batchId: string | undefined;
      let supabasePayrollId: string | undefined;
      let contractError: string | undefined;

      try {
        // Step 1: Lock payroll in smart contract
        const lockResult = await lockPayroll(
          employerAddress,
          totalStroops,
          payoutTimestamp
        );
        txHash = lockResult.txHash;
        batchId = lockResult.batchId;
        console.log(`✅ Contract lock successful. TX: ${txHash}, Batch: ${batchId}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Contract call failed';
        console.error('⚠️  Contract error:', errorMsg);
        contractError = errorMsg;
        // Continue to store in Supabase even if contract fails
        batchId = '0'; // Use default batch ID for failed contracts
      }

      // Step 2: Store in Supabase (always, even if contract failed)
      if (supabaseService.isConfigured()) {
        try {
          supabasePayrollId = await supabaseService.createPayroll({
            employer_address: employerAddress,
            batch_id: batchId || '0',
            total_amount: totalAmount.toString(),
            vault_shares: '0', // Will be updated when we integrate DeFindex
            lock_date: new Date(),
            payout_date: payoutDateObj,
            status: 'locked', // Always locked in DB, even if contract failed
            tx_hash_lock: txHash || 'contract_failed',
          });

          // Step 3: Store employee records
          const employeeRecords = employees.map(emp => ({
            payroll_id: supabasePayrollId!,
            stellar_address: emp.walletAddress,
            amount: emp.amount,
            status: 'pending' as const,
          }));
          await supabaseService.insertEmployees(employeeRecords);

          console.log(`✅ Payroll stored in database: ${supabasePayrollId}`);
        } catch (dbError) {
          console.error('⚠️  Failed to store in database:', dbError);
          // Continue even if database fails
        }
      }

      const response: UploadPayrollResponse = {
        success: true,
        message: "Payroll uploaded and locked in contract",
        payrollId: supabasePayrollId || payrollId,
        batchId,
        employeeCount: employees.length,
        status: "locked",
        timestamp: new Date().toISOString(),
        txHash,
        totalAmount: totalAmount.toString(),
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
/**
 * POST /releasePayroll
 * Release locked payroll to Findex for distribution (called on payday)
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
router.post("/releasePayroll", async (req: Request, res: Response): Promise<void> => {
  try {
    const { employerAddress, batchId } = req.body;

    if (!employerAddress || !batchId) {
      res.status(400).json({
        success: false,
        error: "employerAddress and batchId are required",
      } as ErrorResponse);
      return;
    }

    console.log(`🚀 Manual release triggered for batch ${batchId}`);

    // Call contract to release funds to SDP
    const result = await releaseToSDP(employerAddress, batchId);

    console.log(`✅ Contract release successful. TX: ${result.txHash}, Yield: ${result.yieldEarned}`);

    let disbursementId: string | undefined;
    let sdpError: string | undefined;

    // Update Supabase and trigger SDP if configured
    if (supabaseService.isConfigured()) {
      try {
        const payroll = await supabaseService.getPayrollByBatchId(employerAddress, batchId);
        if (payroll) {
          // Update payroll status
          await supabaseService.updatePayrollStatus(payroll.id!, {
            status: 'released',
            yield_earned: result.yieldEarned,
            tx_hash_release: result.txHash,
          });

          // Get employees and create SDP disbursement
          const employees = await supabaseService.getEmployeesByPayroll(payroll.id!);
          
          if (employees.length > 0) {
            try {
              console.log(`📤 Creating SDP disbursement for ${employees.length} employees`);

              // Convert employees to SDP format
              const sdpEmployees = employees.map((emp, index) => ({
                id: emp.id || `emp_${index}`,
                phone: emp.stellar_address,
                amount: emp.amount,
              }));

              // Create and start SDP disbursement
              const sdpService = (await import('../services/sdp')).default;
              const disbursement = await sdpService.createDisbursement({
                name: `Payroll Batch ${batchId}`,
                wallet_id: sdpService.getWalletAddress(),
                asset_code: 'XLM',
                csv_data: sdpEmployees,
              });

              disbursementId = disbursement.id;
              console.log(`✅ SDP disbursement created: ${disbursementId}`);

              // Start the disbursement
              await sdpService.startDisbursement(disbursementId);
              console.log(`✅ SDP disbursement started`);

              // Update status to distributed
              await supabaseService.updatePayrollStatus(payroll.id!, {
                status: 'distributed',
              });

              // Record SDP upload
              await supabaseService.createSDPUpload({
                payroll_id: payroll.id!,
                sdp_response: {
                  disbursement_id: disbursementId,
                  status: 'started',
                  total_payments: disbursement.total_payments,
                },
                upload_status: 'success',
              });
            } catch (sdpErr) {
              const errMsg = sdpErr instanceof Error ? sdpErr.message : 'Unknown SDP error';
              console.error('⚠️  SDP disbursement failed:', errMsg);
              sdpError = errMsg;

              // Record SDP failure
              await supabaseService.createSDPUpload({
                payroll_id: payroll.id!,
                sdp_response: { error: errMsg },
                upload_status: 'failed',
              });
            }
          }
        }
      } catch (dbError) {
        console.error('⚠️  Failed to update database:', dbError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payroll released successfully",
      txHash: result.txHash,
      yieldEarned: result.yieldEarned,
      disbursementId,
      sdpError,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /releasePayroll:", errorMessage);
    res.status(500).json({
      success: false,
      error: "Failed to release payroll",
      details: { error: [errorMessage] },
    } as ErrorResponse);
  }
});

/**
 * GET /getStatus
 * Get current payroll lock status from contract
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
router.get("/getStatus", async (req: Request, res: Response): Promise<void> => {
  try {
    const { employerAddress, batchId } = req.query;

    if (!employerAddress || !batchId) {
      res.status(400).json({
        success: false,
        error: "employerAddress and batchId query parameters are required",
      } as ErrorResponse);
      return;
    }

    // Query contract for current status
    const status = await getPayrollStatus(employerAddress as string, batchId as string);

    // Convert BigInt values to strings for JSON serialization
    const serializedStatus = {
      employer: status.employer,
      total_amount: status.total_amount.toString(),
      vault_shares: status.vault_shares.toString(),
      lock_date: Number(status.lock_date),
      payout_date: Number(status.payout_date),
      yield_earned: status.yield_earned.toString(),
      funds_released: status.funds_released,
      yield_claimed: status.yield_claimed,
      tx_hash_lock: undefined as string | undefined,
      tx_hash_release: undefined as string | undefined,
    };

    // Fetch transaction hashes from Supabase if available
    if (supabaseService.isConfigured()) {
      try {
        const payroll = await supabaseService.getPayrollByBatchId(employerAddress as string, batchId as string);
        if (payroll) {
          serializedStatus.tx_hash_lock = payroll.tx_hash_lock || undefined;
          serializedStatus.tx_hash_release = payroll.tx_hash_release || undefined;
        }
      } catch (dbError) {
        console.warn('⚠️  Could not fetch transaction hashes from database:', dbError);
        // Continue without transaction hashes
      }
    }

    res.status(200).json({
      success: true,
      data: serializedStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /getStatus:", errorMessage);
    res.status(500).json({
      success: false,
      error: "Failed to get payroll status",
      details: { error: [errorMessage] },
    } as ErrorResponse);
  }
});

/**
 * GET /calculateYield
 * Calculate current yield for a payroll batch (real-time, no transaction)
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
router.get("/calculateYield", async (req: Request, res: Response): Promise<void> => {
  try {
    const { employerAddress, batchId } = req.query;

    if (!employerAddress || !batchId) {
      res.status(400).json({
        success: false,
        error: "employerAddress and batchId query parameters are required",
      } as ErrorResponse);
      return;
    }

    // Get status first to get lock date and payout date
    const status = await getPayrollStatus(employerAddress as string, batchId as string);
    
    // Calculate current yield (this is a simulation, no transaction)
    // Note: The contract's calculate_current_yield might need employer and batch_id parameters
    // For now, we'll use the status to calculate elapsed time
    const currentTime = Math.floor(Date.now() / 1000);
    const elapsedTime = currentTime - Number(status.lock_date);
    
    res.status(200).json({
      success: true,
      data: {
        currentYield: status.yield_earned.toString(),
        elapsedTime,
        lockDate: Number(status.lock_date),
        payoutDate: Number(status.payout_date),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /calculateYield:", errorMessage);
    res.status(500).json({
      success: false,
      error: "Failed to calculate yield",
      details: { error: [errorMessage] },
    } as ErrorResponse);
  }
});

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

/**
 * POST /checkAndRelease
 * Manually trigger automated check for payrolls ready to release
 * (For testing - in production this should be a cron job)
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
router.post("/checkAndRelease", async (req: Request, res: Response): Promise<void> => {
  try {
    await checkAndReleasePayrolls();
    res.status(200).json({
      success: true,
      message: "Automated check complete",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /checkAndRelease:", errorMessage);
    res.status(500).json({
      success: false,
      error: "Failed to check and release payrolls",
      details: { error: [errorMessage] },
    } as ErrorResponse);
  }
});

export default router;
