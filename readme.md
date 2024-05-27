# NBA Swap

## Overview
NBA Swap is a decentralized exchange (DEX) platform where tokens named after NBA teams can be swapped. Users can request airdrops for these tokens and swap them for any other token on the platform. The project is built using Anchor, Next.js.

## Table of Contents
1. [What is an AMM?](#what-is-an-amm)
2. [Anchor Folder Structure](#anchor-folder-structure)
3. [Project Overview](#project-overview)
4. [Getting Started](#getting-started)

## What is an AMM?

An Automated Market Maker (AMM) is a protocol used in decentralized exchanges to facilitate trading without the need for a traditional order book. Instead of matching buy and sell orders, AMMs use a mathematical formula to price assets.

### How AMMs Work
AMMs use liquidity pools, which are collections of funds locked in a smart contract. Users (liquidity providers) supply these pools with pairs of tokens. In return, they earn a portion of the trading fees when trades are executed against the pool.

### Common AMM Formulas
- **Constant Product Formula**: Used by Uniswap, defined as `x * y = k`, where `x` and `y` are the quantities of two tokens, and `k` is a constant.
- **Constant Sum Formula**: Ensures a fixed total amount of assets, providing different liquidity profiles.

## Anchor Folder Structure

Anchor is a framework for Solana's Sealevel runtime, providing several conveniences for developing and deploying Solana programs.

### Folder Structure
Here’s an overview of a typical Anchor project structure:
```
my-anchor-project/
├── app/                             # Frontend application (Next.js)
├── programs/                        # Solana programs (smart contracts)
│ └── my_program/
│ ├── src/                           # Source code for the Solana program
│ │ ├── lib.rs                       # Main entry point for the program
│ │ └── other files...
│ └── Cargo.toml                     # Rust dependencies and project configuration
├── tests/                           # Integration tests
│ └── my_program.ts                  # TS test files
├── migrations/                      # Deployment scripts
│ └── deploy.ts
├── Anchor.toml                      # Anchor configuration file
└── Cargo.toml                       # Project dependencies and configuration
```

## Project Overview

### Features
- **Airdrop**: Users can request airdrops for tokens named after NBA teams.
- **Token Swap**: Allows users to swap their airdropped tokens for other tokens on the platform.
- **Decentralized**: Built on the Solana blockchain for fast and secure transactions.

### Technologies Used
- **Solana**: High-performance blockchain used for deploying the smart contracts.
- **Anchor**: Framework for building secure Solana programs.
- **Next.js**: React framework for building the frontend application.

### How It Works
1. **Request Airdrop**: Users can request airdrops for their favorite NBA team tokens.
2. **Swap Tokens**: Users can swap their NBA team tokens for other tokens using the platform’s AMM.

## Getting Started

### Prerequisites
- Node.js
- Rust and Cargo
- Solana CLI
- Anchor CLI

### Installation
1. Clone the repo
2. npm install
3. `anchor build && anchor deploy`
4. `anchor test`
5. `cd app && npm install && npm run quick-dev && npm run dev`