---
name: web3-escrow-orchestrator
description: >-
  Manage Web3 wallet bindings (MetaMask, Ethers.js v6), live Sepolia RPC sync,
  deterministic 4-state transaction drawers, and pull-payment escrow executions.
---

# Web3 Escrow Orchestrator Skill

## Key Operational Guidelines
1. **Real RPC & Wallet Transactions**:
   - Never fabricate `txHash` or simulated block numbers.
   - All contract calls (`contribute`, `withdrawTranche`, `claimRefund`) must execute via user-signed `ethers.Contract` transactions on Sepolia.
2. **Ethers v6 Precision**:
   - Never convert wei or BigInt values via JavaScript `Number` (drops precision past 2^53).
   - Use `ethers.parseEther()` and `ethers.formatEther()`.
3. **4-State Transaction Drawer**:
   - `1. Signature Request`: Prompting MetaMask.
   - `2. Broadcast Pending`: Hash emitted, awaiting block inclusion.
   - `3. Block Confirmation`: Mined on Sepolia, updating UI state.
   - `4. Reverted / Failure`: Extract exact revert string and render in error banner.
4. **Auth Guard & Session State**:
   - Restrict access to internal platform routes (`/campaigns`, `/dashboard`, `/verifier`) to authenticated users.
