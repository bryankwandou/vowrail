use anchor_lang::prelude::*;

declare_id!("7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V");

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
pub struct DecisionReceipt {
    pub policy: Pubkey,
    pub mandate_hash: [u8; 32],
    pub provider: Pubkey,
    pub amount: u64,
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
}
