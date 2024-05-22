use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata,
    },
    token::{Mint, Token},
};

use crate::state::*;

pub fn create_mint(
    ctx: Context<CreateMint>,
    mint_name: String,
    mint_symbol: String,
    _mint_decimals: u8,
    mint_metadata_uri: String,
) -> Result<()> {
    //create metadata account
    let token_data: DataV2 = DataV2 {
        collection: None,
        creators: None,
        name: mint_name.clone(),
        symbol: mint_symbol.clone(),
        uri: mint_metadata_uri,
        seller_fee_basis_points: 0,
        uses: None,
    };

    create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.mint_metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.mint_authority.to_account_info(),
                payer: ctx.accounts.signer.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                update_authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[&[
                MintAuthority::SEED_PREFIX,
                ctx.accounts.mint.key().as_ref(),
                &[ctx.bumps.mint_authority],
            ]],
        ),
        token_data,
        false,
        true,
        None,
    )?;

    msg!(
        "Metadata account created for mint, name: {} - symbol {}",
        mint_name,
        mint_symbol
    );

    //make mintauthority account

    let mint_authority = MintAuthority::new(
        ctx.accounts.mint.key(),
        ctx.bumps.mint,
        ctx.bumps.mint_authority,
    );

    ctx.accounts.mint_authority.set_inner(mint_authority);
    msg!("mint authority created");

    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_name:String,mint_symbol:String,mint_decimals:u8,mint_metadata_uri:String)]
pub struct CreateMint<'info> {
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub mint_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    signer: Signer<'info>,

    #[account(
        init,
        payer=signer,
        seeds = [
            MintAuthority::MINT_SEED_PREFIX,
            mint_name.as_bytes().as_ref(),
        ],
        bump,
        mint::decimals = mint_decimals,
        mint::authority = mint_authority.key(),
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer=signer,
        seeds = [
            MintAuthority::SEED_PREFIX,
            mint.key().as_ref(),
        ],
        bump,
        space = 8 + std::mem::size_of::<MintAuthority>(),
    )]
    pub mint_authority: Account<'info, MintAuthority>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub token_metadata_program: Program<'info, Metadata>,
}
