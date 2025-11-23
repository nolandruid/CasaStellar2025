/**
 * Cron Service for Automatic Payroll Releases
 * Checks Supabase every 10 seconds for payrolls that are due for release
 * and automatically triggers releaseToSDP() + startDisbursement()
 */

import logger from '../utils/logger';
import supabaseService, { PayrollRecord } from './supabase';
import { releaseToSDP } from './contract';
import sdpService from './sdp';

let cronInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Check for payrolls that are due for release
 * Runs every 10 seconds
 */
async function checkDuePayrolls(): Promise<void> {
  // Prevent overlapping executions
  if (isProcessing) {
    logger.debug('Cron job already processing, skipping this cycle');
    return;
  }

  try {
    isProcessing = true;
    logger.info('🔍 Checking for due payrolls...');

    // Check if Supabase is configured
    if (!supabaseService.isConfigured()) {
      logger.warn('Supabase not configured - cron job cannot run');
      return;
    }

    // Query Supabase for payrolls where payout_date <= now() and status = 'locked'
    const duePayrolls = await supabaseService.getPayrollsReadyForRelease();

    if (!duePayrolls || duePayrolls.length === 0) {
      logger.info('No payrolls due for release');
      return;
    }

    logger.info(`Found ${duePayrolls.length} payroll(s) due for release`, {
      count: duePayrolls.length,
    });

    // Process each due payroll
    for (const payroll of duePayrolls) {
      await processPayrollRelease(payroll);
    }

    logger.info('Cron cycle completed successfully', {
      processed: duePayrolls.length,
    });
  } catch (error) {
    logger.error('Cron job error', error as Error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Process a single payroll release
 */
async function processPayrollRelease(payroll: PayrollRecord): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info(`Processing payroll release`, {
      payrollId: payroll.id,
      batchId: payroll.batch_id,
      employerAddress: payroll.employer_address,
      totalAmount: payroll.total_amount,
      payoutDate: payroll.payout_date,
    });

    // Step 1: Call contract to release funds to SDP
    logger.info(`Calling releaseToSDP for batch ${payroll.batch_id}`);
    
    const { txHash, yieldEarned } = await releaseToSDP(
      payroll.employer_address,
      payroll.batch_id.toString()
    );

    logger.info(`Contract release successful`, {
      batchId: payroll.batch_id,
      txHash,
      yieldEarned,
    });

    // Step 2: Update payroll status in Supabase
    await supabaseService.updatePayrollStatus(payroll.id!, {
      status: 'released',
      yield_earned: yieldEarned,
      tx_hash_release: txHash,
    });

    logger.info(`Payroll status updated to 'released'`, {
      payrollId: payroll.id,
    });

    // Step 3: Create and start SDP disbursement
    try {
      // Get employee records for this payroll
      const employees = await supabaseService.getEmployeesByPayroll(payroll.id!);
      
      if (employees.length === 0) {
        logger.warn(`No employees found for payroll ${payroll.id}`, {
          payrollId: payroll.id,
          batchId: payroll.batch_id,
        });
      } else {
        logger.info(`Creating SDP disbursement for ${employees.length} employees`, {
          payrollId: payroll.id,
          employeeCount: employees.length,
        });

        // Convert employees to SDP format
        const sdpEmployees = employees.map((emp, index) => ({
          id: emp.id || `emp_${index}`,
          phone: emp.stellar_address, // Using stellar address as identifier
          amount: emp.amount,
        }));

        // Create SDP disbursement
        const disbursement = await sdpService.createDisbursement({
          name: `Payroll Batch ${payroll.batch_id}`,
          wallet_id: sdpService.getWalletAddress(),
          asset_code: 'XLM',
          csv_data: sdpEmployees,
        });

        logger.info(`SDP disbursement created`, {
          disbursementId: disbursement.id,
          totalPayments: disbursement.total_payments,
        });

        // Start the disbursement
        await sdpService.startDisbursement(disbursement.id);

        logger.info(`SDP disbursement started successfully`, {
          disbursementId: disbursement.id,
        });

        // Update payroll status to distributed
        await supabaseService.updatePayrollStatus(payroll.id!, {
          status: 'distributed',
        });

        // Create SDP upload record
        await supabaseService.createSDPUpload({
          payroll_id: payroll.id!,
          sdp_response: {
            disbursement_id: disbursement.id,
            status: 'started',
            total_payments: disbursement.total_payments,
          },
          upload_status: 'success',
        });

        logger.info(`Payroll fully distributed via SDP`, {
          batchId: payroll.batch_id,
          disbursementId: disbursement.id,
        });
      }
    } catch (sdpError) {
      logger.error('Failed to create/start SDP disbursement', sdpError as Error, {
        payrollId: payroll.id,
        batchId: payroll.batch_id,
      });

      // Record SDP failure but don't throw - payroll was released successfully
      if (supabaseService.isConfigured()) {
        try {
          await supabaseService.createSDPUpload({
            payroll_id: payroll.id!,
            sdp_response: {
              error: sdpError instanceof Error ? sdpError.message : 'Unknown error',
            },
            upload_status: 'failed',
          });
        } catch (recordError) {
          logger.error('Failed to record SDP error', recordError as Error);
        }
      }
    }

    logger.info(`✅ Payroll ${payroll.batch_id} released successfully!`, {
      txHash,
      yieldEarned,
      employerAddress: payroll.employer_address,
      duration: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Failed to release payroll ${payroll.batch_id}`, error as Error, {
      payrollId: payroll.id,
      batchId: payroll.batch_id,
      employerAddress: payroll.employer_address,
      duration: `${duration}ms`,
    });

    // Don't throw - continue with next payroll
    // Optionally: Update payroll with error status or retry count
  }
}

/**
 * Start the cron job
 * Checks for due payrolls every 10 seconds
 */
export function startCron(): void {
  if (cronInterval) {
    logger.warn('Cron job already running');
    return;
  }

  logger.info('Starting payroll release cron job', {
    interval: '10 seconds',
    description: 'Checks for payrolls due for automatic release',
  });

  // Run immediately on start
  checkDuePayrolls().catch((error) => {
    logger.error('Initial cron check failed', error as Error);
  });

  // Then run every 10 seconds
  cronInterval = setInterval(() => {
    checkDuePayrolls().catch((error) => {
      logger.error('Cron interval check failed', error as Error);
    });
  }, 10000); // 10 seconds

  logger.info('Cron job started successfully');
}

/**
 * Stop the cron job
 */
export function stopCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    logger.info('Cron job stopped');
  } else {
    logger.warn('Cron job was not running');
  }
}

/**
 * Get cron job status
 */
export function getCronStatus(): { running: boolean; processing: boolean } {
  return {
    running: cronInterval !== null,
    processing: isProcessing,
  };
}

// Export for testing
export { checkDuePayrolls, processPayrollRelease };
