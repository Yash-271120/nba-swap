use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

use crate::state::*;

pub fn request_airdrop(ctx: Context<RequestAirdrop>, _mint_name: String, amount: u16) -> Result<()> {
    let mint_decimals = ctx.accounts.mint.decimals;
    let amount_to_tranfer = amount_with_decimals(amount, mint_decimals);

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                authority: ctx.accounts.mint_authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.payer_token_account.to_account_info(),
            },
            &[&[
                MintAuthority::SEED_PREFIX,
                ctx.accounts.mint.key().as_ref(),
                &[ctx.accounts.mint_authority.bump],
            ]],
        ),
        amount_to_tranfer,
    )?;

    msg!("Successfully airdrop....");
    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_name: String,amount: u16)]
pub struct RequestAirdrop<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [MintAuthority::MINT_SEED_PREFIX,mint_name.as_bytes().as_ref()],
        bump = mint_authority.mint_bump
    )]
    pub mint: Account<'info, Mint>,

    #[account(
            mut,
            seeds=[MintAuthority::SEED_PREFIX,mint.key().as_ref()],
            bump = mint_authority.bump
    )]
    pub mint_authority: Account<'info, MintAuthority>,

    #[account(
        init_if_needed,
        payer=payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub payer_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
