/**
 * Smart Contract Interaction Service
 * Handles all interactions with the PayDay Yield Soroban contract
 */

import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Keypair,
  Operation,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import { STELLAR_CONFIG, PAYDAY_YIELD_CONTRACT_ID, ADMIN_SECRET_KEY, TOKEN_ADDRESS, FINDEX_POOL_ADDRESS } from '../config/constants';

// Initialize Soroban RPC Server
const server = new SorobanRpc.Server(STELLAR_CONFIG.SOROBAN_RPC_URL);

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
  operation: Operation,
  memo?: string
): Promise<string> {
  if (!adminKeypair) {
    throw new Error('Admin keypair not configured. Set ADMIN_SECRET_KEY in .env');
  }

  // Get account
  const account = await server.getAccount(adminKeypair.publicKey());

  // Build transaction
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // Simulate transaction first
  const simulated = await server.simulateTransaction(transaction);
  
  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  // Prepare transaction
  const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build();

  // Sign transaction
  prepared.sign(adminKeypair);

  // Submit transaction
  const result = await server.sendTransaction(prepared);

  if (result.status === 'PENDING') {
    // Poll for result
    let getResponse = await server.getTransaction(result.hash);
    
    while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(result.hash);
    }

    if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return result.hash;
    } else {
      throw new Error(`Transaction failed: ${getResponse.status}`);
    }
  }

  return result.hash;
}

/**
 * Lock payroll funds in the contract
 * @param employerAddress - Employer's Stellar address
 * @param totalAmount - Total amount to lock (in stroops)
 * @param payoutDate - Unix timestamp for payout date
 * @returns Transaction hash
 */
export async function lockPayroll(
  employerAddress: string,
  totalAmount: bigint,
  payoutDate: number
): Promise<string> {
  try {
    console.log('🔒 Locking payroll...');
    console.log(`   Employer: ${employerAddress}`);
    console.log(`   Amount: ${totalAmount}`);
    console.log(`   Payout Date: ${new Date(payoutDate * 1000).toISOString()}`);

    if (!TOKEN_ADDRESS) {
      throw new Error('TOKEN_ADDRESS not configured in environment');
    }

    // Build contract call
    const operation = contract.call(
      'lock_payroll',
      nativeToScVal(employerAddress, { type: 'address' }),
      nativeToScVal(TOKEN_ADDRESS, { type: 'address' }),
      nativeToScVal(totalAmount, { type: 'i128' }),
      nativeToScVal(payoutDate, { type: 'u64' })
    );

    const txHash = await buildAndSubmitTransaction(operation);
    console.log(`✅ Payroll locked. TX: ${txHash}`);
    
    return txHash;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to lock payroll:', errorMessage);
    throw error;
  }
}

/**
 * Release funds to Findex for distribution
 * @param findexAddress - Findex pool address (or employee distribution address)
 * @returns Object with transaction hash and yield earned
 */
export async function releaseToFindex(
  findexAddress?: string
): Promise<{ txHash: string; yieldEarned: string }> {
  try {
    console.log('🚀 Releasing payroll to Findex...');

    const targetAddress = findexAddress || FINDEX_POOL_ADDRESS;
    
    if (!targetAddress) {
      throw new Error('Findex address not provided and FINDEX_POOL_ADDRESS not configured');
    }

    if (!TOKEN_ADDRESS) {
      throw new Error('TOKEN_ADDRESS not configured in environment');
    }

    // Build contract call
    const operation = contract.call(
      'release_to_findex',
      nativeToScVal(targetAddress, { type: 'address' }),
      nativeToScVal(TOKEN_ADDRESS, { type: 'address' })
    );

    const txHash = await buildAndSubmitTransaction(operation);
    
    // Get the yield earned from transaction result
    const tx = await server.getTransaction(txHash);
    let yieldEarned = '0';
    
    if (tx.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS && tx.returnValue) {
      yieldEarned = scValToNative(tx.returnValue).toString();
    }

    console.log(`✅ Payroll released. TX: ${txHash}`);
    console.log(`   Yield Earned: ${yieldEarned}`);
    
    return { txHash, yieldEarned };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to release payroll:', errorMessage);
    throw error;
  }
}

/**
 * Get current payroll lock status from contract
 * @returns PayrollLock object with current state
 */
export async function getPayrollStatus(): Promise<PayrollLock> {
  try {
    console.log('📊 Fetching payroll status...');

    // Build contract call (read-only)
    const operation = contract.call('get_status');

    if (!adminKeypair) {
      throw new Error('Admin keypair not configured');
    }

    const account = await server.getAccount(adminKeypair.publicKey());

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate to get result (no need to submit for read-only)
    const simulated = await server.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulated)) {
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
 * Employer claims their 30% yield share
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
    const operation = contract.call(
      'claim_yield',
      nativeToScVal(employerAddress, { type: 'address' }),
      nativeToScVal(TOKEN_ADDRESS, { type: 'address' })
    );

    const txHash = await buildAndSubmitTransaction(operation);
    
    // Get the employer share from transaction result
    const tx = await server.getTransaction(txHash);
    let employerShare = '0';
    
    if (tx.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS && tx.returnValue) {
      employerShare = scValToNative(tx.returnValue).toString();
    }

    console.log(`✅ Yield claimed. TX: ${txHash}`);
    console.log(`   Employer Share (30%): ${employerShare}`);
    
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

    const account = await server.getAccount(adminKeypair.publicKey());

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate to get result
    const simulated = await server.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulated)) {
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
