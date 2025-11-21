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
  // Soroban RPC URL - defaults to testnet
  SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",

  // Stellar network configuration - defaults to testnet
  NETWORK_PASSPHRASE: process.env.NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",

  // Network identifier - defaults to testnet
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

// SDP (Stellar Disbursement Platform) Configuration
interface SDPConfig {
  API_URL: string;
  API_KEY: string;
  WALLET_ADDRESS: string;
  WALLET_SECRET: string;
}

const SDP_CONFIG: SDPConfig = {
  API_URL: process.env.SDP_API_URL || "https://sdp-api.stellar.org",
  API_KEY: process.env.SDP_API_KEY || "",
  WALLET_ADDRESS: process.env.SDP_WALLET_ADDRESS || "",
  WALLET_SECRET: process.env.SDP_WALLET_SECRET || "",
};

export { 
  SERVER_CONFIG, 
  STELLAR_CONFIG, 
  PAYDAY_YIELD_CONTRACT_ID,
  ADMIN_SECRET_KEY,
  TOKEN_ADDRESS,
  FINDEX_POOL_ADDRESS,
  SDP_CONFIG
}; 