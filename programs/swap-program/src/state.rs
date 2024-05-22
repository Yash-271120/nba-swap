use std::ops::{Add, Div, Mul};

use anchor_lang::{prelude::*, system_program};
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

use crate::error::*;

#[account]
pub struct MintAuthority {
    pub mint: Pubkey,
    pub mint_bump: u8,
    pub bump: u8,
}

impl MintAuthority {
    pub const MINT_SEED_PREFIX: &[u8] = b"mint";
    pub const SEED_PREFIX: &[u8] = b"mint_authority";

    pub fn new(mint: Pubkey, mint_bump: u8, bump: u8) -> Self {
        Self {
            mint,
            mint_bump,
            bump,
        }
    }
}

#[account]
pub struct LiquidityPool {
    pub assets: Vec<Pubkey>,
    pub bump: u8,
}

impl LiquidityPool {
    pub const SEED_PREFIX: &[u8] = b"liquidity_pool";
    pub const SPACE: usize = 8 + 4 + 1;
    pub fn new(bump: u8) -> Self {
        Self {
            assets: Vec::new(),
            bump,
        }
    }
}

pub trait LiquidityPoolAccount<'info> {
    fn check_asset_key(&self, key: &Pubkey) -> Result<()>;

    fn add_asset(
        &mut self,
        key: Pubkey,
        payer: &Signer<'info>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn realloc(
        &mut self,
        space_to_add: usize,
        payer: &Signer<'info>,
        system_program: &Program<'info, System>,
    ) -> Result<()>;

    fn fund(
        &mut self,
        deposit: (
            &Account<'info, Mint>,
            &Account<'info, TokenAccount>,
            &Account<'info, TokenAccount>,
            u64,
        ),
        authority: &Signer<'info>,
        system_program: &Program<'info, System>,
        token_program: &Program<'info, Token>,
    ) -> Result<()>;

    fn process_swap(
        &mut self,
        receive: (
            &Account<'info, Mint>,
            &Account<'info, TokenAccount>,
            &Account<'info, TokenAccount>,
        ),
        pay: (
            &Account<'info, Mint>,
            &Account<'info, TokenAccount>,
            &Account<'info, TokenAccount>,
            u64,
        ),
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()>;
}

impl<'info> LiquidityPoolAccount<'info> for Account<'info, LiquidityPool> {
    fn check_asset_key(&self, key: &Pubkey) -> Result<()> {
        if !self.assets.contains(key) {
            return Err(SwapProgramError::InvalidAssetKey.into());
        }
        Ok(())
    }

    fn add_asset(
        &mut self,
        key: Pubkey,
        payer: &Signer<'info>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        match self.check_asset_key(&key) {
            Ok(()) => return Ok(()),
            Err(_) => {
                self.realloc(32, payer, system_program)?;
                self.assets.push(key);
            }
        };

        Ok(())
    }

    fn realloc(
        &mut self,
        space_to_add: usize,
        payer: &Signer<'info>,
        system_program: &Program<'info, System>,
    ) -> Result<()> {
        let account_info = self.to_account_info();
        let new_account_space = account_info.data_len() + space_to_add;

        let lamports_needed = (Rent::get()?).minimum_balance(new_account_space);
        let additional_lamports_to_fund = lamports_needed - account_info.lamports();

        if additional_lamports_to_fund < 0 {
            account_info.realloc(new_account_space, false);
            return Ok(());
        }

        system_program::transfer(
            CpiContext::new(
                system_program.to_account_info(),
                system_program::Transfer {
                    from: payer.to_account_info(),
                    to: account_info.clone(),
                },
            ),
            additional_lamports_to_fund,
        )?;

        account_info.realloc(new_account_space, false);
        return Ok(());
    }

    fn fund(
        &mut self,
        deposit: (
            &Account<'info, Mint>,
            &Account<'info, TokenAccount>,
            &Account<'info, TokenAccount>,
            u64,
        ),
        authority: &Signer<'info>,
        system_program: &Program<'info, System>,
        token_program: &Program<'info, Token>,
    ) -> Result<()> {
        let (mint, from, to, amount) = deposit;
        self.add_asset(mint.key(), authority, system_program)?;
        process_transfer_to_pool(from, to, amount, authority, token_program)?;
        Ok(())
    }

    fn process_swap(
        &mut self,
        receive: (
            &Account<'info, Mint>,
            &Account<'info, TokenAccount>,
            &Account<'info, TokenAccount>,
        ),
        pay: (
            &Account<'info, Mint>,
            &Account<'info, TokenAccount>,
            &Account<'info, TokenAccount>,
            u64,
        ),
        authority: &Signer<'info>,
        token_program: &Program<'info, Token>,
    ) -> Result<()> {
        let (receive_mint, pool_recieve, payer_recieve) = receive;
        self.check_asset_key(&receive_mint.key())?;
        let (pay_mint, payer_pay, pool_pay, pay_amount) = pay;

        self.check_asset_key(&pay_mint.key())?;

        let receive_amount = determine_swap_receive(
            pool_recieve.amount,
            receive_mint.decimals,
            pool_pay.amount,
            pay_mint.decimals,
            pay_amount,
        )?;

        if receive_amount == 0 {
            Err(SwapProgramError::InvalidSwapNotEnoughPay.into())
        } else {
            process_transfer_to_pool(payer_pay, pool_pay, pay_amount, authority, token_program)?;
            process_transfer_from_pool(
                pool_recieve,
                payer_recieve,
                receive_amount,
                &self,
                token_program,
            )?;

            return Ok(());
        }
    }
}

fn process_transfer_to_pool<'info>(
    from: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    amount: u64,
    authority: &Signer<'info>,
    token_program: &Program<'info, Token>,
) -> Result<()> {
    transfer(
        CpiContext::new(
            token_program.to_account_info(),
            Transfer {
                from: from.to_account_info(),
                to: to.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        amount,
    )
}

fn process_transfer_from_pool<'info>(
    from: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    amount: u64,
    pool: &Account<'info, LiquidityPool>,
    token_program: &Program<'info, Token>,
) -> Result<()> {
    transfer(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            Transfer {
                from: from.to_account_info(),
                to: to.to_account_info(),
                authority: pool.to_account_info(),
            },
            &[&[LiquidityPool::SEED_PREFIX, &[pool.bump]]],
        ),
        amount,
    )
}

fn determine_swap_receive(
    pool_recieve_balance: u64,
    receive_decimals: u8,
    pool_pay_balance: u64,
    pay_decimals: u8,
    pay_amount: u64,
) -> Result<u64> {
    let big_r = convert_to_float(pool_recieve_balance, receive_decimals);
    let big_p = convert_to_float(pool_pay_balance, pay_decimals);
    let p = convert_to_float(pay_amount, pay_decimals);

    let bigr_times_p = big_r.mul(p);
    let bigp_plus_p = big_p.add(p);
    let r = bigr_times_p.div(bigp_plus_p);
    if r > big_r {
        return Err(SwapProgramError::InvalidSwapNotEnoughLiquidity.into());
    }

    Ok(convert_from_float(r, receive_decimals))
}

fn convert_to_float(amount: u64, decimals: u8) -> f32 {
    (amount as f32).div(f32::powf(10.0, decimals as f32)) as f32
}

fn convert_from_float(amount: f32, decimals: u8) -> u64 {
    amount.mul(f32::powf(10.0, decimals as f32)) as u64
}

pub fn amount_with_decimals(amount: u16, decimals: u8) -> u64 {
    (amount as u64).mul(10u64.pow(decimals as u32))
}
