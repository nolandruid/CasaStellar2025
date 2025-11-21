# Payday Smart Contracts

This directory contains all Soroban smart contracts for the Payday platform.

## Contracts

### payday-yield
**Location:** `payday-yield/src/lib.rs`

Yield-generating mechanism for locked payroll funds with DeFindex vault integration.

**Key Features:**
- Locks employer funds until payout date
- **Integrates with DeFindex vault for real yield generation**
- Supports multiple employers and multiple payroll batches per employer
- Tracks vault shares and yield earned during lock period
- Releases principal to distribution contract on payout date
- Allows employer to claim 100% of yield earned
- Storage TTL management for data persistence
- Integer overflow protection on all calculations

**Functions:**
- `initialize(defindex_vault: Address, token: Address)` - Set up DeFindex vault and token
- `lock_payroll(employer, amount, payout_date) -> batch_id` - Lock funds and deposit to DeFindex
- `release_to_sdp(employer, batch_id, sdp_wallet_address) -> yield_earned` - Withdraw from vault and send principal to SDP
- `claim_yield(employer, batch_id) -> yield_amount` - Employer claims their yield share
- `get_status(employer, batch_id) -> PayrollLock` - Get specific batch lock status
- `calculate_current_yield(employer, batch_id) -> i128` - Check yield progress for a batch

**Integration with SDP:**
This contract works with Stellar Disbursement Platform (SDP) for employee distribution:
1. Employer locks payroll funds (generates yield in DeFindex)
2. On payout date, principal is released to SDP wallet
3. SDP handles mass distribution to employees from CSV
4. Employer claims yield earned during lock period

## Building Contracts

```bash
# Build all contracts
stellar contract build

# Build output location
# target/wasm32v1-none/release/payday_yield.wasm
```

## Deploying Contracts

```bash
# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/payday_yield.wasm \
  --network testnet

# Copy the contract ID to frontend/.env
# VITE_YIELD_LOCK_CONTRACT_ID=<contract-id>
```

## Testing

```bash
# Run contract tests
stellar contract test
```

## Architecture Notes

- Contracts live in `/payday/contracts/` (single source of truth)
- Frontend references deployed contract addresses via environment variables
- Backend may interact with contracts for automation/monitoring
