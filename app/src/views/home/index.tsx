import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

import { Asset, getAssets } from "@/stores/useAssetsStore";
import { useAnchorProgram } from "@/hooks/useAnchorConfig";
import AssetCard from "@/components/AssetCard";
import {SwapCard} from "@/components/SwapCard";

export const HomeView = () => {
  const wallet = useAnchorWallet();
  const program = useAnchorProgram();
  const [assets, setAssets] = useState<Asset[] | undefined>();

  const getAssetsFromChain = async () => {
    const initAssets = await getAssets(wallet);
    setAssets(initAssets);
  };

  useEffect(() => {
    getAssetsFromChain();
  }, [wallet]);

  return (
    <div className="md:hero mx-auto p-4">
            <div className="md:hero-content flex flex-col">
                <div className="mt-6">
                <h1 className="mb-4 text-center text-4xl font-bold font-serif text-yellow-600">
                        Welcome to the court, hooper
                    </h1>
                </div>
                {wallet && program ? (
                    <div>
                        {assets && (
                            <div>
                                <div className="flex items-center justify-center space-x-10">
                                    <Image
                                        className="rounded-2xl"
                                        alt="nba"
                                        src="/nba.jpeg"
                                        width="350"
                                        height="350"
                                    />
                                    <SwapCard assets={assets} />
                                </div>
                                <div className="grid grid-cols-4 gap-4 mt-4">
                                    {assets.map((asset, i) => (
                                        <AssetCard
                                            key={i}
                                            name={asset.name}
                                            symbol={asset.symbol}
                                            uri={asset.uri}
                                            decimals={asset.decimals}
                                            balance={asset.balance}
                                            mint={asset.mint}
                                            poolTokenAccount={
                                                asset.poolTokenAccount
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <h3 className="mb-4 mt-6 text-center text-2xl font-bold font-serif text-stone-500">
                            Connect a wallet to trade
                        </h3>
                    </div>
                )}
            </div>
        </div>
  );
};
