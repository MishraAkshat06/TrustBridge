# Adversarial Challenge Report: Escrow & Headroom Logic (Milestone B / M2)

## Challenge Summary

**Overall risk assessment**: MEDIUM-HIGH
**Final Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

Direct examination of the smart contracts, context providers, pages, and test suites revealed the following:

1. **HTML5 Form Constraint Validation Blocks Over-Cap Submissions (`frontend/src/pages/CampaignDetails.jsx:561, 573`)**:
   - Line 561: `<form onSubmit={handleContributeSubmit} className="space-y-4">`
   - Line 573: `<input type="number" step="0.01" min="0.01" max={remaining} value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} ... />`
   - Line 671: `"If contribution exceeds remaining capacity, excess ETH is automatically refunded within the same block."`
   - **Verbatim Error in Browser**: When headroom is 5.5 ETH and user attempts to input 6.0 ETH to test the excess refund mechanism, standard HTML5 browser validation intercepts the submit event with native browser tooltip: `Value must be less than or equal to 5.5`. The `onSubmit` handler is never triggered.

2. **In-Block Excess Refund Arithmetic Correct in Smart Contract & Context**:
   - `contracts/TrustBridge.sol:134-147`:
     ```solidity
     uint256 remainingCap = hardCap - totalRaised;
     uint256 acceptedAmount = msg.value > remainingCap ? remainingCap : msg.value;
     uint256 excessAmount = msg.value - acceptedAmount;
     totalRaised += acceptedAmount;
     contributions[msg.sender] += acceptedAmount;
     emit ContributionReceived(msg.sender, acceptedAmount, totalRaised);
     if (excessAmount > 0) {
         emit ExcessRefundIssued(msg.sender, excessAmount);
         (bool refundOk, ) = payable(msg.sender).call{value: excessAmount}("");
         require(refundOk, "Excess refund transfer failed");
     }
     ```
   - `frontend/src/context/AppContext.jsx:284-288`:
     ```javascript
     const remaining = Math.max(0, hardCap - c.totalRaised);
     accepted = Number(Math.min(val, remaining).toFixed(4));
     refunded = Number(Math.max(0, val - accepted).toFixed(4));
     ```
     For input 6.0 ETH on 5.5 ETH headroom: `accepted = 5.5000`, `refunded = 0.5000`, invariant `accepted + refunded == 6.0000` strictly preserved.

3. **Headroom Boundary Invariants (0 ETH, 14.5 ETH, 20 ETH)**:
   - At 0.0 ETH raised: Headroom = 20.00 ETH, Min goal headroom = 10.00 ETH, Progress = 0%.
   - At 14.5 ETH raised: Headroom = 5.50 ETH, Progress = 73%.
   - At 20.0 ETH saturated: Headroom = 0.00 ETH, Progress = 100%, Button disabled (`disabled={remaining <= 0}`), label text displays "Hard Cap Saturated (20.00 ETH)". Subsequent contract call reverts with `"Hard cap reached"`.

4. **Disconnected Wallet Flow (`CampaignDetails.jsx:654-665` & `AppContext.jsx:313`)**:
   - When MetaMask is disconnected, `account` is `''` and `balance` is `'0.0000'`.
   - In `CampaignDetails.jsx:654`, the contribute button only checks `disabled={remaining <= 0}` and displays `"Contribute via MetaMask"`.
   - When clicked while disconnected, `AppContext.jsx:313` silently falls back to actor `'0x7B2a...4Fa1'` without prompting `connectWallet()`.

---

## 2. Logic Chain

1. **Step 1 (Headroom Verification)**:
   - Traced calculation `Math.max(0, hardCap - totalRaised)` across `contracts/TrustBridge.sol`, `AppContext.jsx`, and `CampaignDetails.jsx`.
   - Verified that for 0 ETH raised, remaining is 20.00 ETH; for 14.5 ETH raised, remaining is 5.50 ETH; for 20.00 ETH raised, remaining is 0.00 ETH. Invariant `0 <= headroom <= 20.0 ETH` holds universally.

2. **Step 2 (Excess Refund Mechanism)**:
   - Traced input `6.0 ETH` against `5.5 ETH` remaining headroom.
   - Smart contract and `AppContext.jsx` compute `accepted = 5.5 ETH`, `refunded = 0.5 ETH`.
   - State machine triggers `EXCESS_REFUND` view displaying dual receipts ("Locked in Vault: 5.5000 ETH", "In-Block Refund: 0.5000 ETH").
   - **However**, in `CampaignDetails.jsx:573`, `<input max={remaining}>` without `noValidate` on the enclosing `<form>` aborts submission in browser environments, making this feature unreachable through the form.

3. **Step 3 (Wallet Disconnect Verification)**:
   - Tested disconnect state: `account === ''`.
   - Disconnect cleanly sets `balance = '0.0000'` and displays `"Not Connected"` in `WalletManagement.jsx`.
   - But in `CampaignDetails.jsx`, the button remains enabled as "Contribute via MetaMask" and executes via the sandbox fallback wallet instead of prompting the user to connect.

---

## 3. Caveats

- Node test runner `tests/runner.js` exercises JavaScript oracle methods directly, bypassing HTML5 DOM form constraint validation. Thus the 63 test suite passes while the web UI form encounters the `max={remaining}` blockage in live browsers.
- Real-world MetaMask RPC network switching depends on client extension permissions.

---

## 4. Challenges & Failure Modes

### [HIGH] Challenge 1: HTML5 Input `max` Constraint Blocks In-Block Excess Refund Submission in UI
- **Assumption challenged**: User can test over-cap contributions (e.g. 6 ETH input on 5.5 ETH headroom) in the UI.
- **Attack scenario**: Contributor types `6.0` into the contribution input when remaining headroom is `5.5`. Contributor clicks "Contribute via MetaMask".
- **Blast radius**: The browser triggers native constraint validation (`rangeOverflow`) and refuses to submit the form. The user cannot back the project with over-cap amounts, and the in-block excess refund dual-receipt is blocked from appearing.
- **Mitigation**: In `frontend/src/pages/CampaignDetails.jsx`:
  1. Add `noValidate` to `<form onSubmit={handleContributeSubmit} noValidate className="space-y-4">`, OR
  2. Remove `max={remaining}` from `<input>` (relying on the smart contract / AppContext to process the split and in-block refund as designed).

### [MEDIUM] Challenge 2: Unconnected Wallet Submits Under Sandbox Fallback Without Prompt
- **Assumption challenged**: Submitting contribution requires an active wallet or prompts wallet connection.
- **Attack scenario**: User disconnects MetaMask via `WalletManagement.jsx` (`account = ''`), navigates to `CampaignDetails.jsx`, and clicks "Contribute via MetaMask".
- **Blast radius**: The transaction executes without prompting MetaMask or informing the user, attributing the contribution to fallback account `0x7B2a...4Fa1`.
- **Mitigation**: Update button in `CampaignDetails.jsx`: if `!account`, label button "Connect Wallet to Back" and wire `onClick={connectWallet}`.

---

## 5. Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| **0 ETH Raised** | Headroom = 20.00 ETH, 0% progress, min goal headroom = 10.00 ETH | Headroom = 20.00 ETH, 0% progress, min goal headroom = 10.00 ETH | **PASS** |
| **14.5 ETH Raised** | Headroom = 5.50 ETH, 73% progress | Headroom = 5.50 ETH, 73% progress | **PASS** |
| **20.0 ETH Saturated** | Headroom = 0.00 ETH, 100% progress, button disabled with "Hard Cap Saturated" | Headroom = 0.00 ETH, 100% progress, button disabled with "Hard Cap Saturated" | **PASS** |
| **Excess Refund (Contract/Context)** | 6.0 ETH input on 5.5 ETH headroom -> 5.5 ETH accepted, 0.5 ETH in-block refund | Accepted = 5.5000 ETH, Refunded = 0.5000 ETH, dual receipt generated | **PASS** |
| **Excess Refund (Browser UI Form)** | Form submits 6.0 ETH and triggers `EXCESS_REFUND` receipt modal | Blocked by HTML5 `max="5.5"` validation popup | **FAIL** |
| **MetaMask Disconnect Lifecycle** | `account` cleared to `''`, balance reset to `'0.0000'`, WalletManagement shows "Not Connected" | Cleanly clears account and balance, shows "Not Connected" | **PASS** |
| **MetaMask Disconnect Contribute Flow** | Prompt wallet connection before accepting deposit | Silently attributes deposit to fallback address `0x7B2a...4Fa1` | **WARN** |

---

## 6. Unchallenged Areas

- Hardware cold wallet (Ledger/Trezor) WebHID connections (out of scope for Sepolia software testnet).

---

## 7. Conclusion

The core escrow math, headroom boundary calculations (0 ETH, 14.5 ETH, 20 ETH), and dual-receipt excess refund engine in `TrustBridge.sol` and `AppContext.jsx` are sound.

However, a **HIGH** severity UI obstruction was discovered in `frontend/src/pages/CampaignDetails.jsx`: the HTML input attribute `max={remaining}` on line 573 actively prevents form submission when over-cap contributions (e.g. 6 ETH) are entered, blocking the user from testing or using the in-block excess refund flow.

**Verdict**: **REQUEST_CHANGES**
**Required Fix**:
1. In `frontend/src/pages/CampaignDetails.jsx`: Add `noValidate` to `<form>` (line 561) and remove `max={remaining}` from the `<input>` (line 573).
2. (Recommended): In `frontend/src/pages/CampaignDetails.jsx`: When `!account`, prompt `connectWallet()` instead of silently executing under fallback wallet.

---

## 8. Verification Method

1. Inspect `frontend/src/pages/CampaignDetails.jsx` line 561 and 573 to confirm `<form>` lacks `noValidate` and `<input>` enforces `max={remaining}`.
2. In browser, navigate to active campaign (`totalRaised = 14.5`, `remaining = 5.5`), input `6.0` ETH into the contribution input, and attempt form submission.
3. Apply the recommended patch (`noValidate` on `<form>`, remove `max={remaining}`) and verify that input `6.0` submits smoothly, displays the `EXCESS_REFUND` dual receipt (5.5 ETH locked / 0.5 ETH in-block refund), and updates the vault total to 20.00 ETH.
