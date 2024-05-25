import * as anchor from "@coral-xyz/anchor";

export const RPC_ENDPOINT = 'https://api.devnet.solana.com';
export const PREFLIGHT_COMMITMENT = 'confirmed';

export const MINT_PREFIX_SEED = 'mint';
export const MINT_AUTHORITY_PREFIX_SEED = 'mint_authority';

export const LIQUIDITY_POOL_PREFIX_SEED = 'liquidity_pool';

export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

export const AIRDROP_AMOUNT = 5;