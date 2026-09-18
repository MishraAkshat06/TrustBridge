\# TrustBridge Workspace Directives



\## Architecture Boundaries

\- Technology Stack: Solidity (0.8.x), React (Vite) + Ethers.js v6, Python (Flask), Scikit-Learn.

\- Blockchain Constraints: Deployment target is Sepolia testnet. Hard cap is strictly 20 ETH; minimum goal is 10 ETH.

\- Security Policy: AI models and agents run off-chain in Flask. AI must never hold private keys or sign on-chain transactions directly.

\- Testing Requirement: Every contract function must have a corresponding verification script or local test.



\## Agent Execution Rules

\- Never generate monolithic code. Keep modules decoupled: `/contracts`, `/frontend`, `/backend`.

\- Always request confirmation before running external terminal commands that install global dependencies.

\- Present visual file diffs for review before applying multi-file modifications.

