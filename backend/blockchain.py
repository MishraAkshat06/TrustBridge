import os
import time
import asyncio
from typing import Any, Dict, Optional
from web3 import AsyncWeb3
from web3.providers import AsyncHTTPProvider

SEPOLIA_RPC_URL = os.environ.get(
    "SEPOLIA_RPC_URL",
    "https://ethereum-sepolia-rpc.publicnode.com"
)

# Standard Minimal ABI for TrustBridge.sol telemetry
TRUSTBRIDGE_MINIMAL_ABI = [
    {
        "inputs": [],
        "name": "minGoal",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "hardCap",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "totalRaised",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "totalWithdrawn",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "state",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "currentMilestoneIndex",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "uint8", "name": "index", "type": "uint8"}],
        "name": "getMilestone",
        "outputs": [
            {"internalType": "string", "name": "title", "type": "string"},
            {"internalType": "string", "name": "evidenceIpfsHash", "type": "string"},
            {"internalType": "uint256", "name": "trancheBps", "type": "uint256"},
            {"internalType": "uint8", "name": "milestoneState", "type": "uint8"},
            {"internalType": "uint8", "name": "submissionAttempts", "type": "uint8"},
            {"internalType": "bool", "name": "trancheClaimed", "type": "bool"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "creator",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "verifier",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "campaignDeadline",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]

STATE_MAP = {
    0: "ACTIVE",
    1: "FUNDED",
    2: "IN_PROGRESS",
    3: "COMPLETED",
    4: "FAILED",
    5: "REFUNDABLE",
}

MILESTONE_STATE_MAP = {
    0: "PENDING",
    1: "UNDER_REVIEW",
    2: "APPROVED",
    3: "REJECTED_RETRY",
    4: "FINAL_REJECTED",
}

# 30-Second in-memory TTL Cache
_vault_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 30


class BlockchainService:
    def __init__(self, rpc_url: str = SEPOLIA_RPC_URL):
        self.w3 = AsyncWeb3(AsyncHTTPProvider(rpc_url))

    async def get_vault_telemetry(
        self, contract_address: str, force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Concurrently fetches on-chain telemetry from Sepolia RPC with 30s TTL cache.
        Target execution latency: < 5ms on cache hit, ~350ms on fresh concurrent RPC fetch.
        """
        now = time.time()
        norm_address = self.w3.to_checksum_address(contract_address)

        # Check Cache
        cached = _vault_cache.get(norm_address)
        if not force_refresh and cached and (now - cached["cached_at"]) < CACHE_TTL_SECONDS:
            hit_data = dict(cached["data"])
            hit_data["cache_hit"] = True
            hit_data["ttl_remaining"] = round(CACHE_TTL_SECONDS - (now - cached["cached_at"]), 1)
            return hit_data

        contract = self.w3.eth.contract(address=norm_address, abi=TRUSTBRIDGE_MINIMAL_ABI)

        # Concurrently gather all on-chain reads via AsyncWeb3
        try:
            (
                min_goal_wei,
                hard_cap_wei,
                total_raised_wei,
                total_withdrawn_wei,
                contract_state_raw,
                current_milestone_idx,
                creator_addr,
                verifier_addr,
                deadline_ts,
                m0,
                m1,
                m2,
                m3,
            ) = await asyncio.gather(
                contract.functions.minGoal().call(),
                contract.functions.hardCap().call(),
                contract.functions.totalRaised().call(),
                contract.functions.totalWithdrawn().call(),
                contract.functions.state().call(),
                contract.functions.currentMilestoneIndex().call(),
                contract.functions.creator().call(),
                contract.functions.verifier().call(),
                contract.functions.campaignDeadline().call(),
                contract.functions.getMilestone(0).call(),
                contract.functions.getMilestone(1).call(),
                contract.functions.getMilestone(2).call(),
                contract.functions.getMilestone(3).call(),
            )

            min_goal_eth = float(self.w3.from_wei(min_goal_wei, "ether"))
            hard_cap_eth = float(self.w3.from_wei(hard_cap_wei, "ether"))
            total_raised_eth = float(self.w3.from_wei(total_raised_wei, "ether"))
            total_withdrawn_eth = float(self.w3.from_wei(total_withdrawn_wei, "ether"))
            remaining_headroom_eth = max(0.0, round(hard_cap_eth - total_raised_eth, 4))

            def parse_milestone(raw, idx):
                return {
                    "index": idx,
                    "title": raw[0],
                    "evidence_ipfs_hash": raw[1],
                    "tranche_bps": raw[2],
                    "percentage": round(raw[2] / 100, 1),
                    "state": MILESTONE_STATE_MAP.get(raw[3], "UNKNOWN"),
                    "attempts": raw[4],
                    "claimed": raw[5],
                }

            milestones = [
                parse_milestone(m0, 0),
                parse_milestone(m1, 1),
                parse_milestone(m2, 2),
                parse_milestone(m3, 3),
            ]

            payload = {
                "contract_address": norm_address,
                "chain_id": 11155111,
                "network": "Ethereum Sepolia",
                "creator": creator_addr,
                "verifier": verifier_addr,
                "deadline_timestamp": deadline_ts,
                "state": STATE_MAP.get(contract_state_raw, "UNKNOWN"),
                "current_milestone_index": current_milestone_idx,
                "min_goal_eth": min_goal_eth,
                "hard_cap_eth": hard_cap_eth,
                "total_raised_eth": total_raised_eth,
                "total_withdrawn_eth": total_withdrawn_eth,
                "remaining_headroom_eth": remaining_headroom_eth,
                "progress_percentage": min(
                    100.0, round((total_raised_eth / hard_cap_eth) * 100, 1)
                ) if hard_cap_eth > 0 else 0.0,
                "milestones": milestones,
                "cache_hit": False,
                "cached_at": now,
            }

            # Update in-memory TTL cache
            _vault_cache[norm_address] = {
                "cached_at": now,
                "data": payload,
            }

            return payload

        except Exception as e:
            # If contract call fails or network error, return structured error
            raise RuntimeError(f"Sepolia AsyncWeb3 read failed for {norm_address}: {str(e)}")


blockchain_service = BlockchainService()
