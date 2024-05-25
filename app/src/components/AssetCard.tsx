import React, { useState, useEffect } from "react";
import * as anchor from "@coral-xyz/anchor";
import Image from "next/image";
import { ClipboardCheckIcon,Clipboard } from "lucide-react";

interface AssetCardProps {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  balance: number;
  mint: anchor.web3.PublicKey;
  poolTokenAccount: anchor.web3.PublicKey;
}

const AssetCard = (props: AssetCardProps) => {
  const [imagePath, setImagePath] = useState<string>("");
  const [isCopying, setIsCopying] = useState<boolean>(false);

  const nominalBalance = Math.floor(
    props.balance / Math.pow(10, props.decimals)
  );

  async function getMetadataFromArweave(uri: string) {
    const data = await fetch(uri).then((data) => data.json());
    setImagePath(data.image);
  }

  const copyToClipboard = async () => {
    setIsCopying(true);
    await navigator.clipboard.writeText(props.mint.toString());
    setTimeout(() => {
      setIsCopying(false);
    }, 2000);
  };

  useEffect(() => {
    getMetadataFromArweave(props.uri);
  });

  return (
    <div className="w-auto pt-4 p-6 border rounded-lg shadow bg-stone-800 border-amber-950 dark:bg-stone-800 dark:border-amber-950 flex flex-col gap-2">
      <div className="flex flex-row">
        <div className="flex-shrink-0">
          <Image
            className="rounded-full"
            alt={props.name}
            src={imagePath}
            width="100"
            height="100"
          />
        </div>
        <div className="ml-4">
          <p className="font-bold text-gray-400 dark:text-amber-500">
            {props.name}
          </p>
          <p className="mt-2 font-semibold text-lg text-gray-700 dark:text-gray-200">
            {nominalBalance}
          </p>
          <div className="mt-2">
            <a
              className="text-xs font-medium text-slate-400"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://explorer.solana.com/address/${props.mint.toBase58()}?cluster=devnet`}
            >
              See on Explorer →
            </a>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="py-4 rounded-lg bg-[#2F333A] flex justify-between items-center px-2 cursor-pointer" onClick={copyToClipboard}>
          <p className=" truncate px-2 text-white text-md w-48 text-wrap">
            {props.mint.toString()}
          </p>
          {
            isCopying ? <ClipboardCheckIcon className="text-green-500" /> : <Clipboard className="text-white" />
          }
        </div>
        <button className="btn-active btn self-start" > Airdrop 5 {props.symbol.toUpperCase()}</button>
      </div>
    </div>
  );
};

export default AssetCard;
