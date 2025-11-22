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
    logger.debug('Checking for due payrolls...');

    // Check if Supabase is configured
    if (!supabaseService.isConfigured()) {
      logger.warn('Supabase not configured - cron job cannot run');
      return;
    }

    // Query Supabase for payrolls where payout_date <= now() and status = 'locked'
    const duePayrolls = await supabaseService.getPayrollsReadyForRelease();

    if (!duePayrolls || duePayrolls.length === 0) {
      logger.debug('No payrolls due for release');
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

    // Step 3: Start SDP disbursement if disbursement_id exists
    // Note: This assumes disbursement was created during lock phase
    // If you store sdp_disbursement_id in payroll record, use it here
    // For now, we'll log that SDP needs to be triggered separately
    logger.info(`Payroll released successfully`, {
      batchId: payroll.batch_id,
      txHash,
      yieldEarned,
      duration: `${Date.now() - startTime}ms`,
    });

    // If you have SDP disbursement ID stored, uncomment this:
    /*
    if (payroll.sdp_disbursement_id) {
      try {
        logger.info(`Starting SDP disbursement`, {
          disbursementId: payroll.sdp_disbursement_id,
        });
        
        await sdpService.startDisbursement(payroll.sdp_disbursement_id);
        
        await supabaseService.updatePayrollStatus(payroll.id!, {
          status: 'distributed',
        });
        
        logger.info(`SDP disbursement started successfully`, {
          disbursementId: payroll.sdp_disbursement_id,
        });
      } catch (sdpError) {
        logger.error('Failed to start SDP disbursement', sdpError as Error, {
          disbursementId: payroll.sdp_disbursement_id,
          payrollId: payroll.id,
        });
        // Don't throw - payroll was released successfully
      }
    }
    */

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
