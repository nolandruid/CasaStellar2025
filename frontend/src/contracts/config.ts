//This file sets up all the important addresses and URLs the frontend needs to talk to

export const CONTRACTS = {
  YIELD_LOCK: import.meta.env.VITE_YIELD_LOCK_CONTRACT_ID || '',
  DISBURSEMENT: import.meta.env.VITE_DISBURSEMENT_CONTRACT_ID || '',
  ZK_VERIFIER: import.meta.env.VITE_ZK_VERIFIER_CONTRACT_ID || '',
};

export const NETWORK_CONFIG = {
  network: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
  horizonUrl: import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
};

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';