# CasaStellar PayDay System Architecture

**Date:** Friday, November 21, 2025  
**Status:** DeFindex Integration In Progress

---

## System Components

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   FRONTEND      │     │    BACKEND      │     │  SMART CONTRACTS     │
│   (React)       │────▶│   (Node.js)     │────▶│  (Soroban/Rust)     │
│                 │     │                 │     │                      │
│ - Employer UI   │     │ - API Server    │     │ - PayDay Yield      │
│ - Wallet Connect│     │ - Cron Jobs     │     │ - DeFindex Vault    │
│ - Freighter     │     │ - SDP Client    │     │ - Token (XLM)       │
└─────────────────┘     └─────────────────┘     └──────────────────────┘
```

---

## Current Deployed Contract

**Contract ID:** `CB436YPY7BWEEJ3V6PVHN7GBUUOE4GE3D2SOTVSZET4CEHF2UAJ5RUNE`  
**Network:** Stellar Testnet  
**Status:** ✅ PRODUCTION READY (Simulated Yield)

---

## FLOW 1: Lock Payroll (Current Working Version)

### Employer Locks Payroll - Simulated DeFindex

```
┌──────────────┐
│  FRONTEND    │
│  Employer UI │
└──────┬───────┘
       │ 1. Enter amount (1000 XLM)
       │    Enter payout date (30 days)
       │    Click "Lock Payroll"
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Wallet (Freighter)                                          │
│  "Approve transaction to lock 1000 XLM"                      │
│  [Employer signs with private key]                           │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ 2. Signed transaction
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  SMART CONTRACT: PayDay Yield                                  │
│  Function: lock_payroll(employer, 1000 XLM, payout_date)       │
│                                                                 │
│  Steps:                                                         │
│  ├─ 1. employer.require_auth() ✅                              │
│  ├─ 2. token.transfer(employer → contract, 1000 XLM) ✅       │
│  ├─ 3. vault_shares = 1000 (1:1 simulation) ✅                │
│  ├─ 4. Store PayrollLock:                                      │
│  │      - batch_id: 0                                          │
│  │      - total_amount: 1000 XLM                               │
│  │      - vault_shares: 1000                                   │
│  │      - payout_date: Day 30                                  │
│  │      - yield_earned: 0                                      │
│  └─ 5. Return batch_id: 0 ✅                                   │
└─────────────────────────────────────────────────────────────────┘
       │
       │ 3. Transaction success
       │    batch_id = 0
       ▼
┌──────────────┐
│  FRONTEND    │
│  "✅ Payroll │
│   Locked!"   │
│  Batch #0    │
└──────────────┘
```

---

## FLOW 2: Release to SDP (Automated)

### Payout Date Reached - Release to Employees

```
┌──────────────┐
│  BACKEND     │
│  Cron Job    │
│  (Every hour)│
└──────┬───────┘
       │ 1. Check all locks
       │    "Is payout_date reached?"
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  SMART CONTRACT: PayDay Yield                                  │
│  Function: get_status(employer, batch_id)                      │
│                                                                 │
│  Returns:                                                       │
│  - payout_date: Day 30                                         │
│  - funds_released: false                                       │
│  - current_time: Day 30 ✅ (time to release!)                 │
└─────────────────────────────────────────────────────────────────┘
       │
       │ 2. Payout date reached!
       │    Trigger release
       ▼
┌──────────────┐
│  BACKEND     │
│  Call:       │
│  release_to_ │
│  sdp()       │
└──────┬───────┘
       │ 3. Admin signature
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  SMART CONTRACT: PayDay Yield                                  │
│  Function: release_to_sdp(batch_id, sdp_wallet)                │
│                                                                 │
│  Steps:                                                         │
│  ├─ 1. Verify payout_date reached ✅                           │
│  ├─ 2. Calculate yield (simulated 4% APY):                     │
│  │      days_locked = 30                                       │
│  │      yield = (1000 × 4 × 30) / (365 × 100) = 3.29 XLM      │
│  ├─ 3. token.transfer(contract → SDP, 1000 XLM) ✅            │
│  ├─ 4. Update lock:                                            │
│  │      - yield_earned: 3.29 XLM                               │
│  │      - funds_released: true                                 │
│  └─ 5. Return yield: 3.29 XLM ✅                               │
└─────────────────────────────────────────────────────────────────┘
       │
       │ 4. Principal sent to SDP
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SDP (Stellar Disbursement Platform)                        │
│  Receives: 1000 XLM                                         │
│  Distributes to employees via CSV upload                    │
└──────────────────────────────────────────────────────────────┘
       │åå
       │ 5. Notify employer
       ▼
┌──────────────┐
│  FRONTEND    │
│  "✅ Payroll │
│   Released!" │
│  Yield: 3.29 │
│  XLM ready   │
└──────────────┘
```

---

## FLOW 3: Claim Yield

### Employer Claims Yield

```
┌──────────────┐
│  FRONTEND    │
│  Employer UI │
└──────┬───────┘
       │ 1. Click "Claim Yield"
       │    Batch #0
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Wallet (Freighter)                                          │
│  "Approve transaction to claim 3.29 XLM yield"               │
│  [Employer signs]                                            │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ 2. Signed transaction
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  SMART CONTRACT: PayDay Yield                                  │
│  Function: claim_yield(employer, batch_id)                     │
│                                                                 │
│  Steps:                                                         │
│  ├─ 1. employer.require_auth() ✅                              │
│  ├─ 2. Verify funds_released = true ✅                         │
│  ├─ 3. Verify yield_claimed = false ✅                         │
│  ├─ 4. token.transfer(contract → employer, 3.29 XLM) ✅       │
│  ├─ 5. Update: yield_claimed = true                            │
│  └─ 6. Return amount: 3.29 XLM ✅                              │
└─────────────────────────────────────────────────────────────────┘
       │
       │ 3. Yield received
       ▼
┌──────────────┐
│  FRONTEND    │
│  "✅ Claimed │
│   3.29 XLM!" │
└──────────────┘
```

---

## The DeFindex Problem

### What We Want: Real DeFindex Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  IDEAL FLOW (Doesn't work yet)                                 │
│                                                                 │
│  Employer → Your Contract.lock_payroll(1000 XLM)               │
│             │                                                   │
│             ├─ token.transfer(employer → contract) ✅          │
│             │                                                   │
│             └─ DeFindex.deposit(contract → vault) ❌           │
│                       │                                         │
│                       └─ token.transfer(contract → vault)      │
│                          ↑                                      │
│                          FAILS HERE!                            │
│                          Error: Auth InvalidAction              │
└─────────────────────────────────────────────────────────────────┘
```

### Why It Fails

**Authorization Chain Problem:**

1. ✅ Employer authorizes YOUR contract
2. ✅ YOUR contract calls DeFindex
3. ❌ DeFindex internally calls `token.transfer()`
   - This needs YOUR contract to authorize it
   - But Soroban SDK doesn't support this pattern well

**Root Cause:**
- Nested contract calls with token transfers
- Current Soroban SDK limitation
- DeFindex contract not designed for this use case

**What We Tried:**
- ❌ Direct DeFindex call - Authorization error
- ❌ Token approval + DeFindex call - Still authorization error
- ❌ `authorize_as_current_contract()` with SubContractInvocation - Authorization error
- ❌ Different authorization patterns - All failed

---

## The Solution: Employer Holds DeFindex Shares

### New Architecture Overview

Instead of the contract calling DeFindex, the **employer deposits to DeFindex first** and holds the vault shares. The contract only tracks and transfers shares (which are tokens themselves).

### Step 1: Employer Deposits to DeFindex

```
┌──────────────────────────────────────────────────────────────┐
│  Employer → DeFindex.deposit(1000 XLM)                       │
│             Returns: 950 vault shares                        │
│                                                              │
│  ✅ No authorization issues (employer's own transaction)    │
└──────────────────────────────────────────────────────────────┘
       │
       │ Employer now holds: 950 DeFindex shares
       │ (Shares are tokens, can be transferred)
       ▼
```

**Key Insight:** DeFindex vault shares are standard Stellar tokens. The employer can hold them and transfer them just like XLM.

### Step 2: Employer Locks Shares in Our Contract

```
┌──────────────────────────────────────────────────────────────┐
│  Employer → YourContract.lock_payroll_with_shares(          │
│               vault_shares: 950,                             │
│               principal_amount: 1000 XLM,                    │
│               payout_date: Day 30                            │
│             )                                                │
│                                                              │
│  Contract stores:                                            │
│  - vault_shares: 950 (locked)                                │
│  - principal_owed: 1000 XLM (for employees)                 │
│                                                              │
│  ✅ Just storing data, no DeFindex calls                    │
└──────────────────────────────────────────────────────────────┘
       │
       │ Shares grow in value in DeFindex
       │ Day 0:  950 shares = 1000 XLM
       │ Day 30: 950 shares = 1040 XLM (4% yield)
       ▼
```

### Step 3: Release - Calculate Shares for Principal Only

```
┌──────────────────────────────────────────────────────────────┐
│  Backend → YourContract.release_to_sdp()                     │
│                                                              │
│  Contract logic:                                             │
│  1. Query DeFindex share price: 1.095 XLM/share            │
│  2. Calculate shares needed for principal:                   │
│     1000 XLM ÷ 1.095 = 913 shares                          │
│  3. Transfer 913 shares to SDP wallet                       │
│  4. Employer keeps: 950 - 913 = 37 shares (yield!)         │
│                                                              │
│  ✅ Transferring shares (tokens), not calling DeFindex      │
└──────────────────────────────────────────────────────────────┘
```

**Key Insight:** The contract only needs to transfer share tokens, not interact with DeFindex directly. This avoids all authorization issues.

### Step 4: SDP Withdraws from DeFindex

```
┌──────────────────────────────────────────────────────────────┐
│  SDP → DeFindex.withdraw(913 shares)                         │
│        Returns: 1000 XLM                                     │
│                                                              │
│  SDP → Employees (distribute 1000 XLM)                       │
│                                                              │
│  ✅ SDP's own transaction, no authorization issues           │
└──────────────────────────────────────────────────────────────┘
```

### Step 5: Employer Claims Yield

```
┌──────────────────────────────────────────────────────────────┐
│  Employer → YourContract.claim_yield()                       │
│             Contract returns: 37 shares                      │
│                                                              │
│  Employer → DeFindex.withdraw(37 shares)                     │
│             Returns: 40 XLM (yield!)                         │
│                                                              │
│  ✅ Employer's own transaction                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Comparison: Current vs New

| Feature                | Current (Works)  | New (Implementing)  |
|------------------------|------------------|---------------------|
| Yield Source           | Simulated 4% APY | Real DeFindex vault |
| Employer Transactions  | 2 (lock, claim)  | 3 (deposit, lock, claim) |
| Authorization Issues   | None ✅          | None ✅             |
| Real Yield             | No ❌            | Yes ✅              |
| Implementation Status  | DONE ✅          | 3-4 hours work      |
| Complexity             | Low              | Medium              |
| Decentralization       | Full             | Full                |

---

## Implementation Checklist

### Contract Changes (1-2 hours)

- [ ] Add `lock_payroll_with_shares()` function
  - Accept vault_shares parameter
  - Accept principal_amount parameter
  - Store both values in PayrollLock
  
- [ ] Modify `release_to_sdp()` function
  - Query DeFindex share price
  - Calculate shares needed for principal
  - Transfer only those shares to SDP
  - Return remaining shares to employer
  
- [ ] Update `claim_yield()` function
  - Return vault shares instead of XLM
  - Let employer withdraw from DeFindex separately
  
- [ ] Add helper function to query DeFindex share price

### Backend Updates (30 min)

- [ ] Add `depositToDeFindex()` service function
- [ ] Add `lockPayrollWithShares()` service function
- [ ] Add `withdrawFromDeFindex()` service function
- [ ] Update workflow documentation

### Frontend Changes (1 hour)

- [ ] Add DeFindex deposit step to UI
- [ ] Show 2-step flow: "Deposit → Lock"
- [ ] Add toggle for "Use DeFindex" vs "Simulate"
- [ ] Display vault shares in payroll status
- [ ] Add "Withdraw from DeFindex" button for yield

### Testing (1 hour)

- [ ] Test DeFindex deposit on testnet
- [ ] Test locking with shares
- [ ] Test release calculation
- [ ] Test SDP withdrawal
- [ ] Test employer yield claim
- [ ] End-to-end integration test

---

## Benefits of New Architecture

### ✅ Solves Authorization Issues
- No nested contract calls
- Each party controls their own transactions
- Clear authorization boundaries

### ✅ Real DeFindex Integration
- Actual vault deposits earning real yield
- Share price appreciation tracked on-chain
- Transparent yield calculation

### ✅ Employer Keeps Yield
- Only principal goes to employees
- Yield stays with employer as vault shares
- Can withdraw yield anytime after release

### ✅ Minimal User Friction
- 3 total transactions for employer
- Automated middle steps
- Clear UI flow

### ✅ Fully Decentralized
- No backend custody of funds
- All operations on-chain
- Employer maintains control

---

## Timeline

**Estimated Implementation:** 3-4 hours

1. **Contract changes:** 1-2 hours
2. **Backend updates:** 30 minutes
3. **Frontend integration:** 1 hour
4. **Testing:** 1 hour

**Target Completion:** Before hackathon submission

---

## Notes

- Current simulated version is fully functional and demo-ready
- New architecture provides real DeFindex integration without authorization issues
- Both versions can coexist (toggle in UI)
- Soroban SDK limitations documented for future reference

---

**Last Updated:** November 21, 2025, 10:24 PM
