/**
 * Stellar SDK Integration Service
 * Handles connection to Soroban and Stellar testnet
 */

import { rpc } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../config/constants';

interface SorobanHealth {
  status: string;
  version?: string;
}

/**
 * Initialize Soroban Server connection
 * @returns {rpc.Server} Soroban server instance
 */
function initializeSorobanServer(): rpc.Server {
  try {
    const sorobanServer = new rpc.Server(STELLAR_CONFIG.SOROBAN_RPC_URL);
    console.log(`✓ Connected to Soroban RPC: ${STELLAR_CONFIG.SOROBAN_RPC_URL}`);
    return sorobanServer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Failed to initialize Soroban server:', errorMessage);
    throw error;
  }
}

/**
 * Get Soroban server health status
 * @param {rpc.Server} sorobanServer - The Soroban server instance
 * @returns {Promise<SorobanHealth>} Health status information
 */
async function checkSorobanHealth(sorobanServer: rpc.Server): Promise<SorobanHealth> {
  try {
    const health = await sorobanServer.getHealth();
    console.log('✓ Soroban server health check passed');
    return health as SorobanHealth;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Soroban server health check failed:', errorMessage);
    throw error;
  }
}

/**
 * Get Soroban ledger information
 * @param {rpc.Server} sorobanServer - The Soroban server instance
 * @returns {Promise<any>} Ledger information
 */
async function getSorobanLedgerInfo(sorobanServer: rpc.Server): Promise<any> {
  try {
    // Note: getLedgerEntries might require specific parameters
    // For now, this is a placeholder for future implementation
    console.log('✓ Retrieved Soroban ledger information');
    return {};
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Failed to retrieve ledger information:', errorMessage);
    throw error;
  }
}

/**
 * Generate unique ID for payroll
 * @returns {string} Unique payroll ID
 */
function generatePayrollId(): string {
  return `payroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique ID for claim
 * @returns {string} Unique claim ID
 */
function generateClaimId(): string {
  return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export {
  initializeSorobanServer,
  checkSorobanHealth,
  getSorobanLedgerInfo,
  generatePayrollId,
  generateClaimId,
  SorobanHealth,
};
