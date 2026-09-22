import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("TrustBridge Comprehensive Smart Contract Suite", function () {
  async function deployFixture() {
    const [creator, verifier, user1, user2, whale, attacker] = await ethers.getSigners();
    const duration = 30 * 24 * 3600; // 30 days

    const TrustBridge = await ethers.getContractFactory("TrustBridge");
    const contract = await TrustBridge.connect(creator).deploy(
      verifier.address,
      duration,
      "Architecture & Prototype",
      "Testnet Launch & Audits",
      "Security Verification",
      "Production Handover"
    );
    await contract.waitForDeployment();

    return { contract, creator, verifier, user1, user2, whale, attacker, duration };
  }

  // =========================================================================
  // 1. Deployment & Immutables
  // =========================================================================
  describe("Deployment & Constants", function () {
    it("initializes immutable rules: 10 ETH goal, 20 ETH hard cap, active state", async function () {
      const { contract, creator, verifier } = await deployFixture();

      expect(await contract.minGoal()).to.equal(ethers.parseEther("10.0"));
      expect(await contract.hardCap()).to.equal(ethers.parseEther("20.0"));
      expect(await contract.creator()).to.equal(creator.address);
      expect(await contract.verifier()).to.equal(verifier.address);
      expect(await contract.state()).to.equal(0); // ACTIVE
      expect(await contract.totalRaised()).to.equal(0);
      expect(await contract.totalWithdrawn()).to.equal(0);
      expect(await contract.currentMilestoneIndex()).to.equal(0);

      // Check initial milestone configurations
      const m0 = await contract.getMilestone(0);
      expect(m0.trancheBps).to.equal(2000); // 20%
      expect(m0.milestoneState).to.equal(0); // PENDING
      expect(m0.trancheClaimed).to.equal(false);

      const m1 = await contract.getMilestone(1);
      expect(m1.trancheBps).to.equal(2500); // 25%

      const m2 = await contract.getMilestone(2);
      expect(m2.trancheBps).to.equal(2500); // 25%

      const m3 = await contract.getMilestone(3);
      expect(m3.trancheBps).to.equal(3000); // 30%
    });

    it("reverts deployment with invalid verifier address or zero duration", async function () {
      const TrustBridge = await ethers.getContractFactory("TrustBridge");
      await expect(
        TrustBridge.deploy(ethers.ZeroAddress, 3600, "m1", "m2", "m3", "m4")
      ).to.be.revertedWith("Invalid verifier");

      const [creator, verifier] = await ethers.getSigners();
      await expect(
        TrustBridge.deploy(verifier.address, 0, "m1", "m2", "m3", "m4")
      ).to.be.revertedWith("Invalid duration");
    });
  });

  // =========================================================================
  // 2. Boundary: Hard-Cap Headroom & In-Block Excess Refund
  // =========================================================================
  describe("Hard-Cap Headroom & In-Block Excess Refund Split", function () {
    it("accepts deposit within capacity and tracks totalRaised accurately", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).contribute({ value: ethers.parseEther("14.5") });

      expect(await contract.totalRaised()).to.equal(ethers.parseEther("14.5"));
      expect(await contract.contributions(user1.address)).to.equal(ethers.parseEther("14.5"));
      expect(await ethers.provider.getBalance(contract.target)).to.equal(ethers.parseEther("14.5"));
    });

    it("splits massive over-cap deposit: accepts remaining headroom and refunds excess in same tx", async function () {
      const { contract, user1, whale } = await deployFixture();
      await contract.connect(user1).contribute({ value: ethers.parseEther("15.0") }); // 5.0 ETH left

      const whaleBalBefore = await ethers.provider.getBalance(whale.address);
      // Whale sends 10 ETH into 5 ETH headroom
      const tx = await contract.connect(whale).contribute({ value: ethers.parseEther("10.0") });
      const receipt = await tx.wait();
      const gasFee = receipt.gasUsed * receipt.gasPrice;
      const whaleBalAfter = await ethers.provider.getBalance(whale.address);

      // Only 5.0 ETH was accepted
      expect(await contract.totalRaised()).to.equal(ethers.parseEther("20.0"));
      expect(await contract.contributions(whale.address)).to.equal(ethers.parseEther("5.0"));

      // 5.0 ETH was refunded back to whale
      expect(whaleBalBefore - whaleBalAfter - gasFee).to.equal(ethers.parseEther("5.0"));
      // Hard cap reached triggers IN_PROGRESS and auto-approves milestone 0
      expect(await contract.state()).to.equal(2); // IN_PROGRESS
      expect(await contract.currentMilestoneIndex()).to.equal(1);
    });

    it("reverts subsequent deposit when hard cap is saturated", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).contribute({ value: ethers.parseEther("20.0") });

      await expect(
        contract.connect(user2).contribute({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Campaign not active");
    });
  });

  // =========================================================================
  // 3. Minimum Goal Threshold & Refund Guarantees
  // =========================================================================
  describe("Minimum Goal Threshold & Expiry Settling", function () {
    it("allows finalization to FAILED and full 100% refund when goal unmet past deadline", async function () {
      const { contract, user1, user2, duration } = await deployFixture();
      await contract.connect(user1).contribute({ value: ethers.parseEther("4.0") });
      await contract.connect(user2).contribute({ value: ethers.parseEther("3.0") }); // Total 7 ETH < 10 ETH

      // Revert if finalizing before deadline
      await expect(contract.finalizeFunding()).to.be.revertedWith("Funding still ongoing");

      // Advance time past deadline
      await ethers.provider.send("evm_increaseTime", [duration + 10]);
      await ethers.provider.send("evm_mine");

      // Finalize funding
      await expect(contract.finalizeFunding())
        .to.emit(contract, "CampaignFailed")
        .withArgs(ethers.parseEther("7.0"));
      expect(await contract.state()).to.equal(4); // FAILED

      // User1 claims full refund
      const u1Before = await ethers.provider.getBalance(user1.address);
      const tx1 = await contract.connect(user1).claimRefund();
      const r1 = await tx1.wait();
      const u1After = await ethers.provider.getBalance(user1.address);
      expect(u1After + (r1.gasUsed * r1.gasPrice) - u1Before).to.equal(ethers.parseEther("4.0"));

      // User2 claims full refund
      const u2Before = await ethers.provider.getBalance(user2.address);
      const tx2 = await contract.connect(user2).claimRefund();
      const r2 = await tx2.wait();
      const u2After = await ethers.provider.getBalance(user2.address);
      expect(u2After + (r2.gasUsed * r2.gasPrice) - u2Before).to.equal(ethers.parseEther("3.0"));

      // Second claim attempt must revert
      await expect(contract.connect(user1).claimRefund()).to.be.revertedWith("No contribution to refund");
    });

    it("allows finalization to IN_PROGRESS when minGoal reached at deadline", async function () {
      const { contract, user1, duration } = await deployFixture();
      await contract.connect(user1).contribute({ value: ethers.parseEther("12.0") }); // 12 ETH >= 10 ETH

      await ethers.provider.send("evm_increaseTime", [duration + 10]);
      await ethers.provider.send("evm_mine");

      await expect(contract.finalizeFunding())
        .to.emit(contract, "CampaignFunded")
        .withArgs(ethers.parseEther("12.0"));
      expect(await contract.state()).to.equal(2); // IN_PROGRESS
      expect(await contract.currentMilestoneIndex()).to.equal(1);
    });
  });

  // =========================================================================
  // 4. Milestone Lifecycle & Sequential 4-Tranche Stepper
  // =========================================================================
  describe("4-Tranche Sequential Stepper & Pull-Payment Withdrawals", function () {
    it("completes full sequence: 20% -> 25% -> 25% -> 30% payouts", async function () {
      const { contract, creator, verifier, user1 } = await deployFixture();
      await contract.connect(user1).contribute({ value: ethers.parseEther("20.0") });

      // Tranche 0: 20% = 4 ETH
      let b0 = await ethers.provider.getBalance(creator.address);
      let tx0 = await contract.connect(creator).withdrawTranche(0);
      let r0 = await tx0.wait();
      let b1 = await ethers.provider.getBalance(creator.address);
      expect(b1 + (r0.gasUsed * r0.gasPrice) - b0).to.equal(ethers.parseEther("4.0"));

      // Milestone 1: 25% = 5 ETH
      await contract.connect(creator).submitMilestoneEvidence("ipfs://qm-testnet-launch");
      await contract.connect(verifier).approveMilestone(1);
      let b2 = await ethers.provider.getBalance(creator.address);
      let tx1 = await contract.connect(creator).withdrawTranche(1);
      let r1 = await tx1.wait();
      let b3 = await ethers.provider.getBalance(creator.address);
      expect(b3 + (r1.gasUsed * r1.gasPrice) - b2).to.equal(ethers.parseEther("5.0"));

      // Milestone 2: 25% = 5 ETH
      await contract.connect(creator).submitMilestoneEvidence("ipfs://qm-security-audit");
      await contract.connect(verifier).approveMilestone(2);
      let b4 = await ethers.provider.getBalance(creator.address);
      let tx2 = await contract.connect(creator).withdrawTranche(2);
      let r2 = await tx2.wait();
      let b5 = await ethers.provider.getBalance(creator.address);
      expect(b5 + (r2.gasUsed * r2.gasPrice) - b4).to.equal(ethers.parseEther("5.0"));

      // Milestone 3: 30% = 6 ETH
      await contract.connect(creator).submitMilestoneEvidence("ipfs://qm-production-handover");
      await contract.connect(verifier).approveMilestone(3);
      expect(await contract.state()).to.equal(3); // COMPLETED

      let b6 = await ethers.provider.getBalance(creator.address);
      let tx3 = await contract.connect(creator).withdrawTranche(3);
      let r3 = await tx3.wait();
      let b7 = await ethers.provider.getBalance(creator.address);
      expect(b7 + (r3.gasUsed * r3.gasPrice) - b6).to.equal(ethers.parseEther("6.0"));

      // All 20 ETH withdrawn
      expect(await contract.totalWithdrawn()).to.equal(ethers.parseEther("20.0"));
      expect(await ethers.provider.getBalance(contract.target)).to.equal(0);
    });

    it("prevents double-withdrawal of same tranche", async function () {
      const { contract, creator, user1 } = await deployFixture();
      await contract.connect(user1).contribute({ value: ethers.parseEther("20.0") });

      await contract.connect(creator).withdrawTranche(0);
      await expect(contract.connect(creator).withdrawTranche(0)).to.be.revertedWith("Tranche already withdrawn");
    });
  });

  // =========================================================================
  // 5. Milestone Retry Limit & Pro-Rata Refund Split
  // =========================================================================
  describe("Milestone Retry Grace Period & Fair Pro-Rata Refund", function () {
    it("allows exactly 1 retry after initial rejection; second rejection moves campaign to REFUNDABLE", async function () {
      const { contract, creator, verifier, user1, user2 } = await deployFixture();
      // User 1 gives 15 ETH, User 2 gives 5 ETH (Total 20 ETH)
      await contract.connect(user1).contribute({ value: ethers.parseEther("15.0") });
      await contract.connect(user2).contribute({ value: ethers.parseEther("5.0") });

      // Creator claims tranche 0 (4 ETH) -> Remaining escrow = 16 ETH
      await contract.connect(creator).withdrawTranche(0);

      // Attempt 1: submit -> reject
      await contract.connect(creator).submitMilestoneEvidence("ipfs://attempt-1");
      await contract.connect(verifier).rejectMilestone(1);
      expect(await contract.state()).to.equal(2); // IN_PROGRESS

      // Attempt 2 (grace period retry): submit -> reject -> REFUNDABLE
      await contract.connect(creator).submitMilestoneEvidence("ipfs://attempt-2");
      await expect(contract.connect(verifier).rejectMilestone(1))
        .to.emit(contract, "MilestoneRejected")
        .withArgs(1, 2, true);
      expect(await contract.state()).to.equal(5); // REFUNDABLE

      // Subsequent submission attempt blocked
      await expect(
        contract.connect(creator).submitMilestoneEvidence("ipfs://attempt-3")
      ).to.be.revertedWith("Campaign not in progress");

      // User1 (15 ETH out of 20 ETH = 75%) claims pro-rata of 16 ETH = 12 ETH
      const u1Before = await ethers.provider.getBalance(user1.address);
      const tx1 = await contract.connect(user1).claimRefund();
      const r1 = await tx1.wait();
      const u1After = await ethers.provider.getBalance(user1.address);
      expect(u1After + (r1.gasUsed * r1.gasPrice) - u1Before).to.equal(ethers.parseEther("12.0"));

      // User2 (5 ETH out of 20 ETH = 25%) claims pro-rata of 16 ETH = 4 ETH
      const u2Before = await ethers.provider.getBalance(user2.address);
      const tx2 = await contract.connect(user2).claimRefund();
      const r2 = await tx2.wait();
      const u2After = await ethers.provider.getBalance(user2.address);
      expect(u2After + (r2.gasUsed * r2.gasPrice) - u2Before).to.equal(ethers.parseEther("4.0"));

      // Vault is cleanly drained to 0
      expect(await ethers.provider.getBalance(contract.target)).to.equal(0);
    });
  });

  // =========================================================================
  // 6. Access Control & Adversarial Security Invariants
  // =========================================================================
  describe("Access Control & Attack Surface Hardening", function () {
    it("rejects unauthorized access across creator, verifier, and fallback methods", async function () {
      const { contract, creator, verifier, user1, attacker } = await deployFixture();
      await contract.connect(user1).contribute({ value: ethers.parseEther("20.0") });

      // Non-creator cannot submit evidence
      await expect(
        contract.connect(attacker).submitMilestoneEvidence("ipfs://fake")
      ).to.be.revertedWith("Only creator permitted");

      // Creator submits evidence
      await contract.connect(creator).submitMilestoneEvidence("ipfs://evidence-1");

      // Non-verifier cannot approve milestone
      await expect(
        contract.connect(attacker).approveMilestone(1)
      ).to.be.revertedWith("Only verifier permitted");

      // Non-verifier cannot reject milestone
      await expect(
        contract.connect(attacker).rejectMilestone(1)
      ).to.be.revertedWith("Only verifier permitted");

      // Verifier approves milestone
      await contract.connect(verifier).approveMilestone(1);

      // Non-creator cannot withdraw approved tranche
      await expect(
        contract.connect(attacker).withdrawTranche(1)
      ).to.be.revertedWith("Only creator permitted");

      // Plain ETH send directly to contract reverts
      await expect(
        attacker.sendTransaction({ to: contract.target, value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Use contribute() function");
    });

    it("neutralizes reentrancy exploit via nonReentrant guard", async function () {
      const { contract, duration } = await deployFixture();

      const MaliciousReceiverFactory = await ethers.getContractFactory("MaliciousReceiver");
      const hostile = await MaliciousReceiverFactory.deploy(contract.target);
      await hostile.waitForDeployment();

      // Hostile contract contributes 5 ETH
      await hostile.contribute({ value: ethers.parseEther("5.0") });

      // Expire campaign to FAILED
      await ethers.provider.send("evm_increaseTime", [duration + 10]);
      await ethers.provider.send("evm_mine");
      await contract.finalizeFunding();

      // Hostile contract attempts reentrancy during claimRefund()
      await expect(hostile.claim()).to.be.revertedWith("Refund transfer failed");
    });
  });
});
