// This contract is designed to implement a yield-generating mechanism. Here's a brief
// overview of its responsibilities:
//
// - Locking employer funds until the payout date
// - Integrating with defindex to generate yield
// - Tracking the yield earned during the lock period
// - Allowing the employer to collect the yield after the payout

#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token::TokenClient, Address, Env, Vec};

// Storage TTL constants
const INSTANCE_BUMP_AMOUNT: u32 = 7776000; // 90 days
const INSTANCE_LIFETIME_THRESHOLD: u32 = 518400; // 6 days

// Helper function to validate amounts
fn check_nonnegative_amount(amount: i128) -> Result<(), Error> {
    if amount < 0 {
        return Err(Error::InvalidAmount);
    }
    Ok(())
}

// Storage for payroll batch
#[contracttype]
#[derive(Clone)]
pub struct PayrollLock {
    pub employer: Address,
    pub total_amount: i128,          // Total locked for payroll
    pub lock_date: u64,              // When funds were locked
    pub payout_date: u64,            // When defindex will distribute
    pub yield_earned: i128,          // Yield from defindex
    pub funds_released: bool,        // Released to defindex for distribution
    pub yield_claimed: bool,         // Employer claimed yield
}

#[contracttype]
pub enum DataKey {
    PayrollLock(Address, u64), // (employer, batch_id)
    DefindexPoolAddress,
    TokenAddress,
    NextBatchId(Address), // Track next batch_id per employer
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    PayoutDateNotReached = 3,
    AlreadyReleased = 4,
    AlreadyClaimed = 5,
    Unauthorized = 6,
    InsufficientFunds = 7,
    NotYetReleased = 8,
    InvalidAmount = 9,
    InvalidPayoutDate = 10,
}

#[contract]
pub struct PayrollYieldContract;

#[contractimpl]
impl PayrollYieldContract {
    
    /// Initialize contract with defindex Pool address and token
    pub fn initialize(env: Env, defindex_pool: Address, token: Address) -> Result<(), Error> {
        // Check if already initialized
        if env.storage().instance().has(&DataKey::DefindexPoolAddress) {
            return Err(Error::AlreadyInitialized);
        }
        
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        
        env.storage().instance().set(&DataKey::DefindexPoolAddress, &defindex_pool);
        env.storage().instance().set(&DataKey::TokenAddress, &token);
        
        Ok(())
    }
    
    /// Employer locks funds for payroll (before sending to defindex)
    pub fn lock_payroll(
        env: Env,
        employer: Address,
        total_amount: i128,
        payout_date: u64,
    ) -> Result<u64, Error> {
        employer.require_auth();
        
        // Validate amount
        check_nonnegative_amount(total_amount)?;
        
        // Extend storage TTL
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        
        // Verify payout date is in the future
        if payout_date <= env.ledger().timestamp() {
            return Err(Error::InvalidPayoutDate);
        }
        
        // Get stored token address
        let token: Address = env.storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(Error::NotInitialized)?;
        
        // Get next batch_id for this employer
        let batch_id: u64 = env.storage()
            .instance()
            .get(&DataKey::NextBatchId(employer.clone()))
            .unwrap_or(0);
        
        // Transfer tokens from employer to contract
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(
            &employer,
            &env.current_contract_address(),
            &total_amount,
        );
        
        // TODO: Deposit funds into defindex Pool for yield generation
        // Uncomment when DeFindex integration is ready:
        // let defindex_pool: Address = env.storage()
        //     .instance()
        //     .get(&DataKey::DefindexPoolAddress)
        //     .ok_or(Error::NotInitialized)?;
        // let defindex_client = DefindexClient::new(&env, &defindex_pool);
        // defindex_client.deposit(&env.current_contract_address(), &total_amount);
        
        let lock = PayrollLock {
            employer: employer.clone(),
            total_amount,
            lock_date: env.ledger().timestamp(),
            payout_date,
            yield_earned: 0,
            funds_released: false,
            yield_claimed: false,
        };
        
        env.storage().instance().set(&DataKey::PayrollLock(employer.clone(), batch_id), &lock);
        
        // Increment batch_id for next lock
        env.storage().instance().set(&DataKey::NextBatchId(employer.clone()), &(batch_id + 1));
        
        env.events().publish((symbol_short!("locked"), batch_id), employer);
        
        Ok(batch_id)
    }
    
    /// Release principal to defindex for distribution (on payout date)
    pub fn release_to_defindex(
        env: Env,
        employer: Address,
        batch_id: u64,
        defindex_address: Address,
    ) -> Result<i128, Error> {
        // Extend storage TTL
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        
        let mut lock: PayrollLock = env.storage().instance()
            .get(&DataKey::PayrollLock(employer.clone(), batch_id))
            .ok_or(Error::NotInitialized)?;
        
        // Verify payout date has been reached
        if env.ledger().timestamp() < lock.payout_date {
            return Err(Error::PayoutDateNotReached);
        }
        
        // Verify funds haven't already been released
        if lock.funds_released {
            return Err(Error::AlreadyReleased);
        }
        
        // Get stored token address
        let token: Address = env.storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(Error::NotInitialized)?;
        
        // TODO: Withdraw from DeFindex vault to get principal + yield
        // Uncomment when DeFindex integration is ready:
        // let defindex_pool: Address = env.storage()
        //     .instance()
        //     .get(&DataKey::DefindexPoolAddress)
        //     .ok_or(Error::NotInitialized)?;
        // let defindex_client = DefindexClient::new(&env, &defindex_pool);
        // let total_withdrawn = defindex_client.withdraw(&lock.total_amount);
        // let yield_earned = total_withdrawn.checked_sub(lock.total_amount)
        //     .ok_or(Error::InsufficientFunds)?;
        
        // For now: Calculate yield earned (simulated 4% APY)
        let days_locked = (env.ledger().timestamp() - lock.lock_date) / 86400;
        let yield_earned = lock.total_amount
            .checked_mul(4)
            .and_then(|v| v.checked_mul(days_locked as i128))
            .and_then(|v| v.checked_div(365 * 100))
            .ok_or(Error::InsufficientFunds)?;
        
        // Transfer principal to defindex for distribution
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &defindex_address,
            &lock.total_amount,
        );
        
        // Update lock state
        lock.yield_earned = yield_earned;
        lock.funds_released = true;
        env.storage().instance().set(&DataKey::PayrollLock(employer.clone(), batch_id), &lock);
        
        env.events().publish((symbol_short!("released"), batch_id), defindex_address);
        Ok(yield_earned)
    }
    
    /// Employer claims yield earned during lock period
    pub fn claim_yield(
        env: Env,
        employer: Address,
        batch_id: u64,
    ) -> Result<i128, Error> {
        employer.require_auth();
        
        // Extend storage TTL
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        
        let mut lock: PayrollLock = env.storage().instance()
            .get(&DataKey::PayrollLock(employer.clone(), batch_id))
            .ok_or(Error::NotInitialized)?;
        
        // Verify caller is the employer who locked the funds
        if lock.employer != employer {
            return Err(Error::Unauthorized);
        }
        
        // Verify funds have been released to defindex (FIXED BUG)
        if !lock.funds_released {
            return Err(Error::NotYetReleased);
        }
        
        // Verify yield hasn't already been claimed
        if lock.yield_claimed {
            return Err(Error::AlreadyClaimed);
        }
        
        // Get stored token address
        let token: Address = env.storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(Error::NotInitialized)?;
        
        // Calculate employer's share
        let employer_share = lock.yield_earned;
        
        // Transfer yield to employer
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &employer,
            &employer_share,
        );
        
        // Mark yield as claimed
        lock.yield_claimed = true;
        env.storage().instance().set(&DataKey::PayrollLock(employer.clone(), batch_id), &lock);
        
        env.events().publish((symbol_short!("yield"), batch_id), employer);
        Ok(employer_share)
    }
    
    /// Get current payroll lock status
    pub fn get_status(env: Env, employer: Address, batch_id: u64) -> Result<PayrollLock, Error> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        
        env.storage().instance()
            .get(&DataKey::PayrollLock(employer, batch_id))
            .ok_or(Error::NotInitialized)
    }
    
    /// Calculate current yield (can be called anytime to check progress)
    pub fn calculate_current_yield(env: Env, employer: Address, batch_id: u64) -> Result<i128, Error> {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        
        let lock: PayrollLock = env.storage().instance()
            .get(&DataKey::PayrollLock(employer, batch_id))
            .ok_or(Error::NotInitialized)?;
        
        // Calculate yield based on time elapsed (4% APY) with overflow protection
        let days_locked = (env.ledger().timestamp() - lock.lock_date) / 86400;
        let current_yield = lock.total_amount
            .checked_mul(4)
            .and_then(|v| v.checked_mul(days_locked as i128))
            .and_then(|v| v.checked_div(365 * 100))
            .ok_or(Error::InsufficientFunds)?;
        
        Ok(current_yield)
    }
}