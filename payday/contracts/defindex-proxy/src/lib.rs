//! DeFindex Proxy Contract
//! 
//! Simple proxy to handle DeFindex deposits/withdrawals
//! Solves authorization issues by being a dedicated intermediary

#![no_std]
use soroban_sdk::{
    contract, contractimpl, token::TokenClient, Address, Env, Vec
};

mod defindex_client {
    use soroban_sdk::{Address, Env, Vec, contractclient};
    
    #[contractclient(name = "DefindexVaultClient")]
    pub trait DefindexVault {
        fn deposit(
            e: Env,
            amounts_desired: Vec<i128>,
            amounts_min: Vec<i128>,
            from: Address,
            invest: bool,
        ) -> (Vec<i128>, i128);
        
        fn withdraw(
            e: Env,
            df_amount: i128,
            min_amounts_out: Vec<i128>,
            from: Address,
        ) -> Vec<i128>;
    }
}

use defindex_client::DefindexVaultClient;

#[contract]
pub struct DefindexProxy;

#[contractimpl]
impl DefindexProxy {
    /// Deposit tokens to DeFindex on behalf of caller
    /// Caller must approve this proxy first
    pub fn deposit_to_defindex(
        env: Env,
        vault: Address,
        token: Address,
        amount: i128,
        from: Address,
    ) -> i128 {
        from.require_auth();
        
        // Transfer tokens from caller to this proxy
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(&from, &env.current_contract_address(), &amount);
        
        // Approve DeFindex to spend
        token_client.approve(
            &env.current_contract_address(),
            &vault,
            &amount,
            &(env.ledger().sequence() + 100),
        );
        
        // Deposit to DeFindex
        let vault_client = DefindexVaultClient::new(&env, &vault);
        let mut amounts = Vec::new(&env);
        amounts.push_back(amount);
        let mut min_amounts = Vec::new(&env);
        min_amounts.push_back(amount);
        
        let (_, shares) = vault_client.deposit(
            &amounts,
            &min_amounts,
            &env.current_contract_address(),
            &true,
        );
        
        // Transfer shares back to caller
        // Note: DeFindex shares are also tokens
        shares
    }
    
    /// Withdraw from DeFindex on behalf of caller
    pub fn withdraw_from_defindex(
        env: Env,
        vault: Address,
        shares: i128,
        min_amount: i128,
        to: Address,
    ) -> i128 {
        to.require_auth();
        
        let vault_client = DefindexVaultClient::new(&env, &vault);
        let mut min_amounts = Vec::new(&env);
        min_amounts.push_back(min_amount);
        
        let withdrawn = vault_client.withdraw(
            &shares,
            &min_amounts,
            &env.current_contract_address(),
        );
        
        let amount = withdrawn.get(0).unwrap_or(0);
        
        // Transfer withdrawn tokens to caller
        // Get token address from vault (would need to query)
        // For now, return amount
        amount
    }
}
