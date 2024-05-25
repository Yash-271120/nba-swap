import dynamic from "next/dynamic";
import Link from "next/link";
import React from "react";

import { Asset, getAssets } from "@/stores/useAssetsStore";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";

import { web3 } from "@coral-xyz/anchor";
import { getTokenMetadata, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Metaplex } from "@metaplex-foundation/js";
import * as contants from "@/utils/const";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export const AppBar = () => {
  const wallet = useAnchorWallet();
  return (
    <div>
      <div className="navbar flex h-20 flex-row md:mb-2 shadow-lg bg-black text-neutral-content border-b border-zinc-600 bg-opacity-66">
        <div className="navbar-start align-items-center">
          <div className="hidden sm:inline w-22 h-22 md:p-2 ml-10">
            <Link
              href="https://github.com/Yash-271120"
              target="_blank"
              rel="noopener noreferrer"
              passHref
              className="text-secondary hover:text-white"
            >
              <img src="/logo.svg" alt="Logo" height={80} width={80} />
            </Link>
          </div>
        </div>

        <div className="navbar-end">
          <div className="align-items-center justify-items gap-6">
            <WalletMultiButtonDynamic className="btn-ghost btn-sm rounded-btn text-lg mr-6 " />
          </div>
        </div>
      </div>
    </div>
  );
};
