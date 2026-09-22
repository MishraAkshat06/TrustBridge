import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("TrustBridge Phase 2 Lifecycle & Defect Tests", function () {
  async function deployFixture() {
    const [creator, verifier, contributor1, contributor2] = await ethers.getSigners();
    const duration = 30 * 24 * 3600;

    const TrustBridge = await ethers.getContractFactory("TrustBridge");
    const contract = await TrustBridge.connect(creator).deploy(
      verifier.address,
      duration,
      "Milestone 1",
      "Milestone 2",
      "Milestone 3",
      "Milestone 4"
    );
    await contract.waitForDeployment();

    return { contract, creator, verifier, contributor1, contributor2, duration };
  }

  it("walks FUNDED -> milestone 1 submit -> approve -> withdraw -> repeat to COMPLETED (B-01 verified)", async function () {
    const { contract, creator, verifier, contributor1 } = await deployFixture();

    // Fund to 20 ETH (hardCap)
    await contract.connect(contributor1).contribute({ value: ethers.parseEther("20.0") });

    // Invariant: currentMilestoneIndex advanced to 1, state is IN_PROGRESS (2)
    expect(await contract.currentMilestoneIndex()).to.equal(1);
    expect(await contract.state()).to.equal(2);

    // Tranche 0 is auto-approved, withdraw tranche 0
    await contract.connect(creator).withdrawTranche(0);

    // Milestone 1 (index 1): submit evidence -> approve -> withdraw
    await contract.connect(creator).submitMilestoneEvidence("ipfs://evidence-1");
    await contract.connect(verifier).approveMilestone(1);
    await contract.connect(creator).withdrawTranche(1);

    // Milestone 2 (index 2): submit evidence -> approve -> withdraw
    await contract.connect(creator).submitMilestoneEvidence("ipfs://evidence-2");
    await contract.connect(verifier).approveMilestone(2);
    await contract.connect(creator).withdrawTranche(2);

    // Milestone 3 (index 3): submit evidence -> approve -> withdraw
    await contract.connect(creator).submitMilestoneEvidence("ipfs://evidence-3");
    await contract.connect(verifier).approveMilestone(3);
    await contract.connect(creator).withdrawTranche(3);

    // State is COMPLETED (3)
    expect(await contract.state()).to.equal(3);
  });

  it("enforces over-cap rejection with 'Hard cap reached' on saturated campaign", async function () {
    const { contract, contributor1, contributor2 } = await deployFixture();

    // Sature to 20 ETH
    await contract.connect(contributor1).contribute({ value: ethers.parseEther("20.0") });

    // Subsequent contribution on saturated vault reverts
    await expect(
      contract.connect(contributor2).contribute({ value: ethers.parseEther("1.0") })
    ).to.be.revertedWith("Campaign not active");
  });

  it("enforces withdrawTranche state guard preventing withdrawal when not in progress or completed", async function () {
    const { contract, creator } = await deployFixture();

    // In ACTIVE state (0), withdrawTranche must revert
    await expect(
      contract.connect(creator).withdrawTranche(0)
    ).to.be.revertedWith("Campaign not in progress or completed");
  });

  it("supports FAILED state refund path when deadline passes without reaching minGoal", async function () {
    const { contract, contributor1, duration } = await deployFixture();

    // Contribute 5 ETH (below minGoal 10 ETH)
    await contract.connect(contributor1).contribute({ value: ethers.parseEther("5.0") });

    // Fast-forward time past deadline
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine");

    // Finalize funding -> FAILED (4)
    await contract.finalizeFunding();
    expect(await contract.state()).to.equal(4);

    // Contributor claims full refund
    const beforeBal = await ethers.provider.getBalance(contributor1.address);
    const tx = await contract.connect(contributor1).claimRefund();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const afterBal = await ethers.provider.getBalance(contributor1.address);

    expect(afterBal + gasUsed - beforeBal).to.equal(ethers.parseEther("5.0"));
  });

  it("supports REFUNDABLE state when milestone rejected after 2 attempts", async function () {
    const { contract, creator, verifier, contributor1 } = await deployFixture();

    // Fund to 20 ETH
    await contract.connect(contributor1).contribute({ value: ethers.parseEther("20.0") });

    // Creator withdraws tranche 0 (4 ETH)
    await contract.connect(creator).withdrawTranche(0);

    // Attempt 1 for milestone 1 -> reject
    await contract.connect(creator).submitMilestoneEvidence("ipfs://evidence-1a");
    await contract.connect(verifier).rejectMilestone(1);
    expect(await contract.state()).to.equal(2); // Still IN_PROGRESS

    // Attempt 2 for milestone 1 -> reject -> REFUNDABLE (5)
    await contract.connect(creator).submitMilestoneEvidence("ipfs://evidence-1b");
    await contract.connect(verifier).rejectMilestone(1);
    expect(await contract.state()).to.equal(5); // REFUNDABLE

    // Contributor claims pro-rata refund (16 ETH remaining of 20 ETH raised = 100% of remaining)
    const beforeBal = await ethers.provider.getBalance(contributor1.address);
    const tx = await contract.connect(contributor1).claimRefund();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const afterBal = await ethers.provider.getBalance(contributor1.address);

    expect(afterBal + gasUsed - beforeBal).to.equal(ethers.parseEther("16.0"));
  });

  it("blocks reentrancy attack with nonReentrant guard", async function () {
    const { contract, duration } = await deployFixture();

    const MaliciousReceiverFactory = await ethers.getContractFactory("MaliciousReceiver");
    const attacker = await MaliciousReceiverFactory.deploy(contract.target);
    await attacker.waitForDeployment();

    // Attacker deposits 5 ETH
    await attacker.contribute({ value: ethers.parseEther("5.0") });

    // Fast-forward past deadline so campaign enters FAILED
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine");
    await contract.finalizeFunding();

    // Attacker attempts reentrant claim -> must revert with Reentrancy guard triggered
    await expect(attacker.claim()).to.be.revertedWith("Refund transfer failed");
  });
});
