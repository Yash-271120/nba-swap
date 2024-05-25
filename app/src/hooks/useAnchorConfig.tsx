import { useEffect, useState } from "react";
import { Program } from "@coral-xyz/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

import { SwapProgram } from "@/idl/swap_program";
import { getAnchorConfigs } from "@/utils/util";

export const useAnchorProgram = () => {
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<Program<SwapProgram> | undefined>();

  const init = async () => {
    const [prov, prog, seedU] = await getAnchorConfigs(wallet);

    setProgram(prog);
  };

  useEffect(() => {
    if (wallet) init();
  }, [wallet]);

  return program;
};
