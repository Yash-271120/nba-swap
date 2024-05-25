import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import * as contants from "./const";
import { SwapProgram } from "../idl/swap_program";

export class SeedUtil {
  program: anchor.Program<SwapProgram>;
  wallet: AnchorWallet;

  constructor(program: anchor.Program<SwapProgram>, wallet: AnchorWallet) {
    this.program = program;
    this.wallet = wallet;
  }

  getMintPda = (mintName: string) => {
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(contants.MINT_PREFIX_SEED), Buffer.from(mintName)],
      this.program.programId
    );
    return pda;
  };

  getMintAuthorityPda = (mintName: string) => {
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(contants.MINT_AUTHORITY_PREFIX_SEED), Buffer.from(mintName)],
      this.program.programId
    );
    return pda;
  };

  getMintMetaDataPda = (mintPda: anchor.web3.PublicKey) => {
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        contants.TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPda.toBuffer(),
      ],
      contants.TOKEN_METADATA_PROGRAM_ID
    );

    return pda;
  };

  getLiquidityPoolPda = () => {
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(contants.LIQUIDITY_POOL_PREFIX_SEED)],
      this.program.programId
    );
    return pda;
  };

  getAssociatedTokenAccountPda = (mint: anchor.web3.PublicKey) => {
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        this.wallet.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return pda;
  };
}
