import React, { useState, useEffect } from "react";
import {
  useWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "react-toastify";

import { createSwapTransaction } from "@/utils/util";
import { Asset } from "@/stores/useAssetsStore";
import { useAnchorProgram } from "@/hooks/useAnchorConfig";

interface TokenSwapProps {
  assets: Asset[];
  getAssets: () => Promise<void>;
}

export const SwapCard = ({ assets, getAssets }: TokenSwapProps) => {
  const program = useAnchorProgram();
  const [fromToken, setFromToken] = useState<Asset>(assets[0]);
  const [toToken, setToToken] = useState<Asset>(assets[1]);
  const [amount, setAmount] = useState<number>(0);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  useEffect(() => {
    const r = (toToken.balance * amount) / (fromToken.balance + amount);
    const adjustedR = r / Math.pow(10, toToken.decimals);
    const roundedR = Math.round(adjustedR * 100) / 100;
    setReceiveAmount(roundedR);
  }, [amount, fromToken, toToken]);

  const handleFlop = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const swap = async () => {
    const tx = await createSwapTransaction(
      anchorWallet,
      amount,
      fromToken.name,
      fromToken.decimals,
      toToken.name
    );
    try {
      const sig = await sendTransaction(tx, connection);
      await getAssets();
      console.log(sig);
      toast.success("Swap successful");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-row justify-center">
      <div className="p-4 shadow dark:bg-stone-900 dark:border-yellow-950 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <select
            value={fromToken.symbol}
            onChange={(e) => {
              const selectedAsset = assets.find(
                (asset) => asset.symbol === e.target.value
              );
              if (selectedAsset) {
                setFromToken(selectedAsset);
              }
            }}
            className="p-3 rounded-md border mx-2 bg-black text-white"
          >
            {assets.map(
              (asset, index) =>
                asset.symbol !== toToken.symbol && (
                  <option key={index} value={asset.symbol}>
                    {asset.name}
                  </option>
                )
            )}
          </select>

          <button
            onClick={handleFlop}
            className="p-2 bg-yellow-700 hover:bg-yellow-900 text-white rounded"
          >
            <ArrowLeftRight />
          </button>

          <select
            value={toToken.symbol}
            onChange={(e) => {
              const selectedAsset = assets.find(
                (asset) => asset.symbol === e.target.value
              );
              if (selectedAsset) {
                setToToken(selectedAsset);
              }
            }}
            className="p-3 rounded-md border mx-2 bg-black text-white"
          >
            {assets.map(
              (asset, index) =>
                asset.symbol !== fromToken.symbol && (
                  <option key={index} value={asset.symbol}>
                    {asset.name}
                  </option>
                )
            )}
          </select>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex justify-between items-start space-x-4">
            <div className="flex flex-col">
              <label htmlFor="pay">Pay:</label>
              <input
                id="pay"
                className="bg-black rounded-lg p-2"
                placeholder="Amount"
                type="number"
                onChange={(e) =>
                  setAmount(Number(e.target.value) * 10 ** fromToken.decimals)
                }
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="receive">Receive:</label>
              <div
                id="receive"
                className="bg-green-950 text-white rounded-lg p-2"
              >
                {receiveAmount}
              </div>
            </div>
          </div>
        </div>
        <button
          className="w-full bg-yellow-700 hover:bg-yellow-900 h-12 mt-2 rounded-lg"
          onClick={swap}
        >
          Swap
        </button>
      </div>
    </div>
  );
};
