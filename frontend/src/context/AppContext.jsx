import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig';
import { MOCK_CAMPAIGNS } from '../mockData';
import { fetchCampaigns, createCampaignApi } from '../services/api';

const AppContext = createContext();

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = '0xaa36a7';
const SANDBOX_FALLBACK_WALLET = '0x7B2aB43a8B4512CdEf8798C3953508495a024Fa1';

export function AppProvider({ children }) {
  // Navigation / views: 'Landing', 'Auth', 'Campaign', 'Explore', 'Create', 'Contributions', 'Verifier', 'Docs', 'Wallet', 'AiRisk', 'Ledger'
  const [currentView, setCurrentView] = useState('Landing');
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [activeCampaignId, setActiveCampaignId] = useState('1');

  const [user, setUser] = useState(null); // { name, email, role: 'Creator' | 'Contributor' | 'Verifier', kycStatus: 'Verified' }
  const [balance, setBalance] = useState('4.8215');
  const [isSepolia, setIsSepolia] = useState(true);
  const userRole = user?.role || 'Contributor';

  // Global activity history
  const [activities, setActivities] = useState([
    { id: 1, txHash: '0x8f2d1e9a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e', blockNumber: 5932014, addr: '0x5c3...9a2f', action: 'Contributed 0.50 ETH', event: 'ContributionReceived', time: '2m ago', type: 'in', amount: 0.5, campaignId: '1' },
    { id: 2, txHash: '0x3c7e4b01a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9', blockNumber: 5931890, addr: '0x1d7...3e9b', action: 'Contributed 1.00 ETH', event: 'ContributionReceived', time: '12m ago', type: 'in', amount: 1.0, campaignId: '1' },
    { id: 3, txHash: '0x1a8fe829c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', blockNumber: 5928430, addr: '0x9a4...7c1d', action: 'In-Block Excess Refund 0.25 ETH', event: 'ExcessRefundIssued', time: '1h ago', type: 'out', amount: 0.25, campaignId: '1' },
    { id: 4, txHash: '0x7e8d9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e', blockNumber: 5925102, addr: '0x3f8...6b2e', action: 'Contributed 2.00 ETH', event: 'ContributionReceived', time: '2h ago', type: 'in', amount: 2.0, campaignId: '2' },
  ]);

  // User personal contributions
  const [myContributions, setMyContributions] = useState([
    { campaignId: '1', title: 'AuraMesh: Decentralized IoT Edge Sensing Node', amount: 1.5, status: 'Escrowed', canRefund: true },
    { campaignId: '2', title: 'EcoPulse: Modular Biogas Digester Telemetry', amount: 0.5, status: 'Escrowed', canRefund: true }
  ]);

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];

  // Refresh balance from on-chain provider
  const refreshBalance = useCallback(async (targetAccount, prov) => {
    try {
      const acc = targetAccount || account;
      if (!acc || !acc.startsWith('0x') || acc.length < 42) return;
      if (typeof window !== 'undefined' && window.ethereum) {
        const p = prov || new BrowserProvider(window.ethereum);
        const balWei = await p.getBalance(acc);
        const ethStr = formatEther(balWei);
        const ethNum = parseFloat(ethStr);
        // Formatted rounded to 4 decimals with BigInt precision
        setBalance(ethNum.toFixed(4));
      }
    } catch (err) {
      console.warn('Could not fetch live balance from provider:', err);
    }
  }, [account]);

  // Switch network to Sepolia
  const switchNetwork = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_HEX }]
      });
      setIsSepolia(true);
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_HEX,
              chainName: 'Ethereum Sepolia Testnet',
              nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
          setIsSepolia(true);
          return true;
        } catch (addErr) {
          console.error('Failed to add Sepolia network:', addErr);
          return false;
        }
      }
      console.warn('Failed to switch network:', switchError);
      return false;
    }
  }, []);

  // Connect wallet pipeline
  const connectWallet = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts && accounts.length > 0) {
          const selectedAccount = accounts[0];
          setAccount(selectedAccount);

          // Check network
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);
          const isSep = chainId === SEPOLIA_CHAIN_ID;
          setIsSepolia(isSep);
          if (!isSep) {
            await switchNetwork();
          }

          // Fetch balance
          await refreshBalance(selectedAccount, provider);

          if (!user) {
            setUser({
              name: `${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`,
              email: 'user@sepolia.eth',
              role: 'Contributor',
              kycStatus: 'Verified'
            });
          }
          return;
        }
      } catch (err) {
        console.warn('MetaMask connection error or cancelled:', err);
      }
    }

    // Fallback to Sandbox testnet wallet if MetaMask absent or connection failed
    const fallback = SANDBOX_FALLBACK_WALLET;
    setAccount(fallback);
    setBalance('4.8215');
    setIsSepolia(true);
    if (!user) {
      setUser({
        name: 'Sandbox Backer',
        email: 'demo@trustbridge.io',
        role: 'Contributor',
        kycStatus: 'Verified'
      });
    }
  }, [refreshBalance, switchNetwork, user]);

  function disconnectWallet() {
    setAccount('');
    setBalance('0.0000');
  }

  // MetaMask event listeners (accountsChanged & chainChanged)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts && accounts.length > 0) {
          const newAcc = accounts[0];
          setAccount(newAcc);
          refreshBalance(newAcc);
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = (chainIdHex) => {
        const chainId = typeof chainIdHex === 'string' ? parseInt(chainIdHex, 16) : Number(chainIdHex);
        const isSep = chainId === SEPOLIA_CHAIN_ID;
        setIsSepolia(isSep);
        if (account) {
          refreshBalance(account);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account, refreshBalance]);

  // Load backend campaigns on mount
  useEffect(() => {
    async function loadBackendCampaigns() {
      try {
        const data = await fetchCampaigns();
        if (data && data.length > 0) {
          const mapped = data.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category || 'AI/ML',
            verified: true,
            creator: c.creator_address || '0x3Fa8B43a8B4512CdEf8798C3953508495a02241F',
            summary: c.description,
            goal: c.goal_eth || 10.0,
            hardCap: c.hard_cap_eth || 20.0,
            totalRaised: Number((c.goal_eth * 0.725).toFixed(2)),
            totalWithdrawn: 0.0,
            deadlineDays: 30,
            mlScore: 92,
            riskLevel: 'LOW',
            state: 'ACTIVE',
            riskDetails: 'Structural evaluation passed. Realistic roadmap deliverables with balanced tranches.',
            milestones: (c.milestones && c.milestones.length > 0) 
              ? c.milestones.map((m, mIdx) => ({
                  id: mIdx + 1,
                  title: m.title || `Tranche ${mIdx + 1}`,
                  percentage: Math.round((m.tranche_bps || 2500) / 100),
                  trancheBps: m.tranche_bps || (mIdx === 0 ? 2000 : mIdx === 3 ? 3000 : 2500),
                  status: m.status || (mIdx === 0 ? 'APPROVED' : mIdx === 1 ? 'UNDER_REVIEW' : 'PENDING'),
                  attempts: 0,
                  trancheClaimed: false,
                  evidence: ''
                }))
              : [
                  { id: 1, title: 'Tranche 1: Prototype Architecture & BOM', percentage: 20, trancheBps: 2000, status: 'APPROVED', attempts: 0, trancheClaimed: false, evidence: '' },
                  { id: 2, title: 'Tranche 2: PCB Fabrication & Bench Testing', percentage: 25, trancheBps: 2500, status: 'UNDER_REVIEW', attempts: 1, trancheClaimed: false, evidence: 'https://demo.auramesh.io/bench-v2' },
                  { id: 3, title: 'Tranche 3: Field Testing & Gateway Integration', percentage: 25, trancheBps: 2500, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
                  { id: 4, title: 'Tranche 4: Volume Production & SDK Release', percentage: 30, trancheBps: 3000, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' }
                ]
          }));
          setCampaigns(mapped);
          if (mapped[0]) setActiveCampaignId(mapped[0].id);
        }
      } catch (err) {
        console.warn('Backend campaigns fetch error:', err);
      }
    }
    loadBackendCampaigns();
  }, []);

  // Rehydrate authenticated user session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('trustbridge_user_session');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to rehydrate user session:', e);
    }
  }, []);

  function loginOrRegister(userData) {
    const sessionUser = {
      name: userData?.name || 'Anonymous Backer',
      email: userData?.email || 'backer@trustbridge.io',
      role: userData?.role || 'Contributor',
      avatar: userData?.avatar || (userData?.name ? userData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'TB'),
      kycStatus: userData?.kycStatus || 'Google SSO Verified',
      authMethod: userData?.authMethod || (userData?.avatar ? 'google_sso' : 'credentials'),
      timestamp: Date.now()
    };
    setUser(sessionUser);
    try {
      localStorage.setItem('trustbridge_user_session', JSON.stringify(sessionUser));
    } catch (e) {
      console.warn('Could not persist user session to localStorage:', e);
    }
    if (!account) {
      setAccount(SANDBOX_FALLBACK_WALLET);
    }
    setCurrentView('Campaign');
    return sessionUser;
  }

  function logout() {
    setUser(null);
    try {
      localStorage.removeItem('trustbridge_user_session');
    } catch (e) {
      console.warn('Could not remove user session from localStorage:', e);
    }
    setAccount('');
    setCurrentView('Landing');
  }

  // Real-time dynamic gas estimator
  function estimateGas(priority = 'medium', baseGwei = 25) {
    const BASE_GAS_LIMIT = 48000;
    const priorityMultipliers = { low: 1.0, medium: 1.25, fast: 1.5 };
    const mult = priorityMultipliers[priority] || 1.25;
    const effectiveGwei = baseGwei * mult;
    const totalGwei = BASE_GAS_LIMIT * effectiveGwei;
    const feeEth = Number((totalGwei / 1e9).toFixed(6));
    const feeUsd = Number((feeEth * 3200).toFixed(2));
    return {
      gasUnits: BASE_GAS_LIMIT,
      effectiveGwei,
      feeEth,
      feeUsd,
      priority
    };
  }

  // Core Escrow Contribution Logic with strict 20 ETH hard cap & 10 ETH min goal
  function contributeToCampaign(campaignId, amountEth) {
    const val = parseFloat(amountEth);
    if (isNaN(val) || val <= 0) return { success: false, msg: 'Enter valid ETH amount' };

    let accepted = 0;
    let refunded = 0;
    let updatedCampaign = null;

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const blockNumber = 5932000 + Math.floor(Math.random() * 1000);

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const hardCap = c.hardCap || 20.0;
        const minGoal = c.goal || 10.0;
        const remaining = Math.max(0, hardCap - c.totalRaised);

        accepted = Number(Math.min(val, remaining).toFixed(4));
        refunded = Number(Math.max(0, val - accepted).toFixed(4));
        const newTotal = Number((c.totalRaised + accepted).toFixed(4));

        // Milestones: automatic unlock of Tranche 1 (20%) when campaign reaches minGoal (10 ETH)
        let updatedMilestones = (c.milestones || []).map((m, idx) => {
          if (idx === 0 && newTotal >= minGoal && m.status === 'PENDING') {
            return { ...m, status: 'APPROVED' };
          }
          return m;
        });

        const newState = newTotal >= hardCap 
          ? 'FUNDED' 
          : (newTotal >= minGoal ? 'IN_PROGRESS' : (c.state || 'ACTIVE'));

        updatedCampaign = {
          ...c,
          totalRaised: newTotal,
          state: newState,
          milestones: updatedMilestones
        };
        return updatedCampaign;
      }
      return c;
    }));

    const actorDisplay = account 
      ? `${account.slice(0, 6)}...${account.slice(-4)}` 
      : '0x7B2a...4Fa1';

    if (accepted > 0) {
      const contribAct = {
        id: Date.now(),
        txHash,
        blockNumber,
        addr: actorDisplay,
        action: `Contributed ${accepted.toFixed(4)} ETH`,
        event: 'ContributionReceived',
        time: 'Just now',
        type: 'in',
        amount: accepted,
        campaignId
      };
      setActivities(prev => [contribAct, ...prev]);

      setMyContributions(prev => {
        const exist = prev.find(item => item.campaignId === campaignId);
        if (exist) {
          return prev.map(item => item.campaignId === campaignId ? { ...item, amount: Number((item.amount + accepted).toFixed(4)) } : item);
        }
        return [...prev, { campaignId, title: updatedCampaign?.title || 'Escrow Vault Hub', amount: accepted, status: 'Escrowed', canRefund: true }];
      });
    }

    if (refunded > 0) {
      const refundAct = {
        id: Date.now() + 1,
        txHash,
        blockNumber,
        addr: actorDisplay,
        action: `In-Block Excess Refund ${refunded.toFixed(4)} ETH`,
        event: 'ExcessRefundIssued',
        time: 'Just now',
        type: 'out',
        amount: refunded,
        campaignId
      };
      setActivities(prev => [refundAct, ...prev]);
    }

    return {
      success: true,
      accepted,
      refunded,
      txHash,
      blockNumber,
      isExcessRefund: refunded > 0,
      msg: refunded > 0 
        ? `Accepted ${accepted.toFixed(4)} ETH. In-block excess refunded ${refunded.toFixed(4)} ETH!`
        : `Successfully contributed ${accepted.toFixed(4)} ETH!`
    };
  }

  // 4-Tranche Milestone Governance: Submit Evidence
  function submitMilestoneEvidence(campaignId, milestoneId, evidenceData = '') {
    const evidenceStr = typeof evidenceData === 'string' 
      ? evidenceData 
      : (evidenceData?.ipfsHash || evidenceData?.url || 'https://ipfs.io/ipfs/QmTrustBridgeProof');

    let updatedMilestone = null;

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const updatedMilestones = (c.milestones || []).map(m => {
          if (m.id === milestoneId) {
            const nextAttempts = (m.attempts || 0) + 1;
            updatedMilestone = {
              ...m,
              status: 'UNDER_REVIEW',
              attempts: nextAttempts,
              evidence: evidenceStr
            };
            return updatedMilestone;
          }
          return m;
        });
        return { ...c, milestones: updatedMilestones };
      }
      return c;
    }));

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newAct = {
      id: Date.now(),
      txHash,
      blockNumber: 5932020,
      addr: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0xCreator...Auth',
      action: `Submitted Evidence for Milestone #${milestoneId}`,
      event: 'MilestoneSubmitted',
      time: 'Just now',
      type: 'in',
      amount: 0,
      campaignId
    };
    setActivities(prev => [newAct, ...prev]);
    return { success: true, milestone: updatedMilestone };
  }

  // 4-Tranche Milestone Governance: Verifier Consensus Approval
  function approveMilestone(campaignId, milestoneId) {
    let allApproved = false;

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const updatedMilestones = (c.milestones || []).map(m => {
          if (m.id === milestoneId) return { ...m, status: 'APPROVED' };
          return m;
        });
        allApproved = updatedMilestones.every(m => m.status === 'APPROVED' || m.status === 'CLAIMED');
        return {
          ...c,
          state: allApproved ? 'COMPLETED' : c.state,
          milestones: updatedMilestones
        };
      }
      return c;
    }));

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newAct = {
      id: Date.now(),
      txHash,
      blockNumber: 5932035,
      addr: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0xVerifier...Auth',
      action: `Approved Milestone #${milestoneId} Tranche`,
      event: 'MilestoneApproved',
      time: 'Just now',
      type: 'in',
      amount: 0,
      campaignId
    };
    setActivities(prev => [newAct, ...prev]);
    return { success: true, allApproved };
  }

  // 4-Tranche Milestone Governance: Verifier Rejection with 1-Retry Grace Period
  function rejectMilestone(campaignId, milestoneId, reason = 'Deliverables did not satisfy audit criteria') {
    let isFinal = false;

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const updatedMilestones = (c.milestones || []).map(m => {
          if (m.id === milestoneId) {
            const attempts = m.attempts || 1;
            isFinal = attempts >= 2; // max 2 attempts allowed (1 retry grace period)
            return {
              ...m,
              status: isFinal ? 'FINAL_REJECTED' : 'REJECTED_RETRY',
              attempts
            };
          }
          return m;
        });

        return {
          ...c,
          state: isFinal ? 'REFUNDABLE' : c.state,
          milestones: updatedMilestones
        };
      }
      return c;
    }));

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newAct = {
      id: Date.now(),
      txHash,
      blockNumber: 5932040,
      addr: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0xVerifier...Auth',
      action: isFinal 
        ? `Final Rejection on Milestone #${milestoneId}: Escrow set to REFUNDABLE`
        : `Rejected Milestone #${milestoneId}: Grace period retry granted`,
      event: 'MilestoneRejected',
      time: 'Just now',
      type: 'out',
      amount: 0,
      campaignId
    };
    setActivities(prev => [newAct, ...prev]);
    return { success: true, isFinal };
  }

  // Creator pull-payment withdrawal for approved tranche
  function withdrawTranche(campaignId, milestoneId) {
    let trancheAmount = 0;

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const updatedMilestones = (c.milestones || []).map(m => {
          if (m.id === milestoneId && (m.status === 'APPROVED' || m.status === 'COMPLETED') && !m.trancheClaimed) {
            trancheAmount = Number(((c.totalRaised * (m.percentage || 25)) / 100).toFixed(4));
            return { ...m, trancheClaimed: true, status: 'CLAIMED' };
          }
          return m;
        });
        return {
          ...c,
          totalWithdrawn: Number(((c.totalWithdrawn || 0) + trancheAmount).toFixed(4)),
          milestones: updatedMilestones
        };
      }
      return c;
    }));

    if (trancheAmount > 0) {
      const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newAct = {
        id: Date.now(),
        txHash,
        blockNumber: 5932050,
        addr: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0xCreator...Auth',
        action: `Creator Withdrew Tranche #${milestoneId} (${trancheAmount.toFixed(4)} ETH)`,
        event: 'TrancheWithdrawn',
        time: 'Just now',
        type: 'out',
        amount: trancheAmount,
        campaignId
      };
      setActivities(prev => [newAct, ...prev]);
      return { success: true, amount: trancheAmount, msg: `Withdrew ${trancheAmount.toFixed(4)} ETH tranche` };
    }
    return { success: false, msg: 'Tranche not approved or already withdrawn' };
  }

  // Contributor pro-rata refund claim for FAILED or REFUNDABLE campaigns
  function claimRefund(campaignId) {
    const targetCamp = campaigns.find(c => c.id === campaignId);
    const myContrib = myContributions.find(c => c.campaignId === campaignId);

    if (!myContrib || myContrib.amount <= 0) {
      return { success: false, msg: 'No contribution available to refund.' };
    }

    const totalRaised = targetCamp?.totalRaised || 20.0;
    const totalWithdrawn = targetCamp?.totalWithdrawn || 0.0;
    
    // Pro-rata mathematical settlement: contribution * (totalRaised - totalWithdrawn) / totalRaised
    const refundRatio = totalRaised > 0 ? (totalRaised - totalWithdrawn) / totalRaised : 1.0;
    const refundAmount = Number((myContrib.amount * refundRatio).toFixed(4));

    setMyContributions(prev => prev.filter(c => c.campaignId !== campaignId));

    if (refundAmount > 0) {
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          return { ...c, totalRaised: Math.max(0, Number((c.totalRaised - refundAmount).toFixed(4))) };
        }
        return c;
      }));

      // Update local wallet balance preview
      const currentBal = parseFloat(balance) || 0;
      setBalance((currentBal + refundAmount).toFixed(4));

      const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newAct = {
        id: Date.now(),
        txHash,
        blockNumber: 5932060,
        addr: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0xBacker...Wallet',
        action: `Claimed Pro-Rata Refund ${refundAmount.toFixed(4)} ETH`,
        event: 'ContributorRefundIssued',
        time: 'Just now',
        type: 'out',
        amount: refundAmount,
        campaignId
      };
      setActivities(prev => [newAct, ...prev]);
      return { success: true, amount: refundAmount, msg: `Refunded ${refundAmount.toFixed(4)} ETH pro-rata successfully!` };
    }
    return { success: false, msg: 'Refund amount calculated to 0' };
  }

  // Backwards-compatible refund alias
  function requestRefund(campaignId) {
    return claimRefund(campaignId);
  }

  function createCampaign(newCamp) {
    const id = (campaigns.length + 1).toString();
    const created = {
      id,
      title: newCamp.title,
      category: newCamp.category || 'Hardware / IoT',
      verified: true,
      creator: account || '0x3Fa8B43a8B4512CdEf8798C3953508495a02241F',
      summary: newCamp.summary,
      goal: parseFloat(newCamp.goal) || 10.0,
      hardCap: 20.0,
      totalRaised: 0.0,
      totalWithdrawn: 0.0,
      deadlineDays: 30,
      mlScore: 84,
      riskLevel: 'LOW',
      state: 'ACTIVE',
      riskDetails: 'Structural evaluation passed. Realistic roadmap deliverables with balanced tranches.',
      milestones: [
        { id: 1, title: 'Tranche 1 (20% Upfront)', percentage: 20, trancheBps: 2000, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
        { id: 2, title: 'Tranche 2 (25% Prototype)', percentage: 25, trancheBps: 2500, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
        { id: 3, title: 'Tranche 3 (25% Audit)', percentage: 25, trancheBps: 2500, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
        { id: 4, title: 'Tranche 4 (30% Mainnet)', percentage: 30, trancheBps: 3000, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
      ]
    };
    setCampaigns(prev => [created, ...prev]);
    setActiveCampaignId(id);
    setCurrentView('Campaign');

    // Asynchronously register in backend SQLite
    createCampaignApi({
      id,
      title: created.title,
      description: created.summary,
      category: created.category,
      creator_address: created.creator,
      goal_eth: created.goal,
      hard_cap_eth: created.hardCap,
      deadline_timestamp: Math.floor(Date.now() / 1000) + 30 * 86400,
      milestones: created.milestones.map(m => ({
        title: m.title,
        tranche_bps: m.percentage * 100
      }))
    }).catch(err => console.warn('Failed to sync new campaign to API:', err));
  }

  return (
    <AppContext.Provider value={{
      account,
      balance,
      isSepolia,
      userRole,
      connectWallet,
      disconnectWallet,
      switchNetwork,
      refreshBalance,
      estimateGas,
      user,
      loginOrRegister,
      logout,
      activeTab,
      setActiveTab,
      campaigns,
      activeCampaignId,
      setActiveCampaignId,
      activeCampaign,
      currentView,
      setCurrentView,
      activities,
      myContributions,
      contributeToCampaign,
      submitMilestoneEvidence,
      approveMilestone,
      rejectMilestone,
      withdrawTranche,
      claimRefund,
      requestRefund,
      createCampaign
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

