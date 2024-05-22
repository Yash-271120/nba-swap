use anchor_lang::prelude::*;

use crate::state::*;

pub fn create_pool(ctx: Context<CreatePool>) -> Result<()> {
    let pool_bump = ctx.bumps.pool;
    let new_liquidity_pool = LiquidityPool::new(pool_bump);

    ctx.accounts.pool.set_inner(new_liquidity_pool);
    Ok(())
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    //liquidty pool account
    #[account(
        init,
        space = LiquidityPool::SPACE,
        seeds = [LiquidityPool::SEED_PREFIX],
        payer = signer,
        bump
    )]
    pub pool: Account<'info, LiquidityPool>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
