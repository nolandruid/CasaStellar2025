/**
 * Complete Payroll + SDP Workflow
 * Demonstrates the full integration between Yield Contract and SDP
 */

import { lockPayroll, releaseToSDP, claimYield, getPayrollStatus } from '../services/contract';
import sdpService, { EmployeePayment } from '../services/sdp';
import supabaseService from '../services/supabase';

interface PayrollWorkflowParams {
  employerAddress: string;
  employeeCSV: string;
  totalAmount: bigint;
  payoutDate: number;
}

/**
 * Complete workflow for payroll with yield generation and SDP distribution
 * 
 * Steps:
 * 1. Parse employee CSV
 * 2. Create disbursement in SDP
 * 3. Lock payroll funds (deposits to DeFindex for yield)
 * 4. On payout date: Release to SDP wallet
 * 5. Start SDP disbursement
 * 6. Employer claims yield
 */
export async function executePayrollWithYield(params: PayrollWorkflowParams) {
  const { employerAddress, employeeCSV, totalAmount, payoutDate } = params;

  console.log('🚀 Starting Payroll + Yield + SDP Workflow');
  console.log('==========================================');

  try {
    // Step 1: Parse employee CSV
    console.log('\n📋 Step 1: Parsing employee data...');
    const employees: EmployeePayment[] = sdpService.parseEmployeeCSV(employeeCSV);
    console.log(`   Found ${employees.length} employees`);

    // Step 2: Create disbursement in SDP
    console.log('\n💼 Step 2: Creating disbursement in SDP...');
    const disbursement = await sdpService.createDisbursement({
      name: `Payroll Batch ${Date.now()}`,
      wallet_id: sdpService.getWalletAddress(),
      asset_code: 'XLM',
      csv_data: employees,
    });
    console.log(`   Disbursement created: ${disbursement.id}`);
    console.log(`   Total payments: ${disbursement.total_payments}`);

    // Step 3: Lock payroll funds (deposits to DeFindex)
    console.log('\n🔒 Step 3: Locking payroll funds...');
    const { txHash, batchId } = await lockPayroll(
      employerAddress,
      totalAmount,
      payoutDate
    );
    console.log(`   Transaction: ${txHash}`);
    console.log(`   Batch ID: ${batchId}`);
    console.log(`   Funds now earning yield in DeFindex!`);

    // Store batch_id and disbursement_id for later use
    const workflowData = {
      batchId,
      disbursementId: disbursement.id,
      employerAddress,
      payoutDate,
      totalAmount: totalAmount.toString(),
    };

    console.log('\n✅ Payroll locked successfully!');
    console.log('   Funds are now earning yield until payout date.');
    console.log(`   Payout scheduled for: ${new Date(payoutDate * 1000).toISOString()}`);

    return workflowData;
  } catch (error) {
    console.error('\n❌ Workflow failed:', error);
    throw error;
  }
}

/**
 * Release payroll on payout date
 * This should be called on or after the payout date
 */
export async function releasePayrollOnPayoutDate(
  employerAddress: string,
  batchId: string,
  disbursementId: string
) {
  console.log('\n🚀 Releasing Payroll on Payout Date');
  console.log('===================================');

  try {
    // Step 1: Check status
    console.log('\n📊 Step 1: Checking payroll status...');
    const status = await getPayrollStatus(employerAddress, batchId);
    console.log(`   Funds released: ${status.funds_released}`);
    console.log(`   Yield earned: ${status.yield_earned}`);

    if (status.funds_released) {
      console.log('   ⚠️  Funds already released!');
      return;
    }

    // Step 2: Release to SDP wallet
    console.log('\n💸 Step 2: Releasing principal to SDP...');
    const { txHash, yieldEarned } = await releaseToSDP(employerAddress, batchId);
    console.log(`   Transaction: ${txHash}`);
    console.log(`   Yield earned: ${yieldEarned}`);
    console.log(`   Principal sent to SDP wallet!`);

    // Step 2.5: Update Supabase
    if (supabaseService.isConfigured()) {
      const payroll = await supabaseService.getPayrollByBatchId(employerAddress, batchId);
      if (payroll) {
        await supabaseService.updatePayrollStatus(payroll.id!, {
          status: 'released',
          yield_earned: yieldEarned,
          tx_hash_release: txHash,
        });
      }
    }

    // Step 3: Start SDP disbursement
    console.log('\n📤 Step 3: Starting SDP disbursement...');
    let sdpUploadId: string | undefined;
    try {
      await sdpService.startDisbursement(disbursementId);
      console.log(`   Disbursement started!`);
      console.log(`   Employees will receive payments shortly.`);

      // Record SDP upload success
      if (supabaseService.isConfigured()) {
        const payroll = await supabaseService.getPayrollByBatchId(employerAddress, batchId);
        if (payroll) {
          sdpUploadId = await supabaseService.createSDPUpload({
            payroll_id: payroll.id!,
            sdp_response: { disbursement_id: disbursementId, status: 'started' },
            upload_status: 'success',
          });
          await supabaseService.updatePayrollStatus(payroll.id!, {
            status: 'distributed',
          });
        }
      }
    } catch (sdpError) {
      console.error('   ❌ SDP disbursement failed:', sdpError);
      // Record SDP upload failure
      if (supabaseService.isConfigured()) {
        const payroll = await supabaseService.getPayrollByBatchId(employerAddress, batchId);
        if (payroll) {
          await supabaseService.createSDPUpload({
            payroll_id: payroll.id!,
            sdp_response: { error: sdpError instanceof Error ? sdpError.message : 'Unknown error' },
            upload_status: 'failed',
          });
        }
      }
      throw sdpError;
    }

    console.log('\n✅ Payroll released successfully!');
    console.log(`   Yield earned: ${yieldEarned}`);
    console.log(`   Employer can now claim yield.`);

    return { txHash, yieldEarned };
  } catch (error) {
    console.error('\n❌ Release failed:', error);
    throw error;
  }
}

/**
 * Employer claims their yield
 */
export async function employerClaimYield(
  employerAddress: string,
  batchId: string
) {
  console.log('\n💰 Employer Claiming Yield');
  console.log('==========================');

  try {
    const { txHash, employerShare } = await claimYield(employerAddress);
    console.log(`   Transaction: ${txHash}`);
    console.log(`   Yield claimed: ${employerShare}`);
    console.log('\n✅ Yield claimed successfully!');

    return { txHash, employerShare };
  } catch (error) {
    console.error('\n❌ Claim failed:', error);
    throw error;
  }
}

/**
 * Get SDP disbursement status
 */
export async function checkDisbursementStatus(disbursementId: string) {
  console.log('\n📊 Checking Disbursement Status');
  console.log('===============================');

  try {
    const status = await sdpService.getDisbursementStatus(disbursementId);
    console.log(`   Status: ${status.status}`);
    console.log(`   Total amount: ${status.total_amount}`);
    console.log(`   Total payments: ${status.total_payments}`);

    return status;
  } catch (error) {
    console.error('\n❌ Status check failed:', error);
    throw error;
  }
}

/**
 * Automated cron job to check and release payrolls
 * Should be run periodically (e.g., every hour)
 */
export async function checkAndReleasePayrolls() {
  console.log('\n⏰ Checking for payrolls ready to release...');
  console.log('============================================');

  if (!supabaseService.isConfigured()) {
    console.log('⚠️  Supabase not configured. Skipping automated checks.');
    return;
  }

  try {
    // Get all payrolls ready for release
    const payrolls = await supabaseService.getPayrollsReadyForRelease();
    console.log(`Found ${payrolls.length} payroll(s) ready for release`);

    for (const payroll of payrolls) {
      console.log(`\n📦 Processing payroll ${payroll.batch_id}...`);
      console.log(`   Employer: ${payroll.employer_address}`);
      console.log(`   Amount: ${payroll.total_amount}`);
      console.log(`   Payout date: ${payroll.payout_date}`);

      try {
        // Release to SDP
        const { txHash, yieldEarned } = await releaseToSDP(
          payroll.employer_address,
          payroll.batch_id
        );

        // Update status
        await supabaseService.updatePayrollStatus(payroll.id!, {
          status: 'released',
          yield_earned: yieldEarned,
          tx_hash_release: txHash,
        });

        console.log(`   ✅ Released! TX: ${txHash}`);
        console.log(`   Yield earned: ${yieldEarned}`);

        // TODO: Trigger SDP disbursement if you have disbursement_id stored
        // For now, this needs to be done manually or via separate endpoint
      } catch (releaseError) {
        console.error(`   ❌ Failed to release payroll ${payroll.batch_id}:`, releaseError);
        // Continue with next payroll
      }
    }

    console.log('\n✅ Automated check complete');
  } catch (error) {
    console.error('\n❌ Automated check failed:', error);
    throw error;
  }
}
