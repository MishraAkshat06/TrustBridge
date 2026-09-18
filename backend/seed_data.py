import json
from database import init_db, get_db

def seed():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    campaigns = [
        {
            "id": "trustbridge-ai-01",
            "title": "Autonomous Multi-Agent Escrow Protocol",
            "description": "Next-generation decentralized crowdfunding escrow combining off-chain ML anomaly scoring and human-in-the-loop multi-milestone verification on Ethereum Sepolia.",
            "category": "AI/ML",
            "creator_address": "0x71C836056a31AC34421B37b30960533C2C143e90",
            "contract_address": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
            "goal_eth": 10.0,
            "hard_cap_eth": 20.0,
            "deadline_timestamp": 1742500000,
            "milestones": [
                {"title": "Architecture & Prototype Review", "tranche_bps": 2000, "status": "APPROVED"},
                {"title": "Smart Contract Sepolia Audits", "tranche_bps": 2500, "status": "UNDER_REVIEW"},
                {"title": "Agentic Verification Pipeline", "tranche_bps": 2500, "status": "PENDING"},
                {"title": "Production Mainnet Readiness", "tranche_bps": 3000, "status": "PENDING"}
            ]
        },
        {
            "id": "quantum-mesh-02",
            "title": "Quantum-Resistant P2P Bridge",
            "description": "Lattice-based cryptography bridge securing cross-rollup token transfers against post-quantum attacks with automated ZK verification proofs.",
            "category": "Infrastructure",
            "creator_address": "0x3Fa8990142bCD12A3492109842aC12423012241F",
            "contract_address": "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
            "goal_eth": 12.0,
            "hard_cap_eth": 20.0,
            "deadline_timestamp": 1743500000,
            "milestones": [
                {"title": "Mathematical Proof Specification", "tranche_bps": 2000, "status": "APPROVED"},
                {"title": "Lattice Key Exchange Implementation", "tranche_bps": 2500, "status": "PENDING"},
                {"title": "Rollup Testnet Benchmark", "tranche_bps": 2500, "status": "PENDING"},
                {"title": "Formal Security Verification", "tranche_bps": 3000, "status": "PENDING"}
            ]
        },
        {
            "id": "eco-credits-03",
            "title": "GreenChain Carbon Offsetting Protocol",
            "description": "Satellite-verified IoT oracle feeds tracking reforestation carbon offsets minted as ERC-1155 dynamic fractional green assets.",
            "category": "GreenTech",
            "creator_address": "0x981240ABCF491024823190821034821049210492",
            "contract_address": "0x2e09ba33948b321c8f2d9a123c7eb4011a8fe829",
            "goal_eth": 15.0,
            "hard_cap_eth": 20.0,
            "deadline_timestamp": 1744500000,
            "milestones": [
                {"title": "Satellite Telemetry Oracle Integration", "tranche_bps": 2000, "status": "APPROVED"},
                {"title": "Smart Meter Verifier Nodes", "tranche_bps": 2500, "status": "APPROVED"},
                {"title": "Carbon Credit Minting Engine", "tranche_bps": 2500, "status": "UNDER_REVIEW"},
                {"title": "Global Registry Interoperability", "tranche_bps": 3000, "status": "PENDING"}
            ]
        }
    ]

    for c in campaigns:
        cursor.execute("""
            INSERT OR REPLACE INTO campaigns 
            (id, title, description, category, creator_address, contract_address, goal_eth, hard_cap_eth, deadline_timestamp, milestones_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c["id"],
            c["title"],
            c["description"],
            c["category"],
            c["creator_address"],
            c["contract_address"],
            c["goal_eth"],
            c["hard_cap_eth"],
            c["deadline_timestamp"],
            json.dumps(c["milestones"])
        ))

    conn.commit()
    conn.close()
    print("Seeded database with initial campaigns.")

if __name__ == "__main__":
    seed()
