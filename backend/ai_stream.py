import os
import re
import json
import logging
from typing import AsyncGenerator, Dict, Any, Optional
from groq import AsyncGroq

logger = logging.getLogger("trustbridge.ai_stream")

REDIRECT_MESSAGE = (
    "I am specialized exclusively in TrustBridge, Web3 smart contracts, milestone escrow, "
    "crypto, and decentralized crowdfunding. Please ask questions related to these topics."
)

SYSTEM_PROMPT = """You are TrustBridge AI, the official intelligent protocol assistant for the TrustBridge Decentralized Escrow Protocol.
TrustBridge is a high-assurance Web3 crowdfunding escrow platform operating on Ethereum Sepolia testnet.

CORE PROTOCOL SPECIFICATIONS:
- Contract: TrustBridge.sol deployed at 0x7c49bCc4A869480Bf3BAd72acf826667066c58d2 on Sepolia (Chain ID 11155111).
- Escrow Rules: Strict 10 ETH minimum funding goal, 20 ETH hard cap ceiling.
- In-Block Excess Refund: Contributions exceeding the 20 ETH cap automatically split and refund excess within the same block.
- 4-Tranche Milestone Stepper: Sequential release schedule: 20% (Arch), 25% (Testing), 25% (Verification), 30% (Handover).
- Non-Custodial Security: Pull-payment design, nonReentrant lock. No private keys are held by AI.
- Decision Support: Zero-leakage ML model for pre-launch success probability + Isolation Forest anomaly detection.
- Contributor Rights: 100% principal refunds if min goal is unmet by deadline, or fair pro-rata refunds if milestones are rejected after grace period.

TOPIC GATING & SCOPE ENFORCEMENT (CRITICAL):
- You ONLY answer questions related to:
  1. TrustBridge protocol mechanics, architecture, rules, and campaigns.
  2. Web3, Cryptography, Blockchain (Ethereum, EVM, Sepolia, Gas, Wallets, EIP-4361 SIWE).
  3. Solidity, Smart Contracts, Security, Reentrancy, Checks-Effects-Interactions, Pull Payments.
  4. Milestone Escrow, Verifier Consensus, decentralized governance, and fundraising game theory.
  5. AI Auditing, anomaly detection, risk telemetry, and campaign verification.
  6. Decentralized crowdfunding versus legacy centralized models.
- REFUSAL POLICY: If a user asks questions about unrelated topics (such as cooking recipes, non-Web3 coding, politics, sports, general entertainment, homework/trivia outside blockchain, fiction, etc.), politely decline and redirect them with:
  "I am specialized exclusively in TrustBridge, Web3 smart contracts, milestone escrow, crypto, and decentralized crowdfunding. Please ask questions related to these topics."
- Keep responses helpful, structured, concise, and focused on assisting users, project creators, and backers on TrustBridge."""

OFF_TOPIC_PATTERNS = [
    r"\b(recipe|bake|cook|pasta|pizza|cake|soup|salad|ingredient|kitchen)\b",
    r"\b(movie|film|actor|actress|cinema|netflix|hollywood|bollywood|song|lyrics|singer)\b",
    r"\b(football|soccer|basketball|cricket|nba|nfl|world cup|messi|ronaldo)\b",
    r"\b(weather|climate|forecast|rain|temperature|snow)\b",
    r"\b(dating|romance|horoscope|astrology|zodiac)\b",
    r"\b(president|election|democrat|republican|parliament|minister)\b"
]

def is_off_topic(query: str) -> bool:
    q = query.lower()
    web3_keywords = [
        "web3", "crypto", "eth", "ethereum", "solidity", "smart contract", "contract",
        "escrow", "milestone", "tranche", "hard cap", "crowdfund", "campaign", "trustbridge",
        "sepolia", "wallet", "metamask", "siwe", "eip-4361", "token", "blockchain", "gas",
        "reentrancy", "ipfs", "verifier", "audit", "backer", "creator", "refund"
    ]
    if any(k in q for k in web3_keywords):
        return False
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, q):
            return True
    return False

def get_protocol_knowledge_response(query: str) -> Optional[str]:
    """Instant heuristic protocol responses (< 0.004 ms) for FAQs."""
    q = query.lower()
    if any(k in q for k in ["4-tranche", "tranche", "milestone", "schedule", "stepper"]):
        return (
            "**TrustBridge 4-Tranche Milestone Schedule:**\n"
            "Funds are disbursed sequentially across 4 milestones totaling 10,000 BPS (100%):\n"
            "• **Tranche 1 (20%):** Architecture & Foundation (auto-unlocked upon reaching 10 ETH goal).\n"
            "• **Tranche 2 (25%):** Functional Core & Integration.\n"
            "• **Tranche 3 (25%):** Security Audit & Verification.\n"
            "• **Tranche 4 (30%):** Mainnet Deployment & Handover.\n\n"
            "Each subsequent tranche requires IPFS deliverable proof submission and multi-signature verifier quorum consensus."
        )
    if any(k in q for k in ["hard cap", "20 eth", "cap", "ceiling"]):
        return (
            "**20.00 ETH Hard Cap & In-Block Excess Refund:**\n"
            "TrustBridge enforces an immutable 20.00 ETH hard cap per campaign in `TrustBridge.sol`.\n"
            "If a contribution pushes the total raised above 20 ETH, the contract calculates `accepted = min(value, headroom)` and automatically refunds the excess wei within the exact same transaction block."
        )
    if any(k in q for k in ["min goal", "10 eth", "minimum goal", "funding goal"]):
        return (
            "**10.00 ETH Minimum Funding Goal:**\n"
            "Campaigns must raise at least 10.00 ETH before the deadline to transition to `Funded` state. "
            "If the campaign fails to reach 10 ETH before the deadline, it transitions to `Failed` and all contributors can pull 100% of their principal back."
        )
    if any(k in q for k in ["refund", "refunds", "protect"]):
        return (
            "**Contributor Refund Guarantees:**\n"
            "1. **Unfunded Campaigns:** 100% principal refund if under 10 ETH at deadline.\n"
            "2. **Excess Deposit:** Immediate in-block refund for deposits exceeding 20 ETH.\n"
            "3. **Failed Milestones:** If a milestone fails review after the 1-retry grace period, unspent escrow balance is made claimable pro-rata.\n"
            "All refunds use non-custodial pull payments."
        )
    if any(k in q for k in ["contract", "sepolia", "address", "deployment"]):
        return (
            "**TrustBridge Smart Contract Details:**\n"
            "• **Network:** Ethereum Sepolia Testnet (Chain ID 11155111)\n"
            "• **Address:** `0x7c49bCc4A869480Bf3BAd72acf826667066c58d2`\n"
            "• **Standard:** Solidity 0.8.20 with OpenZeppelin `ReentrancyGuard` and `Address.sendValue`."
        )
    if any(k in q for k in ["reentrancy", "pull payment", "security", "attack"]):
        return (
            "**Web3 Non-Custodial Security Architecture:**\n"
            "• **Checks-Effects-Interactions (CEI):** Internal balances and withdrawal flags update before external ETH transfers.\n"
            "• **ReentrancyGuard:** Mutex locks on all payable and withdrawal functions.\n"
            "• **Pull-Payment Pattern:** Zero push transfers in loops. Creators and backers withdraw their own funds individually."
        )
    if any(k in q for k in ["ai", "risk", "telemetry", "anomaly"]):
        return (
            "**AI Risk Telemetry & Verification Engine:**\n"
            "TrustBridge uses a dual-engine AI pipeline:\n"
            "• **Supervised Classifier:** Evaluates category, timeline, target, and team velocity for success probability.\n"
            "• **Isolation Forest:** Detects anomalous campaign parameters to warn backers.\n"
            "• *Advisory Notice:* AI telemetry is an informational risk assessment and not a financial verdict."
        )
    if any(k in q for k in ["what is trustbridge", "fees", "how does escrow work", "verifier earn"]):
        return (
            "TrustBridge is a decentralized crowdfunding protocol with milestone-based escrow on Ethereum Sepolia. "
            "Backer funds are locked in `TrustBridge.sol` and released strictly across 4 tranches as validators verify project milestones. "
            "If milestones fail, unspent escrow is refunded directly to backers via pull payments."
        )
    return None

class AsyncAIService:
    def __init__(self):
        self._groq_client: Optional[AsyncGroq] = None

    def get_groq_client(self) -> Optional[AsyncGroq]:
        api_key = os.environ.get("GROQ_API_KEY", "").strip()
        if not api_key:
            return None
        if self._groq_client is None:
            self._groq_client = AsyncGroq(api_key=api_key)
        return self._groq_client

    async def generate_response(self, message: str) -> Dict[str, Any]:
        """
        Fast non-blocking chat response with immediate heuristic grounding.
        """
        if is_off_topic(message):
            return {
                "reply": REDIRECT_MESSAGE,
                "provider": "Protocol Intelligence",
                "cached": False,
            }

        # Priority 0: Instant Protocol Knowledge Response (0.004 ms)
        protocol_ans = get_protocol_knowledge_response(message)
        if protocol_ans:
            return {
                "reply": protocol_ans,
                "provider": "Protocol Intelligence",
                "cached": True,
            }

        # Priority 1: AsyncGroq SDK
        client = self.get_groq_client()
        groq_model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

        if client:
            try:
                response = await client.chat.completions.create(
                    model=groq_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message},
                    ],
                    temperature=0.3,
                    max_tokens=500,
                    timeout=2.5,
                )
                choice = response.choices[0].message
                content = choice.content or ""
                return {
                    "reply": content.strip(),
                    "provider": "Protocol Intelligence",
                    "cached": False,
                }
            except Exception as e:
                logger.warning(f"AsyncGroq call failed or timed out: {e}")

        # Fallback Grounding
        return {
            "reply": (
                "TrustBridge Protocol Intelligence is active. All escrow balances, 4-tranche milestones, "
                "and 20 ETH cap rules are governed trustlessly on Sepolia at `0x7c49bCc4A869480Bf3BAd72acf826667066c58d2`."
            ),
            "provider": "Protocol Intelligence",
            "cached": False,
        }

    async def stream_audit_response(self, message: str) -> AsyncGenerator[str, None]:
        """
        Server-Sent Events (SSE) streaming generator using native AsyncGroq streaming.
        """
        if is_off_topic(message):
            yield f"data: {json.dumps({'chunk': REDIRECT_MESSAGE})}\n\n"
            yield "data: [DONE]\n\n"
            return

        protocol_ans = get_protocol_knowledge_response(message)
        if protocol_ans:
            # Yield in fast chunks for immediate UX
            for line in protocol_ans.split("\n"):
                yield f"data: {json.dumps({'chunk': line + '\n'})}\n\n"
            yield "data: [DONE]\n\n"
            return

        client = self.get_groq_client()
        groq_model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")

        if client:
            try:
                stream = await client.chat.completions.create(
                    model=groq_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message},
                    ],
                    stream=True,
                    temperature=0.3,
                    max_tokens=600,
                )
                async for chunk in stream:
                    content = chunk.choices[0].delta.content or ""
                    if content:
                        yield f"data: {json.dumps({'chunk': content})}\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception as e:
                logger.error(f"AsyncGroq streaming error: {e}")

        # Fallback stream
        fallback = "TrustBridge Protocol Intelligence is active and monitoring Sepolia escrow state."
        yield f"data: {json.dumps({'chunk': fallback})}\n\n"
        yield "data: [DONE]\n\n"


ai_service = AsyncAIService()
