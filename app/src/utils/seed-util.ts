import * as anchor from "@coral-xyz/anchor";
import * as contants from "./const";
import { SwapProgram } from "../idl/swap_program";

export class SeedUtil {
  program: anchor.Program<SwapProgram>;

  constructor(program: anchor.Program<SwapProgram>) {
    this.program = program;
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
}
