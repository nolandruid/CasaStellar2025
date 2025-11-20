# Payday Smart Contracts

This directory contains all Soroban smart contracts for the Payday platform.

## Contracts

### payday-yield
**Location:** `payday-yield/src/lib.rs`

Yield-generating mechanism for locked payroll funds.

**Key Features:**
- Locks employer funds until payout date
- Integrates with Blend Pool for yield generation (4% APY simulated)
- Tracks yield earned during lock period
- Releases principal to SDP for distribution
- Allows employer to claim 30% of yield (70% goes to employees)

**Functions:**
- `initialize(blend_pool: Address)` - Set up Blend Pool integration
- `lock_payroll(employer, token, amount, payout_date)` - Lock funds for payroll
- `release_to_sdp(sdp_address, token)` - Release principal on payout date
- `claim_yield(employer, token)` - Employer claims their yield share
- `get_status()` - Get current lock status
- `calculate_current_yield()` - Check yield progress anytime

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
