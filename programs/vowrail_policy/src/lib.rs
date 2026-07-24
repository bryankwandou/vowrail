use anchor_lang::prelude::*;

declare_id!("7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V");

const MAX_PROVIDERS: usize = 8;

#[program]
pub mod vowrail_policy {
    use super::*;

    pub fn initialize_policy(
        ctx: Context<InitializePolicy>,
        per_call_limit: u64,
        daily_limit: u64,
    ) -> Result<()> {
        require!(per_call_limit > 0, VowrailError::InvalidLimit);
        require!(daily_limit >= per_call_limit, VowrailError::InvalidLimit);
        let policy = &mut ctx.accounts.policy;
        policy.authority = ctx.accounts.authority.key();
        policy.per_call_limit = per_call_limit;
        policy.daily_limit = daily_limit;
        policy.spent_today = 0;
        policy.day_index = Clock::get()?.unix_timestamp / 86_400;
        policy.bump = ctx.bumps.policy;
        Ok(())
    }

    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        per_call_limit: u64,
        daily_limit: u64,
    ) -> Result<()> {
        require!(per_call_limit > 0, VowrailError::InvalidLimit);
        require!(daily_limit >= per_call_limit, VowrailError::InvalidLimit);
        let policy = &mut ctx.accounts.policy;
        policy.per_call_limit = per_call_limit;
        policy.daily_limit = daily_limit;
        Ok(())
    }

    pub fn initialize_policy_v2(
        ctx: Context<InitializePolicyV2>,
        per_call_limit: u64,
        daily_limit: u64,
        max_slippage_bps: u16,
        expires_at: i64,
        allowed_providers: Vec<Pubkey>,
    ) -> Result<()> {
        validate_policy_v2(per_call_limit, daily_limit, max_slippage_bps, expires_at, &allowed_providers)?;
        let policy = &mut ctx.accounts.policy;
        policy.authority = ctx.accounts.authority.key();
        policy.per_call_limit = per_call_limit;
        policy.daily_limit = daily_limit;
        policy.spent_today = 0;
        policy.day_index = Clock::get()?.unix_timestamp / 86_400;
        policy.max_slippage_bps = max_slippage_bps;
        policy.expires_at = expires_at;
        policy.allowed_providers = allowed_providers;
        policy.bump = ctx.bumps.policy;
        Ok(())
    }

    pub fn update_policy_v2(
        ctx: Context<UpdatePolicyV2>,
        per_call_limit: u64,
        daily_limit: u64,
        max_slippage_bps: u16,
        expires_at: i64,
        allowed_providers: Vec<Pubkey>,
    ) -> Result<()> {
        validate_policy_v2(per_call_limit, daily_limit, max_slippage_bps, expires_at, &allowed_providers)?;
        let policy = &mut ctx.accounts.policy;
        policy.per_call_limit = per_call_limit;
        policy.daily_limit = daily_limit;
        policy.max_slippage_bps = max_slippage_bps;
        policy.expires_at = expires_at;
        policy.allowed_providers = allowed_providers;
        Ok(())
    }

    pub fn record_decision(
        ctx: Context<RecordDecision>,
        mandate_hash: [u8; 32],
        amount: u64,
        provider: Pubkey,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let policy = &mut ctx.accounts.policy;
        let current_day = clock.unix_timestamp / 86_400;
        if policy.day_index != current_day {
            policy.day_index = current_day;
            policy.spent_today = 0;
        }
        require!(amount <= policy.per_call_limit, VowrailError::PerCallLimitExceeded);
        require!(policy.spent_today.checked_add(amount).ok_or(VowrailError::Overflow)? <= policy.daily_limit, VowrailError::DailyLimitExceeded);
        policy.spent_today = policy.spent_today.checked_add(amount).ok_or(VowrailError::Overflow)?;

        let receipt = &mut ctx.accounts.receipt;
        receipt.policy = policy.key();
        receipt.mandate_hash = mandate_hash;
        receipt.provider = provider;
        receipt.amount = amount;
        receipt.recorded_at = clock.unix_timestamp;
        receipt.bump = ctx.bumps.receipt;
        Ok(())
    }

    pub fn record_decision_v2(
        ctx: Context<RecordDecisionV2>,
        mandate_hash: [u8; 32],
        amount: u64,
        provider: Pubkey,
        slippage_bps: u16,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let policy = &mut ctx.accounts.policy;
        require!(clock.unix_timestamp <= policy.expires_at, VowrailError::PolicyExpired);
        require!(policy.allowed_providers.contains(&provider), VowrailError::ProviderNotAllowed);
        require!(slippage_bps <= policy.max_slippage_bps, VowrailError::SlippageExceeded);
        let current_day = clock.unix_timestamp / 86_400;
        if policy.day_index != current_day {
            policy.day_index = current_day;
            policy.spent_today = 0;
        }
        require!(amount <= policy.per_call_limit, VowrailError::PerCallLimitExceeded);
        require!(policy.spent_today.checked_add(amount).ok_or(VowrailError::Overflow)? <= policy.daily_limit, VowrailError::DailyLimitExceeded);
        policy.spent_today = policy.spent_today.checked_add(amount).ok_or(VowrailError::Overflow)?;
        let receipt = &mut ctx.accounts.receipt;
        receipt.policy = policy.key();
        receipt.mandate_hash = mandate_hash;
        receipt.provider = provider;
        receipt.amount = amount;
        receipt.slippage_bps = slippage_bps;
        receipt.recorded_at = clock.unix_timestamp;
        receipt.bump = ctx.bumps.receipt;
        Ok(())
    }
}

fn validate_policy_v2(per_call_limit: u64, daily_limit: u64, max_slippage_bps: u16, expires_at: i64, allowed_providers: &[Pubkey]) -> Result<()> {
    require!(per_call_limit > 0 && daily_limit >= per_call_limit, VowrailError::InvalidLimit);
    require!(max_slippage_bps <= 10_000, VowrailError::InvalidSlippage);
    require!(expires_at > Clock::get()?.unix_timestamp, VowrailError::PolicyExpired);
    require!(!allowed_providers.is_empty() && allowed_providers.len() <= MAX_PROVIDERS, VowrailError::InvalidProviders);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializePolicy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Policy::INIT_SPACE,
        seeds = [b"policy", authority.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, Policy>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub policy: Account<'info, Policy>,
}

#[derive(Accounts)]
pub struct InitializePolicyV2<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + PolicyV2::INIT_SPACE,
        seeds = [b"policy_v2", authority.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, PolicyV2>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePolicyV2<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub policy: Account<'info, PolicyV2>,
}

#[derive(Accounts)]
#[instruction(mandate_hash: [u8; 32])]
pub struct RecordDecision<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub policy: Account<'info, Policy>,
    #[account(
        init,
        payer = authority,
        space = 8 + DecisionReceipt::INIT_SPACE,
        seeds = [b"receipt", policy.key().as_ref(), mandate_hash.as_ref()],
        bump
    )]
    pub receipt: Account<'info, DecisionReceipt>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(mandate_hash: [u8; 32])]
pub struct RecordDecisionV2<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub policy: Account<'info, PolicyV2>,
    #[account(
        init,
        payer = authority,
        space = 8 + DecisionReceiptV2::INIT_SPACE,
        seeds = [b"receipt_v2", policy.key().as_ref(), mandate_hash.as_ref()],
        bump
    )]
    pub receipt: Account<'info, DecisionReceiptV2>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Policy {
    pub authority: Pubkey,
    pub per_call_limit: u64,
    pub daily_limit: u64,
    pub spent_today: u64,
    pub day_index: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PolicyV2 {
    pub authority: Pubkey,
    pub per_call_limit: u64,
    pub daily_limit: u64,
    pub spent_today: u64,
    pub day_index: i64,
    pub max_slippage_bps: u16,
    pub expires_at: i64,
    #[max_len(8)]
    pub allowed_providers: Vec<Pubkey>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct DecisionReceipt {
    pub policy: Pubkey,
    pub mandate_hash: [u8; 32],
    pub provider: Pubkey,
    pub amount: u64,
    pub recorded_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct DecisionReceiptV2 {
    pub policy: Pubkey,
    pub mandate_hash: [u8; 32],
    pub provider: Pubkey,
    pub amount: u64,
    pub slippage_bps: u16,
    pub recorded_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum VowrailError {
    #[msg("The configured limit is invalid")]
    InvalidLimit,
    #[msg("The payment exceeds the per-call limit")]
    PerCallLimitExceeded,
    #[msg("The payment exceeds the remaining daily limit")]
    DailyLimitExceeded,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("The provider is not included in the on-chain allowlist")]
    ProviderNotAllowed,
    #[msg("The requested slippage exceeds the on-chain ceiling")]
    SlippageExceeded,
    #[msg("The policy has expired")]
    PolicyExpired,
    #[msg("The provider allowlist is empty or exceeds its capacity")]
    InvalidProviders,
    #[msg("The slippage ceiling is invalid")]
    InvalidSlippage,
}
