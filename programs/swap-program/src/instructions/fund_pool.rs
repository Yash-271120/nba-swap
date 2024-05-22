use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::state::*;

pub fn fund_pool(ctx: Context<FundPool>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    let deposit = (
        &ctx.accounts.mint,
        &ctx.accounts.payer_token_account,
        &ctx.accounts.pool_token_account,
        amount,
    );

    pool.fund(deposit, &ctx.accounts.payer, &ctx.accounts.system_program, &ctx.accounts.token_program)?;

    Ok(())
}

#[derive(Accounts)]
pub struct FundPool<'info> {
    #[account(
        mut,
        seeds = [LiquidityPool::SEED_PREFIX],
        bump=pool.bump,
    )]
    pub pool: Account<'info, LiquidityPool>,

    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer=payer,
        associated_token::mint = mint,
        associated_token::authority = pool,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
