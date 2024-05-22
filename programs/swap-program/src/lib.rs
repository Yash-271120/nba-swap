use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;
declare_id!("37jM1XBNe4MJeN2cfFS6yjx6ybZ5eJMNpTRZWhnAiDna");

#[program]
pub mod swap_program {
    use super::*;

    pub fn create_mint(
        ctx: Context<CreateMint>,
        mint_name: String,
        mint_symbol: String,
        mint_decimals: u8,
        mint_metadata_uri: String,
    ) -> Result<()> {
        instructions::create_mint(
            ctx,
            mint_name,
            mint_symbol,
            mint_decimals,
            mint_metadata_uri,
        )

    }

    pub fn request_airdrop(ctx:Context<RequestAirdrop>,mint_name: String,amount: u16)->Result<()>{
        instructions::request_airdrop(ctx,mint_name,amount)
    }

    pub fn create_pool(ctx: Context<CreatePool>) -> Result<()> {
        instructions::create_pool(ctx)
    }

    pub fn fund_pool(ctx: Context<FundPool>, amount: u64) -> Result<()> {
        instructions::fund_pool(ctx, amount)
    }

    pub fn swap(ctx: Context<Swap>, amount_to_swap: u64) -> Result<()> {
        instructions::swap(ctx, amount_to_swap)
    }
}
