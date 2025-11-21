/**
 * Configuration constants for Stellar and API
 */

interface StellarConfig {
  SOROBAN_RPC_URL: string;
  NETWORK_PASSPHRASE: string;
  NETWORK: string;
}

interface ServerConfig {
  PORT: number;
  ENV: string;
}

interface ApiEndpoints {
  UPLOAD_PAYROLL: string;
  CLAIM_PAY: string;
}

const STELLAR_CONFIG: StellarConfig = {
  // Soroban Testnet RPC URL
  SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",

  // Stellar testnet configuration
  NETWORK_PASSPHRASE: process.env.NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",

  // Testnet details
  NETWORK: process.env.STELLAR_NETWORK || "testnet",
};

const SERVER_CONFIG: ServerConfig = {
  PORT: parseInt(process.env.PORT || "3003", 10),
  ENV: process.env.NODE_ENV || "development",
};

// Smart Contract Configuration
const PAYDAY_YIELD_CONTRACT_ID = process.env.PAYDAY_YIELD_CONTRACT_ID || "";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "";
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "";
const FINDEX_POOL_ADDRESS = process.env.FINDEX_POOL_ADDRESS || "";

export { 
  SERVER_CONFIG, 
  STELLAR_CONFIG, 
  PAYDAY_YIELD_CONTRACT_ID,
  ADMIN_SECRET_KEY,
  TOKEN_ADDRESS,
  FINDEX_POOL_ADDRESS
}; 