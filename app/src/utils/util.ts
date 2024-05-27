import * as anchor from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import * as constants from "./const";
import { walletNullErr } from "./error";
import { SwapProgram } from "@/idl/swap_program";
import { SeedUtil } from "./seed-util";
import IDL from "../idl/swap_program.json";

export async function getAnchorConfigs(
  wallet: AnchorWallet | undefined
): Promise<[anchor.AnchorProvider, anchor.Program<SwapProgram>, SeedUtil]> {
  if (!wallet) return walletNullErr();
  const provider = new anchor.AnchorProvider(
    new anchor.web3.Connection(
      constants.RPC_ENDPOINT as string,
      constants.PREFLIGHT_COMMITMENT
    ),
    wallet,
    { preflightCommitment: constants.PREFLIGHT_COMMITMENT }
  );

  const program = new anchor.Program(IDL as SwapProgram, provider);

  const seedUtil = new SeedUtil(program, wallet);

  return [provider, program, seedUtil];
}

export async function createAirdropTransaction(
  wallet: AnchorWallet | undefined,
  amount: number,
  mintName: string
) {
  const [provider, program, seedUtil] = await getAnchorConfigs(wallet);

  const mintPda = seedUtil.getMintPda(mintName);
  const payerTokenAccount = seedUtil.getAssociatedTokenAccountPda(mintPda);

  const tx = await program.methods
    .requestAirdrop(mintName, amount)
    .accounts({
      payerTokenAccount,
    })
    .transaction();

  return tx;
}

export async function createSwapTransaction(
  wallet: AnchorWallet | undefined,
  amount: number,
  payMintName: string,
  payMintDecimals: number,
  receiveMintName: string
) {
  const [provider, program, seedUtil] = await getAnchorConfigs(wallet);

  const payMintPda = seedUtil.getMintPda(payMintName);
  const receiveMintPda = seedUtil.getMintPda(receiveMintName);

  const payerPayAssociatedTokenAccount =
    seedUtil.getAssociatedTokenAccountPda(payMintPda);
  const payerReceiveAssociatedTokenAccount =
    seedUtil.getAssociatedTokenAccountPda(receiveMintPda);

  const poolPayAssociatedTokenAccount =
    seedUtil.getPoolAssociatedTokenAccountPda(payMintPda);
  const poolReceiveAssociatedTokenAccount =
    seedUtil.getPoolAssociatedTokenAccountPda(receiveMintPda);

  // const payAmount = BigInt(amount) * BigInt(10) ** BigInt(payMintDecimals);

  const tx = await program.methods
    .swap(new anchor.BN(amount))
    .accounts({
      payerPayTokenAccount: payerPayAssociatedTokenAccount,
      payerReceiveTokenAccount: payerReceiveAssociatedTokenAccount,
      payMint: payMintPda,
      receiveMint: receiveMintPda,
      poolPayTokenAccount: poolPayAssociatedTokenAccount,
      poolReceiveTokenAccount: poolReceiveAssociatedTokenAccount,
    })
    .transaction();

  return tx;
}
