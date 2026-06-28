"use client";

import React, { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";

export default function SuperAdminPage() {
  const { 
    account, 
    isSuperAdmin, 
    isConnecting, 
    contract, 
    connectWallet,
    superAdminsList,
    authoritiesList,
    fetchLists
  } = useAdmin();
  
  const [targetAddress, setTargetAddress] = useState("");
  const [actionType, setActionType] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    if (contract && isSuperAdmin) {
      fetchProposals();
    }
  }, [contract, isSuperAdmin]);

  const fetchProposals = async () => {
    if (!contract) return;
    try {
      const count = await contract.proposalCount();
      const loadedProposals = [];
      for (let i = Number(count); i > 0; i--) {
        const p = await contract.proposals(i);
        loadedProposals.push({
          id: i,
          target: p.target,
          actionType: Number(p.actionType),
          votes: Number(p.votes),
          executed: p.executed,
        });
      }
      setProposals(loadedProposals);
      
      // Also refresh lists when proposals load
      await fetchLists();
    } catch (error) {
      console.error("Error fetching proposals", error);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    
    setIsSubmitting(true);
    try {
      // We lowercase the address to prevent ethers.js strict checksum errors
      const safeAddress = targetAddress.trim().toLowerCase();
      const tx = await contract.submitProposal(safeAddress, Number(actionType));
      await tx.wait();
      alert("Proposal submitted successfully!");
      setTargetAddress("");
      fetchProposals();
    } catch (error: any) {
      console.error(error);
      alert("Failed to submit proposal. See console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (proposalId: number) => {
    if (!contract) return;
    try {
      const tx = await contract.vote(proposalId);
      await tx.wait();
      alert("Vote cast successfully!");
      fetchProposals();
    } catch (error: any) {
      console.error(error);
      alert("Failed to cast vote. See console for details.");
    }
  };

  const getActionName = (type: number) => {
    switch(type) {
      case 0: return "Add Super Admin";
      case 1: return "Remove Super Admin";
      case 2: return "Add Authority";
      case 3: return "Remove Authority";
      default: return "Unknown";
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <h1 className="text-3xl font-bold mb-4 text-slate-800">Super Admin Portal</h1>
        <p className="text-slate-600 mb-8 text-center max-w-md">
          Connect your MetaMask wallet to access the decentralized governance dashboard.
        </p>
        <button 
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors disabled:opacity-50"
        >
          {isConnecting ? "Connecting..." : "Connect MetaMask"}
        </button>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center max-w-md">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>Your connected address ({account.substring(0, 6)}...{account.substring(account.length - 4)}) is not registered as a Super Admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Super Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage system authorities and governance</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-mono text-slate-600 shadow-sm">
          🟢 Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit Proposal Form */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Create Proposal</h2>
            <form onSubmit={handleSubmitProposal}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Wallet Address</label>
                <input 
                  type="text" 
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Action Type</label>
                <select 
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="0">Add Super Admin</option>
                  <option value="1">Remove Super Admin</option>
                  <option value="2">Add Authority</option>
                  <option value="3">Remove Authority</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Proposal"}
              </button>
            </form>
          </div>
              {/* Active Governance Members Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Super Admins</h3>
                  {superAdminsList.length === 0 ? (
                    <p className="text-sm text-gray-500">No super admins found.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {superAdminsList.map((admin, idx) => (
                        <div key={`sa-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <p className="font-mono text-sm text-gray-700 break-all">{admin}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Authorities</h3>
                  {authoritiesList.length === 0 ? (
                    <p className="text-sm text-gray-500">No authorities configured.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {authoritiesList.map((auth, idx) => (
                        <div key={`auth-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs shrink-0">
                            A
                          </div>
                          <p className="font-mono text-sm text-gray-700 break-all">{auth}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Recent Proposals */}
            <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Recent Proposals</h2>
              <button onClick={fetchProposals} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </div>
            
            {proposals.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No proposals found.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {proposals.map((prop) => (
                  <li key={prop.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded">#{prop.id}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${prop.executed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {prop.executed ? 'Executed' : 'Pending'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900">{getActionName(prop.actionType)}</h3>
                        <p className="text-sm text-slate-500 font-mono mt-1 break-all">Target: {prop.target}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-700">Votes</div>
                          <div className="text-xl font-bold text-blue-600">{prop.votes} <span className="text-sm text-slate-400 font-normal">/ 3</span></div>
                        </div>
                        
                        {!prop.executed && (
                          <button 
                            onClick={() => handleVote(prop.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
                          >
                            Vote Yes
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
