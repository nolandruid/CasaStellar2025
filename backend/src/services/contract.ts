/**
 * Smart Contract Interaction Service
 * Handles all interactions with the PayDay Yield Soroban contract
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { rpc } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG, PAYDAY_YIELD_CONTRACT_ID, ADMIN_SECRET_KEY, TOKEN_ADDRESS, FINDEX_POOL_ADDRESS, SDP_CONFIG } from '../config/constants';
import sdpService from './sdp';

const {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Keypair,
  nativeToScVal,
  scValToNative,
  Address,
  Soroban,
  Horizon,
} = StellarSdk;

// Initialize Soroban RPC Server
const sorobanServer = new rpc.Server(STELLAR_CONFIG.SOROBAN_RPC_URL);

// Initialize Horizon Server for account operations
const horizonServer = new Horizon.Server(STELLAR_CONFIG.HORIZON_URL);

// Initialize contract
const contract = new Contract(PAYDAY_YIELD_CONTRACT_ID);

// Admin keypair for signing transactions
let adminKeypair: Keypair | null = null;
if (ADMIN_SECRET_KEY) {
  try {
    adminKeypair = Keypair.fromSecret(ADMIN_SECRET_KEY);
  } catch (error) {
    console.warn('⚠️  Invalid ADMIN_SECRET_KEY in environment');
  }
}

interface PayrollLock {
  employer: string;
  total_amount: string;
  vault_shares: string;
  lock_date: number;
  payout_date: number;
  yield_earned: string;
  funds_released: boolean;
  yield_claimed: boolean;
}

/**
 * Helper: Build and submit a transaction
 */
async function buildAndSubmitTransaction(
  operation: any,
  memo?: string
): Promise<string> {
  if (!adminKeypair) {
    throw new Error('Admin keypair not configured. Set ADMIN_SECRET_KEY in .env');
  }

  // Get account
  const account = await horizonServer.loadAccount(adminKeypair.publicKey());

  // Build transaction
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // Simulate transaction first
  const simulated = await sorobanServer.simulateTransaction(transaction);
  
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  // Assemble the transaction with auth
  const assembled = rpc.assembleTransaction(transaction, simulated).build();

  // Sign transaction
  assembled.sign(adminKeypair);

  // Submit transaction
  const result = await sorobanServer.sendTransaction(assembled);

  if (result.status === 'PENDING') {
    // Poll for result
    let getResponse = await sorobanServer.getTransaction(result.hash);
    
    while (getResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await sorobanServer.getTransaction(result.hash);
    }

    if (getResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return result.hash;
    } else {
      throw new Error(`Transaction failed: ${getResponse.status}`);
    }
  }

  return result.hash;
}

/**
 * Lock payroll funds in the contract and deposit to DeFindex
 * @param employerAddress - Employer's Stellar address
 * @param totalAmount - Total amount to lock (in stroops)
 * @param payoutDate - Unix timestamp for payout date
 * @returns Object with transaction hash and batch_id
 */
export async function lockPayroll(
  employerAddress: string,
  totalAmount: bigint,
  payoutDate: number
): Promise<{ txHash: string; batchId: string }> {
  try {
    console.log('🔒 Locking payroll...');
    console.log(`   Employer: ${employerAddress}`);
    console.log(`   Amount: ${totalAmount}`);
    console.log(`   Payout Date: ${new Date(payoutDate * 1000).toISOString()}`);

    if (!TOKEN_ADDRESS) {
      throw new Error('TOKEN_ADDRESS not configured in environment');
    }

    // Build contract call (updated to new signature without token parameter)
    const employerScVal = employerAddress.startsWith('G')
      ? nativeToScVal(Keypair.fromPublicKey(employerAddress).publicKey(), { type: 'address' })
      : new Address(employerAddress).toScVal();
    
    const operation = contract.call(
      'lock_payroll',
      employerScVal,
      nativeToScVal(totalAmount, { type: 'i128' }),
      nativeToScVal(payoutDate, { type: 'u64' })
    );

    const txHash = await buildAndSubmitTransaction(operation);
    
    // Get the batch_id from transaction result
    const tx = await sorobanServer.getTransaction(txHash);
    let batchId = '0';
    
    if (tx.status === Soroban.Api.GetTransactionStatus.SUCCESS && tx.returnValue) {
      batchId = scValToNative(tx.returnValue).toString();
    }
    
    console.log(`✅ Payroll locked. TX: ${txHash}, Batch ID: ${batchId}`);
    
    return { txHash, batchId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to lock payroll:', errorMessage);
    throw error;
  }
}

/**
 * Release funds to SDP (Stellar Disbursement Platform) for employee distribution
 * Withdraws from DeFindex vault and sends principal to SDP wallet
 * @param employerAddress - Employer's Stellar address
 * @param batchId - Batch ID from lock_payroll
 * @returns Object with transaction hash and yield earned
 */
export async function releaseToSDP(
  employerAddress: string,
  batchId: string
): Promise<{ txHash: string; yieldEarned: string }> {
  try {
    console.log('🚀 Releasing payroll to SDP...');
    console.log(`   Employer: ${employerAddress}`);
    console.log(`   Batch ID: ${batchId}`);

    const sdpWalletAddress = SDP_CONFIG.WALLET_ADDRESS;
    
    if (!sdpWalletAddress) {
      throw new Error('SDP_WALLET_ADDRESS not configured in environment');
    }

    // Build contract call (updated to new signature)
    const employerScVal = employerAddress.startsWith('G')
      ? nativeToScVal(Keypair.fromPublicKey(employerAddress).publicKey(), { type: 'address' })
      : new Address(employerAddress).toScVal();
    const sdpWalletScVal = sdpWalletAddress.startsWith('G')
      ? nativeToScVal(Keypair.fromPublicKey(sdpWalletAddress).publicKey(), { type: 'address' })
      : new Address(sdpWalletAddress).toScVal();
    
    const operation = contract.call(
      'release_to_sdp',
      employerScVal,
      nativeToScVal(BigInt(batchId), { type: 'u64' }),
      sdpWalletScVal
    );

    const txHash = await buildAndSubmitTransaction(operation);
    
    // Get the yield earned from transaction result
    const tx = await sorobanServer.getTransaction(txHash);
    let yieldEarned = '0';
    
    if (tx.status === Soroban.Api.GetTransactionStatus.SUCCESS && tx.returnValue) {
      yieldEarned = scValToNative(tx.returnValue).toString();
    }

    console.log(`✅ Payroll released to SDP. TX: ${txHash}`);
    console.log(`   Yield Earned: ${yieldEarned}`);
    
    return { txHash, yieldEarned };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to release payroll to SDP:', errorMessage);
    throw error;
  }
}

/**
 * Get current payroll lock status from contract
 * @param employerAddress - Employer's Stellar address
 * @param batchId - Batch ID from lock_payroll
 * @returns PayrollLock object with current state
 */
export async function getPayrollStatus(employerAddress: string, batchId: string): Promise<PayrollLock> {
  try {
    console.log('📊 Fetching payroll status...');
    console.log(`   Employer: ${employerAddress}`);
    console.log(`   Batch ID: ${batchId}`);

    // Build contract call (read-only) with new signature
    const employerScVal = employerAddress.startsWith('G')
      ? nativeToScVal(Keypair.fromPublicKey(employerAddress).publicKey(), { type: 'address' })
      : new Address(employerAddress).toScVal();
    
    const operation = contract.call(
      'get_status',
      employerScVal,
      nativeToScVal(BigInt(batchId), { type: 'u64' })
    );

    if (!adminKeypair) {
      throw new Error('Admin keypair not configured');
    }

    const account = await horizonServer.loadAccount(adminKeypair.publicKey());

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate to get result (no need to submit for read-only)
    const simulated = await sorobanServer.simulateTransaction(transaction);
    
    if (Soroban.Api.isSimulationError(simulated)) {
      throw new Error(`Failed to get status: ${simulated.error}`);
    }

    if (!simulated.result) {
      throw new Error('No result returned from contract');
    }

    // Parse result
    const result = scValToNative(simulated.result.retval);
    
    console.log('✅ Payroll status retrieved');
    
    return {
      employer: result.employer,
      total_amount: result.total_amount.toString(),
      vault_shares: result.vault_shares?.toString() || '0',
      lock_date: result.lock_date,
      payout_date: result.payout_date,
      yield_earned: result.yield_earned.toString(),
      funds_released: result.funds_released,
      yield_claimed: result.yield_claimed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to get payroll status:', errorMessage);
    throw error;
  }
}

/**
 * Employer claims their 100% yield share
 * @param employerAddress - Employer's Stellar address
 * @returns Object with transaction hash and employer share amount
 */
export async function claimYield(
  employerAddress: string
): Promise<{ txHash: string; employerShare: string }> {
  try {
    console.log('💰 Claiming employer yield...');
    console.log(`   Employer: ${employerAddress}`);

    if (!TOKEN_ADDRESS) {
      throw new Error('TOKEN_ADDRESS not configured in environment');
    }

    // Build contract call
    const employerScVal = employerAddress.startsWith('G')
      ? nativeToScVal(Keypair.fromPublicKey(employerAddress).publicKey(), { type: 'address' })
      : new Address(employerAddress).toScVal();
    const tokenScVal = TOKEN_ADDRESS.startsWith('G')
      ? nativeToScVal(Keypair.fromPublicKey(TOKEN_ADDRESS).publicKey(), { type: 'address' })
      : new Address(TOKEN_ADDRESS).toScVal();
    
    const operation = contract.call(
      'claim_yield',
      employerScVal,
      tokenScVal
    );

    const txHash = await buildAndSubmitTransaction(operation);
    
    // Get the employer share from transaction result
    const tx = await sorobanServer.getTransaction(txHash);
    let employerShare = '0';
    
    if (tx.status === Soroban.Api.GetTransactionStatus.SUCCESS && tx.returnValue) {
      employerShare = scValToNative(tx.returnValue).toString();
    }

    console.log(`✅ Yield claimed. TX: ${txHash}`);
    console.log(`   Employer Share (100%): ${employerShare}`);
    
    return { txHash, employerShare };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to claim yield:', errorMessage);
    throw error;
  }
}

/**
 * Calculate current yield (real-time, no transaction needed)
 * @returns Current yield amount as string
 */
export async function calculateCurrentYield(): Promise<string> {
  try {
    console.log('📈 Calculating current yield...');

    const operation = contract.call('calculate_current_yield');

    if (!adminKeypair) {
      throw new Error('Admin keypair not configured');
    }

    const account = await horizonServer.loadAccount(adminKeypair.publicKey());

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate to get result
    const simulated = await sorobanServer.simulateTransaction(transaction);
    
    if (Soroban.Api.isSimulationError(simulated)) {
      throw new Error(`Failed to calculate yield: ${simulated.error}`);
    }

    if (!simulated.result) {
      throw new Error('No result returned from contract');
    }

    const currentYield = scValToNative(simulated.result.retval).toString();
    
    console.log(`✅ Current yield: ${currentYield}`);
    
    return currentYield;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to calculate yield:', errorMessage);
    throw error;
  }
}

/**
 * Helper: Convert stroops to decimal amount
 */
export function stroopsToAmount(stroops: string | bigint): string {
  const amount = BigInt(stroops) / BigInt(10000000); // 7 decimal places
  return amount.toString();
}

/**
 * Helper: Convert decimal amount to stroops
 */
export function amountToStroops(amount: string | number): bigint {
  const decimalAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.floor(decimalAmount * 10000000)); // 7 decimal places
}
