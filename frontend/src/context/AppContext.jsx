import React, { createContext, useContext, useState } from 'react';
import { BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig';
import { MOCK_CAMPAIGNS } from '../mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation / views: 'Landing', 'Auth', 'Campaign', 'Explore', 'Create', 'Contributions', 'Verifier', 'Docs'
  const [currentView, setCurrentView] = useState('Landing');
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [activeCampaignId, setActiveCampaignId] = useState('1');

  // User auth state
  const [user, setUser] = useState(null); // { name, email, role: 'Creator' | 'Contributor' | 'Verifier', kycStatus: 'Verified' }

  // Global activity history
  const [activities, setActivities] = useState([
    { id: 1, addr: '0x5c3...9a2f', action: 'Contributed 0.5 ETH', time: '2m ago', type: 'in', amount: 0.5 },
    { id: 2, addr: '0x1d7...3e9b', action: 'Contributed 1.0 ETH', time: '12m ago', type: 'in', amount: 1.0 },
    { id: 3, addr: '0x9a4...7c1d', action: 'Requested refund 0.2 ETH', time: '1h ago', type: 'out', amount: 0.2 },
    { id: 4, addr: '0x3f8...6b2e', action: 'Contributed 2.0 ETH', time: '2h ago', type: 'in', amount: 2.0 },
  ]);

  // User personal contributions
  const [myContributions, setMyContributions] = useState([
    { campaignId: '1', title: 'AuraMesh: IoT Edge Sensing Node', amount: 1.5, status: 'Escrowed', canRefund: true },
    { campaignId: '2', title: 'EcoPulse: Modular Biogas Digester', amount: 0.5, status: 'Escrowed', canRefund: true }
  ]);

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);
        if (!user) {
          setUser({
            name: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
            email: 'user@sepolia.eth',
            role: 'Contributor',
            kycStatus: 'Verified'
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      alert('MetaMask not detected! Using testnet sandbox wallet.');
      setAccount('0x7B2a...4Fa1');
      if (!user) {
        setUser({
          name: 'Anonymous Backer',
          email: 'demo@trustbridge.io',
          role: 'Contributor',
          kycStatus: 'Verified'
        });
      }
    }
  }

  function loginOrRegister(userData) {
    setUser(userData);
    if (!account) {
      setAccount('0x7B2a...4Fa1');
    }
    setCurrentView('Campaign');
  }

  function logout() {
    setUser(null);
    setAccount('');
    setCurrentView('Landing');
  }

  function contributeToCampaign(campaignId, amountEth) {
    const val = parseFloat(amountEth);
    if (isNaN(val) || val <= 0) return { success: false, msg: 'Enter valid ETH amount' };

    let accepted = 0;
    let refunded = 0;

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const remaining = c.hardCap - c.totalRaised;
        accepted = Math.min(val, remaining);
        refunded = val - accepted;
        const newTotal = c.totalRaised + accepted;
        return {
          ...c,
          totalRaised: Number(newTotal.toFixed(2))
        };
      }
      return c;
    }));

    if (accepted > 0) {
      const newAct = {
        id: Date.now(),
        addr: account ? `${account.slice(0, 5)}...${account.slice(-4)}` : '0xUser...Wallet',
        action: `Contributed ${accepted.toFixed(2)} ETH`,
        time: 'Just now',
        type: 'in',
        amount: accepted
      };
      setActivities(prev => [newAct, ...prev]);

      setMyContributions(prev => {
        const exist = prev.find(item => item.campaignId === campaignId);
        if (exist) {
          return prev.map(item => item.campaignId === campaignId ? { ...item, amount: item.amount + accepted } : item);
        }
        return [...prev, { campaignId, title: activeCampaign.title, amount: accepted, status: 'Escrowed', canRefund: true }];
      });
    }

    return {
      success: true,
      accepted,
      refunded,
      msg: refunded > 0 
        ? `Accepted ${accepted.toFixed(2)} ETH. Automatically refunded ${refunded.toFixed(2)} ETH excess!`
        : `Successfully contributed ${accepted.toFixed(2)} ETH!`
    };
  }

  function requestRefund(campaignId) {
    let refundAmt = 0;
    setMyContributions(prev => prev.filter(c => {
      if (c.campaignId === campaignId) {
        refundAmt = c.amount;
        return false;
      }
      return true;
    }));

    if (refundAmt > 0) {
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId) {
          return { ...c, totalRaised: Math.max(0, c.totalRaised - refundAmt) };
        }
        return c;
      }));

      const newAct = {
        id: Date.now(),
        addr: account ? `${account.slice(0, 5)}...${account.slice(-4)}` : '0xUser...Wallet',
        action: `Refunded ${refundAmt.toFixed(2)} ETH`,
        time: 'Just now',
        type: 'out',
        amount: refundAmt
      };
      setActivities(prev => [newAct, ...prev]);
      return { success: true, msg: `Refunded ${refundAmt.toFixed(2)} ETH successfully!` };
    }
    return { success: false, msg: 'No contribution available to refund.' };
  }

  function approveMilestone(campaignId, milestoneId) {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const updatedMilestones = c.milestones.map(m => {
          if (m.id === milestoneId) return { ...m, status: 'APPROVED' };
          return m;
        });
        return { ...c, milestones: updatedMilestones };
      }
      return c;
    }));

    const newAct = {
      id: Date.now(),
      addr: '0xVerifier...Auth',
      action: `Approved Milestone #${milestoneId}`,
      time: 'Just now',
      type: 'in',
      amount: 0
    };
    setActivities(prev => [newAct, ...prev]);
  }

  function createCampaign(newCamp) {
    const id = (campaigns.length + 1).toString();
    const created = {
      id,
      title: newCamp.title,
      category: newCamp.category || 'Hardware / IoT',
      verified: true,
      creator: account || '0x3Fa8...2241F',
      summary: newCamp.summary,
      goal: parseFloat(newCamp.goal) || 10.0,
      hardCap: 20.0,
      totalRaised: 0.0,
      deadlineDays: 30,
      mlScore: 84,
      riskLevel: 'LOW',
      riskDetails: 'Structural evaluation passed. Realistic roadmap deliverables with balanced tranches.',
      milestones: [
        { id: 1, title: 'Tranche 1 (20%)', percentage: 20, status: 'PENDING', evidence: '' },
        { id: 2, title: 'Tranche 2 (25%)', percentage: 25, status: 'PENDING', evidence: '' },
        { id: 3, title: 'Tranche 3 (25%)', percentage: 25, status: 'PENDING', evidence: '' },
        { id: 4, title: 'Tranche 4 (30%)', percentage: 30, status: 'PENDING', evidence: '' },
      ]
    };
    setCampaigns(prev => [created, ...prev]);
    setActiveCampaignId(id);
    setCurrentView('Campaign');
  }

  return (
    <AppContext.Provider value={{
      account,
      connectWallet,
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
      requestRefund,
      approveMilestone,
      createCampaign
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
