use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;

use crate::error::*;
use crate::state::*;

pub fn swap(ctx: Context<Swap>, amount_to_swap: u64) -> Result<()> {
    if amount_to_swap == 0 {
        return Err(SwapProgramError::InvalidSwapZeroAmount.into());
    }

    let pool = &mut ctx.accounts.pool;

    let receive = (
        ctx.accounts.receive_mint.as_ref(),
        ctx.accounts.pool_receive_token_account.as_ref(),
        ctx.accounts.payer_receive_token_account.as_ref(),
    );

    let pay = (
        ctx.accounts.pay_mint.as_ref(),
        ctx.accounts.payer_pay_token_account.as_ref(),
        ctx.accounts.pool_pay_token_account.as_ref(),
        amount_to_swap,
    );

    pool.process_swap(
        receive,
        pay,
        &ctx.accounts.payer,
        &ctx.accounts.token_program,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        mut,
        seeds = [LiquidityPool::SEED_PREFIX],
        bump = pool.bump,
    )]
    pub pool: Account<'info, LiquidityPool>,

    #[account(
        constraint = !receive_mint.key().eq(&pay_mint.key()) @ SwapProgramError::InvalidSwapMatchingAssets
    )]
    pub receive_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = receive_mint,
        associated_token::authority = pool,
    )]
    pub pool_receive_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer=payer,
        associated_token::mint = receive_mint,
        associated_token::authority = payer,
    )]
    pub payer_receive_token_account: Box<Account<'info, TokenAccount>>,

    pub pay_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = pay_mint,
        associated_token::authority = pool,
    )]
    pub pool_pay_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = pay_mint,
        associated_token::authority = payer,
    )]
    pub payer_pay_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
