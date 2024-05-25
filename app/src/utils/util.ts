import * as anchor from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
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

  const seedUtil = new SeedUtil(program);

  return [provider, program, seedUtil];
}
