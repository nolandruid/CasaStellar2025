// This contract is designed to implement a yield-generating mechanism. Here's a brief
// overview of its responsibilities:
//
// - Locking employer funds until the payout date
// - Integrating with Blend Pool to generate yield
// - Tracking the yield earned during the lock period
// - Allowing the employer to collect the yield after the payout

#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, token::TokenClient, Address, Env};

// Storage for payroll batch
#[contracttype]
#[derive(Clone)]
pub struct PayrollLock {
    pub employer: Address,
    pub total_amount: i128,          // Total locked for payroll
    pub lock_date: u64,              // When funds were locked
    pub payout_date: u64,            // When SDP will distribute
    pub yield_earned: i128,          // Yield from Blend Pool
    pub funds_released: bool,        // Released to SDP for distribution
    pub yield_claimed: bool,         // Employer claimed yield
}

#[contracttype]
pub enum DataKey {
    PayrollLock,
    BlendPoolAddress,
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
}

#[contract]
pub struct PayrollYieldContract;

#[contractimpl]
impl PayrollYieldContract {
    
    /// Initialize contract with Blend Pool address
    pub fn initialize(env: Env, blend_pool: Address) {
        env.storage().instance().set(&DataKey::BlendPoolAddress, &blend_pool);
    }
    
    /// Employer locks funds for payroll (before sending to SDP)
    pub fn lock_payroll(
        env: Env,
        employer: Address,
        token: Address,
        total_amount: i128,
        payout_date: u64,
    ) -> Result<(), Error> {
        employer.require_auth();
        
        // Check if already locked
        if env.storage().instance().has(&DataKey::PayrollLock) {
            return Err(Error::AlreadyInitialized);
        }
        
        // Verify payout date is in the future
        if payout_date <= env.ledger().timestamp() {
            return Err(Error::PayoutDateNotReached);
        }
        
        // Transfer tokens from employer to contract
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(
            &employer,
            &env.current_contract_address(),
            &total_amount,
        );
        
        // TODO: Deposit funds into Blend Pool for yield generation
        // For hackathon: funds stay in contract, yield calculated on release
        
        let lock = PayrollLock {
            employer: employer.clone(),
            total_amount,
            lock_date: env.ledger().timestamp(),
            payout_date,
            yield_earned: 0,
            funds_released: false,
            yield_claimed: false,
        };
        
        env.storage().instance().set(&DataKey::PayrollLock, &lock);
        env.events().publish((symbol_short!("locked"),), employer);
        
        Ok(())
    }
    
    /// Release principal to SDP for distribution (on payout date)
    pub fn release_to_sdp(
        env: Env,
        sdp_address: Address,
        token: Address,
    ) -> Result<i128, Error> {
        let mut lock: PayrollLock = env.storage().instance()
            .get(&DataKey::PayrollLock)
            .ok_or(Error::NotInitialized)?;
        
        // Verify payout date has been reached
        if env.ledger().timestamp() < lock.payout_date {
            return Err(Error::PayoutDateNotReached);
        }
        
        // Verify funds haven't already been released
        if lock.funds_released {
            return Err(Error::AlreadyReleased);
        }
        
        // Calculate yield earned (simulated 4% APY)
        // TODO: Replace with actual Blend Pool withdrawal
        let days_locked = (env.ledger().timestamp() - lock.lock_date) / 86400;
        let yield_earned = (lock.total_amount * 4 * days_locked as i128) / (365 * 100);
        
        // Transfer principal to SDP for distribution
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &sdp_address,
            &lock.total_amount,
        );
        
        // Update lock state
        lock.yield_earned = yield_earned;
        lock.funds_released = true;
        env.storage().instance().set(&DataKey::PayrollLock, &lock);
        
        env.events().publish((symbol_short!("released"),), sdp_address);
        Ok(yield_earned)
    }
    
    /// Employer claims yield earned during lock period
    pub fn claim_yield(
        env: Env,
        employer: Address,
        token: Address,
    ) -> Result<i128, Error> {
        employer.require_auth();
        
        let mut lock: PayrollLock = env.storage().instance()
            .get(&DataKey::PayrollLock)
            .ok_or(Error::NotInitialized)?;
        
        // Verify caller is the employer who locked the funds
        if lock.employer != employer {
            return Err(Error::Unauthorized);
        }
        
        // Verify funds have been released to SDP
        if !lock.funds_released {
            return Err(Error::AlreadyReleased);
        }
        
        // Verify yield hasn't already been claimed
        if lock.yield_claimed {
            return Err(Error::AlreadyClaimed);
        }
        
        // Calculate employer's share (30% of yield, 70% goes to employees)
        let employer_share = (lock.yield_earned * 30) / 100;
        
        // Transfer yield to employer
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &employer,
            &employer_share,
        );
        
        // Mark yield as claimed
        lock.yield_claimed = true;
        env.storage().instance().set(&DataKey::PayrollLock, &lock);
        
        env.events().publish((symbol_short!("yield"),), employer);
        Ok(employer_share)
    }
    
    /// Get current payroll lock status
    pub fn get_status(env: Env) -> Result<PayrollLock, Error> {
        env.storage().instance()
            .get(&DataKey::PayrollLock)
            .ok_or(Error::NotInitialized)
    }
    
    /// Calculate current yield (can be called anytime to check progress)
    pub fn calculate_current_yield(env: Env) -> Result<i128, Error> {
        let lock: PayrollLock = env.storage().instance()
            .get(&DataKey::PayrollLock)
            .ok_or(Error::NotInitialized)?;
        
        // Calculate yield based on time elapsed (4% APY)
        let days_locked = (env.ledger().timestamp() - lock.lock_date) / 86400;
        let current_yield = (lock.total_amount * 4 * days_locked as i128) / (365 * 100);
        
        Ok(current_yield)
    }
}