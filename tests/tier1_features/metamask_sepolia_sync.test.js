/**
 * Tier 1: Feature Coverage - MetaMask Sepolia Live Synchronization
 * Requirements:
 * - Wallet connection via MetaMask Sepolia properly updates live account address and balance.
 * - Truncated address formatting (0x7B2a...4Fa1).
 * - Live balance formatting in ETH.
 * - Sepolia network verification (Chain ID 11155111 / 0xaa36a7).
 * - Dynamic event listeners (accountsChanged, chainChanged).
 */

import { assert, assertEqual } from '../helpers/assert.js';
import { CONSTANTS } from '../helpers/contract_oracle.js';
import { WalletSyncSimulator } from '../helpers/state_oracle.js';

export async function runMetaMaskSepoliaSyncTests() {
  const results = [];

  // --------------------------------------------------------------------------
  // Test 6.1: Account Connection and Truncated Address Formatting
  // --------------------------------------------------------------------------
  (() => {
    const wallet = new WalletSyncSimulator();
    assertEqual(wallet.isConnected, false, 'Should be disconnected initially');
    assertEqual(wallet.getTruncatedAddress(), 'Connect', 'Unconnected address chip shows Connect');

    const connected = wallet.connect('0x7B2aB43a8B4512CdEf8798C3953508495a024Fa1', 5.25);
    assertEqual(wallet.isConnected, true, 'Wallet is connected');
    assertEqual(wallet.account, '0x7b2ab43a8b4512cdef8798c3953508495a024fa1', 'Normalized address');
    assertEqual(wallet.getTruncatedAddress(), '0x7b2a...4fa1', 'Truncated address format matches navbar chip');
    results.push({ name: 'Wallet 6.1: Connection updates account state with truncated address format', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 6.2: Live Balance Synchronization and 4-Decimal Formatting
  // --------------------------------------------------------------------------
  (() => {
    const wallet = new WalletSyncSimulator();
    wallet.connect('0xAccount1', 4.82158);

    assertEqual(wallet.getFormattedBalance(), '4.8215', 'Balance formatted to 4 decimal places');
    assertEqual(wallet.balanceWei, 4821580000000000000n, 'Wei balance exact BigInt conversion');
    results.push({ name: 'Wallet 6.2: Live balance formatted accurately to 4 decimals with BigInt precision', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 6.3: Sepolia Chain ID (11155111 / 0xaa36a7) Validation
  // --------------------------------------------------------------------------
  (() => {
    const wallet = new WalletSyncSimulator({ initialChainId: CONSTANTS.SEPOLIA_CHAIN_ID });
    assertEqual(wallet.isSepolia(), true, 'Chain ID 11155111 is recognized as Sepolia');

    // Test switching to Ethereum Mainnet (Chain ID 1)
    const isStillSepolia = wallet.switchChain(1);
    assertEqual(isStillSepolia, false, 'Chain ID 1 is not Sepolia');
    assertEqual(wallet.isSepolia(), false, 'Wallet flags non-Sepolia network');

    // Switch back via hex '0xaa36a7'
    wallet.switchChain('0xaa36a7');
    assertEqual(wallet.isSepolia(), true, 'Hex 0xaa36a7 correctly resolves to Sepolia');
    results.push({ name: 'Wallet 6.3: Sepolia network check enforces Chain ID 11155111 and flags non-Sepolia', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 6.4: Reactive Event Listeners for accountsChanged and chainChanged
  // --------------------------------------------------------------------------
  (() => {
    const wallet = new WalletSyncSimulator();
    let accountUpdateReceived = null;
    let chainUpdateReceived = null;

    wallet.on('accountsChanged', (accounts) => {
      accountUpdateReceived = accounts[0] || '';
    });

    wallet.on('chainChanged', (newChain) => {
      chainUpdateReceived = newChain;
    });

    wallet.connect('0xNewUserAddress9999', 10.0);
    assertEqual(accountUpdateReceived, '0xnewuseraddress9999', 'accountsChanged listener triggered');

    wallet.switchChain(11155111);
    assertEqual(chainUpdateReceived, 11155111, 'chainChanged listener triggered');
    results.push({ name: 'Wallet 6.4: Event listeners react dynamically to accountsChanged and chainChanged', passed: true });
  })();

  // --------------------------------------------------------------------------
  // Test 6.5: Disconnect and Sandbox Fallback
  // --------------------------------------------------------------------------
  (() => {
    const wallet = new WalletSyncSimulator();
    wallet.connect('0xUserActive', 3.5);
    assertEqual(wallet.isConnected, true);

    wallet.disconnect();
    assertEqual(wallet.isConnected, false, 'State marked disconnected');
    assertEqual(wallet.account, '', 'Account cleared');
    assertEqual(wallet.getFormattedBalance(), '0.0000', 'Balance reset to 0');
    assertEqual(wallet.getTruncatedAddress(), 'Connect');
    results.push({ name: 'Wallet 6.5: Disconnection clears state cleanly and resets balance to 0.0000', passed: true });
  })();

  return results;
}
