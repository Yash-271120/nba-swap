import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getOrCreateAssociatedTokenAccount, getMint } from "@solana/spl-token";
import { SwapProgram } from "../target/types/swap_program";
import assetJson from "./nba/assets.json";
import fs from "fs";
import * as contants from "../app/src/utils/const"
import { Connection } from "@solana/web3.js";

describe("swap-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const connection = new anchor.web3.Connection(
    contants.RPC_ENDPOINT,
    contants.PREFLIGHT_COMMITMENT
  );

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const program = anchor.workspace.SwapProgram as Program<SwapProgram>;

  const wallet = provider.wallet as anchor.Wallet;

  it("initialize....", async () => {
    const sig = await program.methods
      .createPool()
      .accounts({})
      .signers([wallet.payer])
      .rpc();

    console.log("init :", sig);
  });

  //generate random number from 10 - 100
  it("create mints", async () => {
    const assets = assetJson.assets;
    const newAssetObj = { assets: [] };

    for (let asset of assets) {
      let currentAsset: any = asset;
      const decimals = Math.floor(Math.random() * 9) + 1;

      const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(asset.name)],
        program.programId
      );

      const [poolPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("liquidity_pool")],
        program.programId
      );

      const [mintMetaDataPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintPda.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      console.log(`creating mint for ${asset.name} \n`);
      const sig = await program.methods
        .createMint(asset.name, asset.symbol, decimals, asset.uri)
        .accounts({
          mintMetadata: mintMetaDataPDA,
        })
        .signers([wallet.payer])
        .rpc();

      console.log(`Mint created for ${asset.name} address: ${mintPda} \n`);
      currentAsset = {
        ...asset,
        address: mintPda,
      };

      newAssetObj.assets.push(currentAsset);
    }

    const newAsset = JSON.stringify(newAssetObj, null, 2);
    fs.writeFileSync("tests/nba/assetsFinal.json", newAsset);
  });

  it("airdrop funds to test wallets", async () => {
    const assets = assetJson.assets;
    for (let asset of assets) {
      const fundAmount = Math.floor(Math.random() * 191) + 10;
      const tx = await requistAirdropTransaction(
        connection,
        program,
        wallet,
        asset.name,
        fundAmount
      );

      const sig = await anchor.web3.sendAndConfirmTransaction(connection, tx, [
        wallet.payer,
      ]);
    }
  });

  it("fund liquidity pool", async () => {
    const assets = assetJson.assets;
    const [poolPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("liquidity_pool")],
      program.programId
    );

    for (let asset of assets) {
      const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), Buffer.from(asset.name)],
        program.programId
      );

      const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.payer,
        mintPda,
        wallet.publicKey
      );

      const poolTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.payer,
        mintPda,
        poolPDA,
        true
      );

      await program.methods
        .fundPool(new anchor.BN(payerTokenAccount.amount.toString()))
        .accounts({
          mint: mintPda,
          payerTokenAccount: payerTokenAccount.address,
          poolTokenAccount: poolTokenAccount.address,
        })
        .signers([wallet.payer])
        .rpc();

      const liquidityPool = await program.account.liquidityPool.fetch(poolPDA);

      console.log("-------------------------------------------------");
      console.log(
        `Liquidity Pool has ${liquidityPool.assets.length} assets \n`
      );
      console.log(
        `Last added asset ${liquidityPool.assets.pop().toString()} \n`
      );
      console.log("-------------------------------------------------");
    }
  });

  it("[Pre-Test] add token to payer wallet", async () => {
    const assets = assetJson.assets;
    const paySwapAsset = assets[0];

    const tx = await requistAirdropTransaction(
      connection,
      program,
      wallet,
      paySwapAsset.name,
      100
    );

    const sig = await anchor.web3.sendAndConfirmTransaction(
      connection,
      tx,
      [wallet.payer],
      {
        commitment: "confirmed",
      }
    );

    console.log("sig: ", sig);
  });

  it("[TEST] - 1 swap tokens", async () => {
    const assets = assetJson.assets;

    const [poolPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("liquidity_pool")],
      program.programId
    );

    const paySwapAsset = assets[0];
    const recieveSwapAsset = assets[1];

    const [payMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(paySwapAsset.name)],
      program.programId
    );

    const payMint = await getMint(connection, payMintPda);

    const [recieveMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(recieveSwapAsset.name)],
      program.programId
    );

    const poolRecieveATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      poolPDA,
      true
    );

    const poolPayATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      poolPDA,
      true
    );

    const payerRecieveATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payerPayATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payAmount = BigInt(25) * BigInt(10) ** BigInt(payMint.decimals);
    const initialPayerRecieveTokens = payerRecieveATA.amount;

    console.log("-------------------------------------------------");
    console.log(`Pool Pay tokens: ${poolPayATA.amount.toString()} \n`);
    console.log(`Pool Recieve tokens: ${poolRecieveATA.amount.toString()} \n`);
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(`Payer Pay tokens: ${payerPayATA.amount.toString()} \n`);
    console.log(
      `Payer Recieve tokens: ${payerRecieveATA.amount.toString()} \n`
    );
    console.log("-------------------------------------------------");

    console.log(
      `Attempting to swap ${payAmount} ${paySwapAsset.name} for ${recieveSwapAsset.name} \n`
    );

    const tx2 = await program.methods
      .swap(new anchor.BN(payAmount.toString()))
      .accounts({
        payerPayTokenAccount: payerPayATA.address,
        payerReceiveTokenAccount: payerRecieveATA.address,
        poolPayTokenAccount: poolPayATA.address,
        poolReceiveTokenAccount: poolRecieveATA.address,
        payMint: payMintPda,
        receiveMint: recieveMintPda,
      })
      .signers([wallet.payer])
      .transaction();

    const finalTransaction = new anchor.web3.Transaction().add(tx2);

    const sig = await anchor.web3.sendAndConfirmTransaction(
      connection,
      finalTransaction,
      [wallet.payer]
    );

    const poolRecieveATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      poolPDA,
      true
    );

    const poolPayATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      poolPDA,
      true
    );

    const payerRecieveATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payerPayATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const finalPayerRecieveTokens = payerRecieveATA1.amount;

    console.log("-------------------------------------------------");
    console.log(`Pool Pay tokens: ${poolPayATA1.amount.toString()} \n`);
    console.log(`Pool Recieve tokens: ${poolRecieveATA1.amount.toString()} \n`);
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(`Payer Pay tokens: ${payerPayATA1.amount.toString()} \n`);
    console.log(
      `Payer Recieve tokens: ${payerRecieveATA1.amount.toString()} \n`
    );
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(
      `Recieve tokens: ${(
        finalPayerRecieveTokens - initialPayerRecieveTokens
      ).toString()}`
    );
  });

  it("[TEST] - 2 swap tokens", async () => {
    const assets = assetJson.assets;

    const [poolPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("liquidity_pool")],
      program.programId
    );

    const paySwapAsset = assets[0];
    const recieveSwapAsset = assets[1];

    const [payMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(paySwapAsset.name)],
      program.programId
    );

    const payMint = await getMint(connection, payMintPda);

    const [recieveMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(recieveSwapAsset.name)],
      program.programId
    );

    const poolRecieveATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      poolPDA,
      true
    );

    const poolPayATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      poolPDA,
      true
    );

    const payerRecieveATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payerPayATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payAmount = BigInt(25) * BigInt(10) ** BigInt(payMint.decimals);
    const initialPayerRecieveTokens = payerRecieveATA.amount;

    console.log("-------------------------------------------------");
    console.log(`Pool Pay tokens: ${poolPayATA.amount.toString()} \n`);
    console.log(`Pool Recieve tokens: ${poolRecieveATA.amount.toString()} \n`);
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(`Payer Pay tokens: ${payerPayATA.amount.toString()} \n`);
    console.log(
      `Payer Recieve tokens: ${payerRecieveATA.amount.toString()} \n`
    );
    console.log("-------------------------------------------------");

    console.log(
      `Attempting to swap ${payAmount} ${paySwapAsset.name} for ${recieveSwapAsset.name} \n`
    );

    const tx2 = await program.methods
      .swap(new anchor.BN(payAmount.toString()))
      .accounts({
        payerPayTokenAccount: payerPayATA.address,
        payerReceiveTokenAccount: payerRecieveATA.address,
        poolPayTokenAccount: poolPayATA.address,
        poolReceiveTokenAccount: poolRecieveATA.address,
        payMint: payMintPda,
        receiveMint: recieveMintPda,
      })
      .signers([wallet.payer])
      .transaction();

    const finalTransaction = new anchor.web3.Transaction().add(tx2);

    try {
      const sig = await anchor.web3.sendAndConfirmTransaction(
        connection,
        finalTransaction,
        [wallet.payer]
      );
    } catch (e) {
      console.log(e);
    }

    // console.log("sig: ", sig);

    const poolRecieveATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      poolPDA,
      true
    );

    const poolPayATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      poolPDA,
      true
    );

    const payerRecieveATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payerPayATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const finalPayerRecieveTokens = payerRecieveATA1.amount;

    console.log("-------------------------------------------------");
    console.log(`Pool Pay tokens: ${poolPayATA1.amount.toString()} \n`);
    console.log(`Pool Recieve tokens: ${poolRecieveATA1.amount.toString()} \n`);
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(`Payer Pay tokens: ${payerPayATA1.amount.toString()} \n`);
    console.log(
      `Payer Recieve tokens: ${payerRecieveATA1.amount.toString()} \n`
    );
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(
      `Recieve tokens: ${(
        finalPayerRecieveTokens - initialPayerRecieveTokens
      ).toString()}`
    );
  });

  it("[TEST] - 3 swap tokens", async () => {
    const assets = assetJson.assets;

    const [poolPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("liquidity_pool")],
      program.programId
    );

    const paySwapAsset = assets[0];
    const recieveSwapAsset = assets[1];

    const [payMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(paySwapAsset.name)],
      program.programId
    );

    const payMint = await getMint(connection, payMintPda);

    const [recieveMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(recieveSwapAsset.name)],
      program.programId
    );

    const poolRecieveATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      poolPDA,
      true
    );

    const poolPayATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      poolPDA,
      true
    );

    const payerRecieveATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payerPayATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payAmount = BigInt(25) * BigInt(10) ** BigInt(payMint.decimals);
    const initialPayerRecieveTokens = payerRecieveATA.amount;

    console.log("-------------------------------------------------");
    console.log(`Pool Pay tokens: ${poolPayATA.amount.toString()} \n`);
    console.log(`Pool Recieve tokens: ${poolRecieveATA.amount.toString()} \n`);
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(`Payer Pay tokens: ${payerPayATA.amount.toString()} \n`);
    console.log(
      `Payer Recieve tokens: ${payerRecieveATA.amount.toString()} \n`
    );
    console.log("-------------------------------------------------");

    console.log(
      `Attempting to swap ${payAmount} ${paySwapAsset.name} for ${recieveSwapAsset.name} \n`
    );

    const tx2 = await program.methods
      .swap(new anchor.BN(payAmount.toString()))
      .accounts({
        payerPayTokenAccount: payerPayATA.address,
        payerReceiveTokenAccount: payerRecieveATA.address,
        poolPayTokenAccount: poolPayATA.address,
        poolReceiveTokenAccount: poolRecieveATA.address,
        payMint: payMintPda,
        receiveMint: recieveMintPda,
      })
      .signers([wallet.payer])
      .transaction();

    const finalTransaction = new anchor.web3.Transaction().add(tx2);

    try {
      const sig = await anchor.web3.sendAndConfirmTransaction(
        connection,
        finalTransaction,
        [wallet.payer]
      );
    } catch (e) {
      console.log(e);
    }

    // console.log("sig: ", sig);

    const poolRecieveATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      poolPDA,
      true
    );

    const poolPayATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      poolPDA,
      true
    );

    const payerRecieveATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      recieveMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const payerPayATA1 = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      payMintPda,
      wallet.publicKey,
      false,
      "confirmed"
    );

    const finalPayerRecieveTokens = payerRecieveATA1.amount;

    console.log("-------------------------------------------------");
    console.log(`Pool Pay tokens: ${poolPayATA1.amount.toString()} \n`);
    console.log(`Pool Recieve tokens: ${poolRecieveATA1.amount.toString()} \n`);
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(`Payer Pay tokens: ${payerPayATA1.amount.toString()} \n`);
    console.log(
      `Payer Recieve tokens: ${payerRecieveATA1.amount.toString()} \n`
    );
    console.log("-------------------------------------------------");

    console.log("-------------------------------------------------");
    console.log(
      `Recieve tokens: ${(
        finalPayerRecieveTokens - initialPayerRecieveTokens
      ).toString()}`
    );
  });
});

const requistAirdropTransaction = async (
  connection: Connection,
  program: anchor.Program<SwapProgram>,
  wallet: anchor.Wallet,
  assetName: string,
  amount: number
) => {
  const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), Buffer.from(assetName)],
    program.programId
  );

  const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mintPda,
    wallet.publicKey
  );

  const tx = await program.methods
    .requestAirdrop(assetName, amount)
    .accounts({
      payerTokenAccount: payerTokenAccount.address,
    })
    .signers([wallet.payer])
    .transaction();

  console.log("-------------------------------------------------");
  console.log(`Token Name: ${assetName} \n`);
  console.log(`Airdropped ${amount} in ${payerTokenAccount.address} \n`);
  console.log("-------------------------------------------------");

  return tx;
};
