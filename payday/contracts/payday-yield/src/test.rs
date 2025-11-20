#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String};

#[test]
fn test_hello() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaydayYieldContract);
    let client = PaydayYieldContractClient::new(&env, &contract_id);

    let result = client.hello(&String::from_str(&env, "World"));
    assert_eq!(result.len(), 2);
}
