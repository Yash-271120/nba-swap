import * as anchor from "@coral-xyz/anchor";
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { TokenMetadata } from "@solana/spl-token-metadata";
import { Metaplex, Sft, SftWithToken,Metadata } from "@metaplex-foundation/js";
import {
  getAssociatedTokenAddressSync,
  getMultipleAccounts as getMultipleTokenAccounts,
  getTokenMetadata,
  getMint,
} from "@solana/spl-token";
import { AnchorWallet } from "@solana/wallet-adapter-react";

import * as contants from "../utils/const";
import { getAnchorConfigs } from "../utils/util";

export interface Asset {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  mint: anchor.web3.PublicKey;
  balance: number;
  poolTokenAccount: anchor.web3.PublicKey;
}

export const getAssets = async (
  wallet: AnchorWallet | undefined
): Promise<Asset[]> => {
  let assets: Asset[];
  const [provider, program, seedUtil] = await getAnchorConfigs(wallet);
  const metaplex = Metaplex.make(provider.connection);

  const poolAddress = seedUtil.getLiquidityPoolPda();
  const pool = await program.account.liquidityPool.fetch(poolAddress);

  let metadataAddresses: anchor.web3.PublicKey[] = [];
  let tokenAccountAddresses: anchor.web3.PublicKey[] = [];
  let mintAddresses: anchor.web3.PublicKey[] = [];

  pool.assets.forEach((mint) => {
    metadataAddresses.push(seedUtil.getMintMetaDataPda(mint));
    tokenAccountAddresses.push(
      getAssociatedTokenAddressSync(mint, poolAddress, true)
    );
    mintAddresses.push(mint);
  });

  const poolTokenAccounts = await getMultipleTokenAccounts(
    provider.connection,
    tokenAccountAddresses
  );

  const metadataAccounts = await metaplex.nfts().findAllByMintList({
    mints:mintAddresses
  }) as Metadata[]
  
  const mintInfos = await Promise.all(
    mintAddresses.map((mint) => getMint(provider.connection, mint))
  );
  assets = poolTokenAccounts.map((account) => {
    const metadataAccount = metadataAccounts.find((metadata) => {
      return metadata?.mintAddress.equals(account.mint);
    });

    const [name, symbol, uri] = metadataAccount
      ? [metadataAccount.name, metadataAccount.symbol, metadataAccount.uri]
      : ["Unknown Asset", "UNKN", ""];

    const mint = mintInfos.find((mint) => mint.address.equals(account.mint));
    const decimals = mint ? mint.decimals : 0;

    return {
      name,
      symbol,
      uri,
      decimals,
      mint: account.mint,
      balance: Number(account.amount),
      poolTokenAccount: account.address,
    };
  });

  return assets;
};
