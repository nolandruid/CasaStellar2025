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
  SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",

  // Stellar testnet configuration
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",

  // Testnet details
  NETWORK: "testnet",
};

const SERVER_CONFIG: ServerConfig = {
  PORT: parseInt(process.env.PORT || "3003", 10),
  ENV: process.env.NODE_ENV || "development",
};
const PAYDAY_YIELD_CONTRACT_ID = "CACGMAKOYX4RZZJULTTAWRA7OLIHEBSI4REONH54GKXFCD7LOUMRIM25";
export { SERVER_CONFIG, STELLAR_CONFIG, PAYDAY_YIELD_CONTRACT_ID };
