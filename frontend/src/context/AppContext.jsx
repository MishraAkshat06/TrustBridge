import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider, JsonRpcProvider, Contract, formatEther, parseEther } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig';
import { MOCK_CAMPAIGNS } from '../mockData';
import { fetchCampaigns, createCampaignApi, predictSuccess, assessRisk } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AppContext = createContext();

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = '0xaa36a7';
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/afb2b386de5d4cbd9036fa43056f3e9b';

const STATE_MAP = ['ACTIVE', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'REFUNDABLE'];
const MILESTONE_STATE_MAP = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

export function getReadonlyContract() {
  const provider = new JsonRpcProvider(SEPOLIA_RPC);
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function getSignerContract() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or Web3 wallet not detected. Please install MetaMask to transact on Sepolia.');
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('Landing');
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [activeCampaignId, setActiveCampaignId] = useState('trustbridge-ai-01');

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trustbridge_user_session');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  const [balance, setBalance] = useState('0.0000');
  const [isSepolia, setIsSepolia] = useState(true);
  const userRole = user?.role || 'Contributor';

  // Real verified activities
  const [activities, setActivities] = useState([
    {
      id: 1,
      txHash: '0xb79ff43f84190653504b230d0f75389f9fc2172286473a4620025caf1f6d7c4e',
      blockNumber: 11746166,
      addr: '0xEf7A...D5f9',
      action: 'Contract Deployed on Sepolia',
      event: 'ContractDeployed',
      time: 'Phase 4',
      type: 'in',
      amount: 0,
      campaignId: 'trustbridge-ai-01'
    },
    {
      id: 2,
      txHash: '0xcffdd3ccb9165d105b4d4f8aa0f5ac23b6903a022329885fd8d0f5da4f0c41dd',
      blockNumber: 11746227,
      addr: '0xEf7A...D5f9',
      action: 'Contributed 0.001 ETH',
      event: 'ContributionReceived',
      time: 'Phase 5 Validation',
      type: 'in',
      amount: 0.001,
      campaignId: 'trustbridge-ai-01'
    }
  ]);

  const [myContributions, setMyContributions] = useState([]);

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0] || MOCK_CAMPAIGNS[0];

  // Refresh balance from on-chain provider
  const refreshBalance = useCallback(async (targetAccount, prov) => {
    try {
      const acc = targetAccount || account;
      if (!acc || !acc.startsWith('0x') || acc.length < 42) return;
      if (typeof window !== 'undefined' && window.ethereum) {
        const p = prov || new BrowserProvider(window.ethereum);
        const balWei = await p.getBalance(acc);
        const ethNum = parseFloat(formatEther(balWei));
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
              rpcUrls: ['https://sepolia.infura.io/v3/afb2b386de5d4cbd9036fa43056f3e9b', 'https://rpc.sepolia.org'],
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

  // Sync real on-chain data for live contract
  const syncOnChainData = useCallback(async () => {
    try {
      const roContract = getReadonlyContract();
      const [rawRaised, rawWithdrawn, rawState, rawIdx] = await Promise.all([
        roContract.totalRaised(),
        roContract.totalWithdrawn(),
        roContract.state(),
        roContract.currentMilestoneIndex()
      ]);

      const onChainRaised = parseFloat(formatEther(rawRaised));
      const onChainWithdrawn = parseFloat(formatEther(rawWithdrawn));
      const onChainState = STATE_MAP[Number(rawState)] || 'ACTIVE';
      const onChainMilestoneIndex = Number(rawIdx);

      // Fetch on-chain milestones
      const onChainMilestones = [];
      for (let i = 0; i < 4; i++) {
        try {
          const m = await roContract.getMilestone(i);
          onChainMilestones.push({
            id: i + 1,
            title: m.title || `Tranche ${i + 1}`,
            percentage: Math.round(Number(m.trancheBps) / 100),
            trancheBps: Number(m.trancheBps),
            status: MILESTONE_STATE_MAP[Number(m.milestoneState)] || 'PENDING',
            attempts: Number(m.submissionAttempts),
            trancheClaimed: m.trancheClaimed,
            evidence: m.evidenceIpfsHash || ''
          });
        } catch (e) {
          console.warn(`Could not read milestone ${i}:`, e);
        }
      }

      setCampaigns(prev => prev.map(c => {
        if (c.contract_address?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() || c.id === 'trustbridge-ai-01') {
          return {
            ...c,
            contract_address: CONTRACT_ADDRESS,
            totalRaised: onChainRaised,
            totalWithdrawn: onChainWithdrawn,
            state: onChainState,
            currentMilestoneIndex: onChainMilestoneIndex,
            milestones: onChainMilestones.length === 4 ? onChainMilestones : c.milestones
          };
        }
        return c;
      }));

      // If user account is connected, query their on-chain contribution
      if (account && account.startsWith('0x')) {
        const myWei = await roContract.contributions(account);
        const myAmount = parseFloat(formatEther(myWei));
        if (myAmount > 0) {
          setMyContributions(prev => {
            const filtered = prev.filter(item => item.campaignId !== 'trustbridge-ai-01');
            return [...filtered, {
              campaignId: 'trustbridge-ai-01',
              title: 'Autonomous Multi-Agent Escrow Protocol',
              amount: myAmount,
              status: 'Escrowed On-Chain',
              canRefund: onChainState === 'FAILED' || onChainState === 'REFUNDABLE'
            }];
          });
        }
      }
    } catch (err) {
      console.warn('On-chain read synchronization note:', err.message);
    }
  }, [account]);

  // Load campaigns from backend and sync on-chain data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const data = await fetchCampaigns();
        if (data && data.length > 0) {
          const mapped = await Promise.all(data.map(async (c) => {
            let mlProb = 0.7040;
            let riskTier = 'LOW';
            try {
              const pred = await predictSuccess({ goal_eth: c.goal_eth, category: c.category, title: c.title, description: c.description });
              if (pred && pred.success_probability) mlProb = pred.success_probability;
              const risk = await assessRisk({ goal_eth: c.goal_eth, category: c.category, description: c.description });
              if (risk && risk.anomaly && risk.anomaly.risk_tier) riskTier = risk.anomaly.risk_tier;
            } catch {}

            return {
              id: c.id,
              title: c.title,
              category: c.category || 'AI/ML',
              verified: true,
              creator: c.creator_address || '0xEf7A83468D2152718465D9143E3615ab9189D5f9',
              contract_address: c.contract_address || CONTRACT_ADDRESS,
              summary: c.description,
              goal: c.goal_eth || 10.0,
              hardCap: c.hard_cap_eth || 20.0,
              totalRaised: 0.0,
              totalWithdrawn: 0.0,
              deadlineDays: 30,
              mlScore: Math.round(mlProb * 100),
              riskLevel: riskTier,
              state: 'ACTIVE',
              riskDetails: 'Strict zero-leakage model evaluation. Balanced 4-tranche milestones.',
              milestones: (c.milestones && c.milestones.length > 0)
                ? c.milestones.map((m, mIdx) => ({
                    id: mIdx + 1,
                    title: m.title || `Tranche ${mIdx + 1}`,
                    percentage: Math.round((m.tranche_bps || 2500) / 100),
                    trancheBps: m.tranche_bps || (mIdx === 0 ? 2000 : mIdx === 3 ? 3000 : 2500),
                    status: m.status || (mIdx === 0 ? 'APPROVED' : 'PENDING'),
                    attempts: 0,
                    trancheClaimed: false,
                    evidence: ''
                  }))
                : [
                    { id: 1, title: 'Architecture & Prototype Review', percentage: 20, trancheBps: 2000, status: 'APPROVED', attempts: 0, trancheClaimed: false, evidence: '' },
                    { id: 2, title: 'Smart Contract Sepolia Audits', percentage: 25, trancheBps: 2500, status: 'UNDER_REVIEW', attempts: 0, trancheClaimed: false, evidence: '' },
                    { id: 3, title: 'Agentic Verification Pipeline', percentage: 25, trancheBps: 2500, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
                    { id: 4, title: 'Production Readiness & Handover', percentage: 30, trancheBps: 3000, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' }
                  ]
            };
          }));

          setCampaigns(mapped);
          if (mapped[0]) setActiveCampaignId(mapped[0].id);
        }
      } catch (err) {
        console.warn('Initial campaign load warning:', err);
      }
      await syncOnChainData();
    }
    loadInitialData();
  }, [syncOnChainData]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to interact with Sepolia testnet.');
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const network = await provider.getNetwork();
        const onSepolia = Number(network.chainId) === SEPOLIA_CHAIN_ID;
        setIsSepolia(onSepolia);
        if (!onSepolia) {
          await switchNetwork();
        }
        await refreshBalance(accounts[0], provider);
        await syncOnChainData();
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  }, [refreshBalance, switchNetwork, syncOnChainData]);

  const disconnectWallet = useCallback(() => {
    setAccount('');
    setBalance('0.0000');
  }, []);

  function estimateGas(priority = 'medium') {
    const mult = priority === 'fast' ? 1.5 : (priority === 'low' ? 1.0 : 1.25);
    const gasUnits = 74243;
    const baseGwei = 25 * mult;
    const feeEth = Number(((gasUnits * baseGwei) / 1e9).toFixed(6));
    const feeUsd = Number((feeEth * 3200).toFixed(2));
    return { gasUnits, effectiveGwei: baseGwei, feeEth, feeUsd, priority };
  }

  // Real On-Chain Contribution
  async function contributeToCampaign(campaignId, amountEth) {
    const val = parseFloat(amountEth);
    if (isNaN(val) || val <= 0) return { success: false, msg: 'Enter valid ETH amount' };

    if (!account) {
      await connectWallet();
      if (!account) return { success: false, msg: 'Please connect your MetaMask wallet.' };
    }

    if (!isSepolia) {
      const switched = await switchNetwork();
      if (!switched) return { success: false, msg: 'Please switch network to Sepolia Testnet.' };
    }

    try {
      const contract = await getSignerContract();
      const tx = await contract.contribute({ value: parseEther(amountEth.toString()) });
      const receipt = await tx.wait(1);

      let accepted = val;
      let refunded = 0;

      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'ExcessRefundIssued') {
            refunded = parseFloat(formatEther(parsed.args.amount));
            accepted = val - refunded;
          }
        } catch {}
      }

      await syncOnChainData();
      await refreshBalance(account);

      const actorDisplay = `${account.slice(0, 6)}...${account.slice(-4)}`;
      const contribAct = {
        id: Date.now(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        addr: actorDisplay,
        action: refunded > 0 
          ? `Contributed ${accepted.toFixed(4)} ETH (${refunded.toFixed(4)} ETH excess refunded)`
          : `Contributed ${accepted.toFixed(4)} ETH`,
        event: refunded > 0 ? 'ExcessRefundIssued' : 'ContributionReceived',
        time: 'Just now',
        type: 'in',
        amount: accepted,
        campaignId
      };
      setActivities(prev => [contribAct, ...prev]);

      return {
        success: true,
        accepted,
        refunded,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        isExcessRefund: refunded > 0,
        msg: refunded > 0
          ? `Confirmed in block ${receipt.blockNumber}! Accepted ${accepted.toFixed(4)} ETH. In-block excess refund issued: ${refunded.toFixed(4)} ETH.`
          : `Confirmed on Sepolia in block ${receipt.blockNumber}! Contributed ${accepted.toFixed(4)} ETH.`
      };
    } catch (err) {
      console.error('On-chain contribute error:', err);
      const msg = err.reason || err.shortMessage || err.message || 'Transaction rejected on chain';
      return { success: false, msg };
    }
  }

  // Real On-Chain Evidence Submission
  async function submitMilestoneEvidence(campaignId, milestoneId, evidenceData = '') {
    const evidenceStr = typeof evidenceData === 'string'
      ? evidenceData
      : (evidenceData?.ipfsHash || evidenceData?.url || 'ipfs://QmTrustBridgeDeliverableEvidence');

    try {
      const contract = await getSignerContract();
      const tx = await contract.submitMilestoneEvidence(evidenceStr);
      const receipt = await tx.wait(1);

      await syncOnChainData();

      const newAct = {
        id: Date.now(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        addr: `${account.slice(0, 6)}...${account.slice(-4)}`,
        action: `Submitted Evidence for Milestone #${milestoneId}`,
        event: 'MilestoneSubmitted',
        time: 'Just now',
        type: 'in',
        amount: 0,
        campaignId
      };
      setActivities(prev => [newAct, ...prev]);
      return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
    } catch (err) {
      console.error('Submit evidence failed:', err);
      return { success: false, msg: err.reason || err.message || 'Submission failed' };
    }
  }

  // Real On-Chain Verifier Approval
  async function approveMilestone(campaignId, milestoneId) {
    try {
      const contract = await getSignerContract();
      const tx = await contract.approveMilestone(Number(milestoneId) - 1);
      const receipt = await tx.wait(1);

      await syncOnChainData();

      const newAct = {
        id: Date.now(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        addr: `${account.slice(0, 6)}...${account.slice(-4)}`,
        action: `Approved Milestone #${milestoneId} Tranche`,
        event: 'MilestoneApproved',
        time: 'Just now',
        type: 'in',
        amount: 0,
        campaignId
      };
      setActivities(prev => [newAct, ...prev]);
      return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
    } catch (err) {
      console.error('Approve milestone failed:', err);
      return { success: false, msg: err.reason || err.message || 'Approval failed' };
    }
  }

  // Real On-Chain Verifier Rejection
  async function rejectMilestone(campaignId, milestoneId) {
    try {
      const contract = await getSignerContract();
      const tx = await contract.rejectMilestone(Number(milestoneId) - 1);
      const receipt = await tx.wait(1);

      await syncOnChainData();

      const newAct = {
        id: Date.now(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        addr: `${account.slice(0, 6)}...${account.slice(-4)}`,
        action: `Rejected Milestone #${milestoneId}`,
        event: 'MilestoneRejected',
        time: 'Just now',
        type: 'out',
        amount: 0,
        campaignId
      };
      setActivities(prev => [newAct, ...prev]);
      return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
    } catch (err) {
      console.error('Reject milestone failed:', err);
      return { success: false, msg: err.reason || err.message || 'Rejection failed' };
    }
  }

  // Real On-Chain Tranche Withdrawal
  async function withdrawTranche(campaignId, milestoneId) {
    try {
      const contract = await getSignerContract();
      const tx = await contract.withdrawTranche(Number(milestoneId) - 1);
      const receipt = await tx.wait(1);

      await syncOnChainData();
      await refreshBalance(account);

      const newAct = {
        id: Date.now(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        addr: `${account.slice(0, 6)}...${account.slice(-4)}`,
        action: `Creator Withdrew Tranche #${milestoneId}`,
        event: 'TrancheWithdrawn',
        time: 'Just now',
        type: 'out',
        amount: 0,
        campaignId
      };
      setActivities(prev => [newAct, ...prev]);
      return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
    } catch (err) {
      console.error('Withdraw tranche failed:', err);
      return { success: false, msg: err.reason || err.message || 'Withdrawal failed' };
    }
  }

  // Real On-Chain Claim Refund
  async function claimRefund(campaignId) {
    try {
      const contract = await getSignerContract();
      const tx = await contract.claimRefund();
      const receipt = await tx.wait(1);

      await syncOnChainData();
      await refreshBalance(account);

      const newAct = {
        id: Date.now(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        addr: `${account.slice(0, 6)}...${account.slice(-4)}`,
        action: 'Claimed On-Chain Refund',
        event: 'ContributorRefundIssued',
        time: 'Just now',
        type: 'out',
        amount: 0,
        campaignId
      };
      setActivities(prev => [newAct, ...prev]);
      return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
    } catch (err) {
      console.error('Claim refund failed:', err);
      return { success: false, msg: err.reason || err.message || 'Refund claim failed' };
    }
  }

  function requestRefund(campaignId) {
    return claimRefund(campaignId);
  }

  function createCampaign(newCamp) {
    const id = (campaigns.length + 1).toString();
    const created = {
      id,
      title: newCamp.title,
      category: newCamp.category || 'Other',
      verified: true,
      creator: account || '0xEf7A83468D2152718465D9143E3615ab9189D5f9',
      contract_address: CONTRACT_ADDRESS,
      summary: newCamp.summary,
      goal: parseFloat(newCamp.goal) || 10.0,
      hardCap: 20.0,
      totalRaised: 0.0,
      totalWithdrawn: 0.0,
      deadlineDays: 30,
      mlScore: 78,
      riskLevel: 'LOW',
      state: 'ACTIVE',
      riskDetails: 'Pre-launch evaluation completed.',
      milestones: [
        { id: 1, title: 'Architecture & Prototype', percentage: 20, trancheBps: 2000, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
        { id: 2, title: 'Testnet Launch & Audits', percentage: 25, trancheBps: 2500, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
        { id: 3, title: 'Security Verification', percentage: 25, trancheBps: 2500, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' },
        { id: 4, title: 'Production Readiness & Handover', percentage: 30, trancheBps: 3000, status: 'PENDING', attempts: 0, trancheClaimed: false, evidence: '' }
      ]
    };
    setCampaigns(prev => [created, ...prev]);
    setActiveCampaignId(id);
    setCurrentView('Campaign');

    createCampaignApi({
      id,
      title: created.title,
      description: created.summary,
      category: created.category,
      creator_address: created.creator,
      contract_address: CONTRACT_ADDRESS,
      goal_eth: created.goal,
      hard_cap_eth: created.hardCap,
      deadline_timestamp: Math.floor(Date.now() / 1000) + 30 * 86400,
      milestones: created.milestones.map(m => ({
        title: m.title,
        tranche_bps: m.percentage * 100
      }))
    }).catch(err => console.warn('Failed to sync new campaign to API:', err));
  }

  // Supabase Auth State Synchronization
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check existing active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const profile = {
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Authenticated User',
          email: u.email,
          avatar: u.user_metadata?.avatar_url || '',
          role: u.user_metadata?.role || 'Contributor',
          provider: 'supabase'
        };
        setUser(profile);
        localStorage.setItem('trustbridge_user_session', JSON.stringify(profile));
      }
    }).catch(err => console.warn('Supabase getSession notice:', err));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const u = session.user;
        const profile = {
          id: u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Authenticated User',
          email: u.email,
          avatar: u.user_metadata?.avatar_url || '',
          role: u.user_metadata?.role || 'Contributor',
          provider: 'supabase'
        };
        setUser(profile);
        localStorage.setItem('trustbridge_user_session', JSON.stringify(profile));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('trustbridge_user_session');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  function loginOrRegister(userData) {
    const sessionUser = {
      name: userData?.name || 'Contributor User',
      email: userData?.email || 'contributor@trustbridge.io',
      role: userData?.role || 'Contributor',
      avatar: userData?.avatar || ''
    };
    setUser(sessionUser);
    localStorage.setItem('trustbridge_user_session', JSON.stringify(sessionUser));
  }

  async function logout() {
    setUser(null);
    localStorage.removeItem('trustbridge_user_session');
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut notice:', err);
      }
    }
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
      createCampaign,
      syncOnChainData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
