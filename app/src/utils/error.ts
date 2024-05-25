import { PublicKey } from "@solana/web3.js";

export const walletNullErr = () => { 
    throw("Wallet not connected");
};