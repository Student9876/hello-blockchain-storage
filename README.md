# Hello Blockchain

A simple Web3 dApp built with Next.js that demonstrates basic blockchain interaction. Users can connect their wallet, read messages from and write messages to a smart contract on the Sepolia testnet.

## Features

- Connect MetaMask wallet
- Read messages from smart contract
- Write new messages to the blockchain
- View transaction history
- Responsive design for mobile and desktop

## Prerequisites

- Node.js 16+ and npm
- MetaMask browser extension
- Some Sepolia testnet ETH for transactions

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_DEPLOYMENT_BLOCK=your_deployment_block
NEXT_PUBLIC_CHAIN_ID=0xaa36a7  # Sepolia testnet
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser

## Usage

1. Click "Connect Wallet" to connect your MetaMask
2. View the currently stored message
3. Enter a new message and click "Set Message" to update
4. View transaction history in the table below
5. Click "View" to see transaction details on Etherscan

## Smart Contract

The dApp interacts with a simple storage contract deployed on Sepolia testnet. The contract allows:
- Reading the current message
- Setting a new message
- Emitting events for message updates

## Technology Stack

- Next.js 13+
- ethers.js
- Tailwind CSS
- MetaMask

## Network

This dApp runs on Sepolia testnet. Make sure your MetaMask is configured for Sepolia and you have some test ETH.

## Getting Sepolia ETH

You can get Sepolia testnet ETH from:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://sepoliafaucet.com/)
