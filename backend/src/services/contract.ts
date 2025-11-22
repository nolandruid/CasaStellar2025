/**
 * Smart Contract Interaction Service
 * Handles all interactions with the PayDay Yield Soroban contract
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { rpc } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG, PAYDAY_YIELD_CONTRACT_ID, ADMIN_SECRET_KEY, TOKEN_ADDRESS, FINDEX_POOL_ADDRESS, SDP_CONFIG } from '../config/constants';
import sdpService from './sdp';
import logger from '../utils/logger';
import {
  ContractError,
  TransactionFailedError,
  SimulationFailedError,
  HorizonError,
  SorobanError,
  parseStellarError,
  ValidationError,
} from '../utils/errors';

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
let adminKeypair: StellarSdk.Keypair | null = null;
if (ADMIN_SECRET_KEY) {
  try {
    adminKeypair = Keypair.fromSecret(ADMIN_SECRET_KEY);
    logger.info('Admin keypair initialized successfully');
  } catch (error) {
    logger.warn('Invalid ADMIN_SECRET_KEY in environment', {
      error: (error as Error).message,
    });
  }
} else {
  logger.warn('ADMIN_SECRET_KEY not configured - contract operations will fail');
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
  const startTime = Date.now();
  
  try {
    if (!adminKeypair) {
      logger.error('Admin keypair not configured');
      throw new ContractError('Admin keypair not configured. Set ADMIN_SECRET_KEY in .env', {
        configMissing: 'ADMIN_SECRET_KEY',
      });
    }

    logger.debug('Loading account from Horizon', {
      publicKey: adminKeypair.publicKey(),
    });

    // Get account
    let account;
    try {
      account = await horizonServer.loadAccount(adminKeypair.publicKey());
    } catch (error) {
      logger.error('Failed to load account from Horizon', error as Error, {
        publicKey: adminKeypair.publicKey(),
      });
      throw new HorizonError('Failed to load account from network', {
        publicKey: adminKeypair.publicKey(),
        originalError: (error as Error).message,
      });
    }

    logger.debug('Building transaction');

    // Build transaction
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    logger.debug('Simulating transaction');

    // Simulate transaction first
    let simulated;
    try {
      simulated = await sorobanServer.simulateTransaction(transaction);
    } catch (error) {
      logger.error('Transaction simulation request failed', error as Error);
      throw new SorobanError('Failed to simulate transaction', {
        originalError: (error as Error).message,
      });
    }
    
    if (rpc.Api.isSimulationError(simulated)) {
      logger.error('Transaction simulation failed', undefined, {
        error: simulated.error,
      });
      throw new SimulationFailedError(`Simulation failed: ${simulated.error}`, {
        simulationError: simulated.error,
      });
    }

    logger.debug('Assembling transaction with simulation result');

    // Assemble the transaction with auth
    const assembled = rpc.assembleTransaction(transaction, simulated).build();

    // Sign transaction
    assembled.sign(adminKeypair);

    logger.debug('Submitting transaction to network');

    // Submit transaction
    let result;
    try {
      result = await sorobanServer.sendTransaction(assembled);
    } catch (error) {
      logger.error('Failed to send transaction', error as Error);
      throw new SorobanError('Failed to send transaction to network', {
        originalError: (error as Error).message,
      });
    }

    logger.debug('Transaction submitted, polling for result', {
      hash: result.hash,
      status: result.status,
    });

    if (result.status === 'PENDING') {
      // Poll for result
      let getResponse = await sorobanServer.getTransaction(result.hash);
      let pollAttempts = 0;
      const maxPollAttempts = 30; // 30 seconds max
      
      while (getResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
        if (pollAttempts >= maxPollAttempts) {
          logger.error('Transaction polling timeout', undefined, {
            hash: result.hash,
            attempts: pollAttempts,
          });
          throw new TransactionFailedError(
            'Transaction polling timeout - transaction not found after 30 seconds',
            result.hash,
            { attempts: pollAttempts }
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResponse = await sorobanServer.getTransaction(result.hash);
        pollAttempts++;
      }

      const duration = Date.now() - startTime;

      if (getResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        logger.info('Transaction succeeded', {
          hash: result.hash,
          duration: `${duration}ms`,
          pollAttempts,
        });
        return result.hash;
      } else {
        logger.error('Transaction failed', undefined, {
          hash: result.hash,
          status: getResponse.status,
          duration: `${duration}ms`,
        });
        throw new TransactionFailedError(
          `Transaction failed with status: ${getResponse.status}`,
          result.hash,
          { status: getResponse.status, duration }
        );
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Transaction completed', {
      hash: result.hash,
      duration: `${duration}ms`,
    });

    return result.hash;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Re-throw known errors
    if (error instanceof ContractError || error instanceof HorizonError || 
        error instanceof SorobanError || error instanceof TransactionFailedError ||
        error instanceof SimulationFailedError) {
      throw error;
    }
    
    // Parse and throw unknown errors
    logger.error('Unexpected error in buildAndSubmitTransaction', error as Error, {
      duration: `${duration}ms`,
    });
    throw parseStellarError(error);
  }
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
  const methodName = 'lockPayroll';
  
  try {
    // Validate inputs
    if (!employerAddress || employerAddress.trim() === '') {
      throw new ValidationError('Employer address is required', {
        field: 'employerAddress',
        value: employerAddress,
      });
    }

    if (totalAmount <= 0) {
      throw new ValidationError('Total amount must be greater than 0', {
        field: 'totalAmount',
        value: totalAmount.toString(),
      });
    }

    if (payoutDate <= Math.floor(Date.now() / 1000)) {
      throw new ValidationError('Payout date must be in the future', {
        field: 'payoutDate',
        value: payoutDate,
        currentTime: Math.floor(Date.now() / 1000),
      });
    }

    logger.contractStart(methodName, {
      employerAddress,
      totalAmount: totalAmount.toString(),
      payoutDate,
      payoutDateISO: new Date(payoutDate * 1000).toISOString(),
    });

    if (!TOKEN_ADDRESS) {
      logger.error('TOKEN_ADDRESS not configured');
      throw new ContractError('TOKEN_ADDRESS not configured in environment', {
        configMissing: 'TOKEN_ADDRESS',
      });
    }

    // Build contract call
    logger.debug('Building contract call for lock_payroll');
    
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
    
    logger.debug('Fetching batch ID from transaction result', { txHash });
    
    // Get the batch_id from transaction result
    let batchId = '0';
    try {
      const tx = await sorobanServer.getTransaction(txHash);
      
      if (tx.status === rpc.Api.GetTransactionStatus.SUCCESS && 'returnValue' in tx && tx.returnValue) {
        batchId = scValToNative(tx.returnValue).toString();
      } else {
        logger.warn('Could not extract batch ID from transaction', {
          txHash,
          status: tx.status,
        });
      }
    } catch (error) {
      logger.warn('Failed to fetch batch ID, using default', { 
        txHash,
        error: (error as Error).message 
      });
    }
    
    logger.contractSuccess(methodName, {
      txHash,
      batchId,
      employerAddress,
    });
    
    return { txHash, batchId };
  } catch (error) {
    logger.contractError(methodName, error as Error, {
      employerAddress,
      totalAmount: totalAmount.toString(),
      payoutDate,
    });
    
    // Re-throw if already an AppError
    if (error instanceof ValidationError || error instanceof ContractError) {
      throw error;
    }
    
    // Parse and throw
    throw parseStellarError(error);
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
  const methodName = 'releaseToSDP';
  
  try {
    // Validate inputs
    if (!employerAddress || employerAddress.trim() === '') {
      throw new ValidationError('Employer address is required', {
        field: 'employerAddress',
        value: employerAddress,
      });
    }

    if (!batchId || batchId.trim() === '') {
      throw new ValidationError('Batch ID is required', {
        field: 'batchId',
        value: batchId,
      });
    }

    logger.contractStart(methodName, {
      employerAddress,
      batchId,
    });

    const sdpWalletAddress = SDP_CONFIG.WALLET_ADDRESS;
    
    if (!sdpWalletAddress) {
      logger.error('SDP_WALLET_ADDRESS not configured');
      throw new ContractError('SDP_WALLET_ADDRESS not configured in environment', {
        configMissing: 'SDP_WALLET_ADDRESS',
      });
    }

    logger.debug('Building contract call for release_to_sdp');

    // Build contract call
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
    
    logger.debug('Fetching yield earned from transaction result', { txHash });
    
    // Get the yield earned from transaction result
    let yieldEarned = '0';
    try {
      const tx = await sorobanServer.getTransaction(txHash);
      
      if (tx.status === rpc.Api.GetTransactionStatus.SUCCESS && 'returnValue' in tx && tx.returnValue) {
        yieldEarned = scValToNative(tx.returnValue).toString();
      } else {
        logger.warn('Could not extract yield earned from transaction', {
          txHash,
          status: tx.status,
        });
      }
    } catch (error) {
      logger.warn('Failed to fetch yield earned, using default', {
        txHash,
        error: (error as Error).message,
      });
    }

    logger.contractSuccess(methodName, {
      txHash,
      yieldEarned,
      employerAddress,
      batchId,
    });
    
    return { txHash, yieldEarned };
  } catch (error) {
    logger.contractError(methodName, error as Error, {
      employerAddress,
      batchId,
    });
    
    // Re-throw if already an AppError
    if (error instanceof ValidationError || error instanceof ContractError) {
      throw error;
    }
    
    // Parse and throw
    throw parseStellarError(error);
  }
}

/**
 * Get current payroll lock status from contract
 * @param employerAddress - Employer's Stellar address
 * @param batchId - Batch ID from lock_payroll
 * @returns PayrollLock object with current state
 */
export async function getPayrollStatus(employerAddress: string, batchId: string): Promise<PayrollLock> {
  const methodName = 'getPayrollStatus';
  
  try {
    // Validate inputs
    if (!employerAddress || employerAddress.trim() === '') {
      throw new ValidationError('Employer address is required', {
        field: 'employerAddress',
        value: employerAddress,
      });
    }

    if (!batchId || batchId.trim() === '') {
      throw new ValidationError('Batch ID is required', {
        field: 'batchId',
        value: batchId,
      });
    }

    logger.contractStart(methodName, {
      employerAddress,
      batchId,
    });

    if (!adminKeypair) {
      logger.error('Admin keypair not configured');
      throw new ContractError('Admin keypair not configured', {
        configMissing: 'ADMIN_SECRET_KEY',
      });
    }

    logger.debug('Building read-only contract call for get_status');

    // Build contract call (read-only)
    const employerScVal = employerAddress.startsWith('G')
      ? nativeToScVal(Keypair.fromPublicKey(employerAddress).publicKey(), { type: 'address' })
      : new Address(employerAddress).toScVal();
    
    const operation = contract.call(
      'get_status',
      employerScVal,
      nativeToScVal(BigInt(batchId), { type: 'u64' })
    );

    let account;
    try {
      account = await horizonServer.loadAccount(adminKeypair.publicKey());
    } catch (error) {
      logger.error('Failed to load account from Horizon', error as Error);
      throw new HorizonError('Failed to load account from network', {
        publicKey: adminKeypair.publicKey(),
        originalError: (error as Error).message,
      });
    }

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    logger.debug('Simulating transaction to get status');

    // Simulate to get result (no need to submit for read-only)
    let simulated;
    try {
      simulated = await sorobanServer.simulateTransaction(transaction);
    } catch (error) {
      logger.error('Failed to simulate transaction', error as Error);
      throw new SorobanError('Failed to simulate transaction', {
        originalError: (error as Error).message,
      });
    }
    
    if (rpc.Api.isSimulationError(simulated)) {
      logger.error('Simulation failed for get_status', undefined, {
        error: simulated.error,
      });
      throw new SimulationFailedError(`Failed to get status: ${simulated.error}`, {
        simulationError: simulated.error,
      });
    }

    if (!('result' in simulated) || !simulated.result) {
      logger.error('No result returned from contract');
      throw new ContractError('No result returned from contract', {
        method: 'get_status',
      });
    }

    // Parse result
    const result = scValToNative(simulated.result.retval);
    
    const payrollLock: PayrollLock = {
      employer: result.employer,
      total_amount: result.total_amount.toString(),
      vault_shares: result.vault_shares?.toString() || '0',
      lock_date: result.lock_date,
      payout_date: result.payout_date,
      yield_earned: result.yield_earned.toString(),
      funds_released: result.funds_released,
      yield_claimed: result.yield_claimed,
    };

    logger.contractSuccess(methodName, {
      employerAddress,
      batchId,
      fundsReleased: payrollLock.funds_released,
      yieldClaimed: payrollLock.yield_claimed,
    });
    
    return payrollLock;
  } catch (error) {
    logger.contractError(methodName, error as Error, {
      employerAddress,
      batchId,
    });
    
    // Re-throw if already an AppError
    if (error instanceof ValidationError || error instanceof ContractError ||
        error instanceof HorizonError || error instanceof SorobanError ||
        error instanceof SimulationFailedError) {
      throw error;
    }
    
    // Parse and throw
    throw parseStellarError(error);
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
  const methodName = 'claimYield';
  
  try {
    // Validate inputs
    if (!employerAddress || employerAddress.trim() === '') {
      throw new ValidationError('Employer address is required', {
        field: 'employerAddress',
        value: employerAddress,
      });
    }

    logger.contractStart(methodName, {
      employerAddress,
    });

    if (!TOKEN_ADDRESS) {
      logger.error('TOKEN_ADDRESS not configured');
      throw new ContractError('TOKEN_ADDRESS not configured in environment', {
        configMissing: 'TOKEN_ADDRESS',
      });
    }

    logger.debug('Building contract call for claim_yield');

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
    
    logger.debug('Fetching employer share from transaction result', { txHash });
    
    // Get the employer share from transaction result
    let employerShare = '0';
    try {
      const tx = await sorobanServer.getTransaction(txHash);
      
      if (tx.status === rpc.Api.GetTransactionStatus.SUCCESS && 'returnValue' in tx && tx.returnValue) {
        employerShare = scValToNative(tx.returnValue).toString();
      } else {
        logger.warn('Could not extract employer share from transaction', {
          txHash,
          status: tx.status,
        });
      }
    } catch (error) {
      logger.warn('Failed to fetch employer share, using default', {
        txHash,
        error: (error as Error).message,
      });
    }

    logger.contractSuccess(methodName, {
      txHash,
      employerShare,
      employerAddress,
    });
    
    return { txHash, employerShare };
  } catch (error) {
    logger.contractError(methodName, error as Error, {
      employerAddress,
    });
    
    // Re-throw if already an AppError
    if (error instanceof ValidationError || error instanceof ContractError) {
      throw error;
    }
    
    // Parse and throw
    throw parseStellarError(error);
  }
}

/**
 * Calculate current yield (real-time, no transaction needed)
 * @returns Current yield amount as string
 */
export async function calculateCurrentYield(): Promise<string> {
  const methodName = 'calculateCurrentYield';
  
  try {
    logger.contractStart(methodName, {});

    if (!adminKeypair) {
      logger.error('Admin keypair not configured');
      throw new ContractError('Admin keypair not configured', {
        configMissing: 'ADMIN_SECRET_KEY',
      });
    }

    logger.debug('Building read-only contract call for calculate_current_yield');

    const operation = contract.call('calculate_current_yield');

    let account;
    try {
      account = await horizonServer.loadAccount(adminKeypair.publicKey());
    } catch (error) {
      logger.error('Failed to load account from Horizon', error as Error);
      throw new HorizonError('Failed to load account from network', {
        publicKey: adminKeypair.publicKey(),
        originalError: (error as Error).message,
      });
    }

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    logger.debug('Simulating transaction to calculate yield');

    // Simulate to get result
    let simulated;
    try {
      simulated = await sorobanServer.simulateTransaction(transaction);
    } catch (error) {
      logger.error('Failed to simulate transaction', error as Error);
      throw new SorobanError('Failed to simulate transaction', {
        originalError: (error as Error).message,
      });
    }
    
    if (rpc.Api.isSimulationError(simulated)) {
      logger.error('Simulation failed for calculate_current_yield', undefined, {
        error: simulated.error,
      });
      throw new SimulationFailedError(`Failed to calculate yield: ${simulated.error}`, {
        simulationError: simulated.error,
      });
    }

    if (!('result' in simulated) || !simulated.result) {
      logger.error('No result returned from contract');
      throw new ContractError('No result returned from contract', {
        method: 'calculate_current_yield',
      });
    }

    const currentYield = scValToNative(simulated.result.retval).toString();
    
    logger.contractSuccess(methodName, {
      currentYield,
    });
    
    return currentYield;
  } catch (error) {
    logger.contractError(methodName, error as Error, {});
    
    // Re-throw if already an AppError
    if (error instanceof ContractError || error instanceof HorizonError ||
        error instanceof SorobanError || error instanceof SimulationFailedError) {
      throw error;
    }
    
    // Parse and throw
    throw parseStellarError(error);
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
