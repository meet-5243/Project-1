import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Calendar, Users, SlidersHorizontal, Search, Filter, 
  ArrowUpRight, ArrowDownLeft, Trash2, ShieldCheck, Clock, X, ChevronDown 
} from 'lucide-react';
import HomeButton from './HomeButton';

const ExpenseHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State variables
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'payer' | 'debtor'
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Fetch groups to populate filter
  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/groups');
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error('Error fetching groups for filter:', err);
    }
  };

  // Fetch expenses with active filters
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'all') {
        params.filterType = filterType;
      }
      if (filterType === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (selectedGroupId) {
        params.groupId = selectedGroupId;
      }

      const res = await axios.get('/api/expenses/history', { params });
      setExpenses(res.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, startDate, endDate, selectedGroupId]);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    // Only trigger fetch for custom range if both dates are specified
    if (filterType === 'custom' && (!startDate || !endDate)) {
      return;
    }
    fetchExpenses();
  }, [filterType, startDate, endDate, selectedGroupId, fetchExpenses]);

  // Format date helper
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    
    // Check if today
    if (d.toDateString() === now.toDateString()) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return d.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }) + `, ` + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Process data locally for client-side search & role filtering
  const processedExpenses = expenses.filter(exp => {
    // 1. Text Search matching description/name or group name
    const matchText = searchQuery.trim() === '' || 
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.groupId && exp.groupId.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Role Filter matching paid by me vs owed by me
    const isPayer = exp.creatorId && (exp.creatorId._id || exp.creatorId).toString() === user?._id?.toString();
    const matchRole = roleFilter === 'all' || 
      (roleFilter === 'payer' && isPayer) ||
      (roleFilter === 'debtor' && !isPayer);

    return matchText && matchRole;
  });

  const getPayerName = (exp) => {
    const isPayer = exp.creatorId && (exp.creatorId._id || exp.creatorId).toString() === user?._id?.toString();
    return isPayer ? 'You' : (exp.creatorId?.name || 'Unknown');
  };

  const getInvolvedText = (exp) => {
    const isPayer = exp.creatorId && (exp.creatorId._id || exp.creatorId).toString() === user?._id?.toString();
    if (isPayer) {
      const others = exp.involvedMembers
        .filter(m => {
          const mId = m.userId?._id || m.userId;
          return mId && mId.toString() !== user?._id?.toString();
        })
        .map(m => m.userId?.name || 'Unknown');
      return others.length > 0 ? `with ${others.join(', ')}` : 'alone';
    } else {
      return `Paid by ${exp.creatorId?.name || 'Unknown'}`;
    }
  };

  const getUserShare = (exp) => {
    if (!user || !user._id) return 0;
    const mySplit = exp.involvedMembers.find(m => {
      const mId = m.userId?._id || m.userId;
      return mId && mId.toString() === user._id.toString();
    });
    return mySplit ? mySplit.amountOwed : 0;
  };

  const handleQuickPeriodSelect = (type) => {
    setFilterType(type);
    if (type === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-12 p-4 md:p-8">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* Header */}
      <header className="flex justify-between items-center glass-panel p-4 rounded-2xl mb-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition duration-200"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
              Expense History
            </h1>
            <p className="text-[11px] text-gray-500">Track and filter where you spent your money</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20">
          <SlidersHorizontal size={14} />
          <span>Filters Active</span>
        </div>
      </header>

      {/* Filters Board */}
      <div className="glass-panel p-6 rounded-3xl mb-8 animate-fade-in [animation-delay:100ms] flex flex-col gap-6 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        {/* Search & Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text"
              placeholder="Search expenses by name or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Group Filter */}
          <div className="relative">
            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-white">All Groups</option>
              {groups.map(g => (
                <option key={g._id} value={g._id} className="bg-zinc-900 text-white">{g.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">All Transactions</option>
              <option value="payer" className="bg-zinc-900 text-white">Paid by Me</option>
              <option value="debtor" className="bg-zinc-900 text-white">Owed by Me</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
          </div>
        </div>

        {/* Time Period Filter Row */}
        <div className="flex flex-col gap-3">
          <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider px-1">Time Period</label>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { type: 'all', label: 'All Time' },
              { type: 'today', label: 'Today' },
              { type: 'yesterday', label: 'Yesterday' },
              { type: 'week', label: 'Last 7 Days' },
              { type: 'month', label: 'Last 30 Days' },
              { type: 'custom', label: 'Custom Range' },
            ].map(tab => {
              const active = filterType === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => handleQuickPeriodSelect(tab.type)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 shrink-0 ${
                    active 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                      : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Range Picker */}
        {showCustomPicker && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row gap-4 items-end animate-fade-in">
            <div className="flex-1 w-full">
              <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#111214] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500/40"
                />
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#111214] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500/40"
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition shrink-0 w-full sm:w-auto"
              >
                Clear Range
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expenses History List */}
      <div className="animate-fade-in [animation-delay:200ms]">
        <div className="flex justify-between items-center mb-5 px-1">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
            Records found: {processedExpenses.length}
          </h2>
          {searchQuery || selectedGroupId || roleFilter !== 'all' || filterType !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGroupId('');
                setRoleFilter('all');
                setFilterType('all');
                setShowCustomPicker(false);
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline transition"
            >
              Reset All Filters
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" style={{ borderWidth: '3px' }} />
            <p className="text-sm">Fetching expense transactions...</p>
          </div>
        ) : processedExpenses.length === 0 ? (
          <div className="glass-panel p-12 text-center border border-white/5 rounded-3xl">
            <div className="w-16 h-16 bg-white/5 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Clock size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-300 mb-1">No Transactions Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are no expenses matching your search or filters. Try altering your parameters or resetting them.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {processedExpenses.map((exp, idx) => {
              const isPayer = exp.creatorId && (exp.creatorId._id || exp.creatorId).toString() === user?._id?.toString();
              const myShare = getUserShare(exp);
              const totalAmount = exp.amount;

              // Check global status (are all splits settled?)
              const allSplitsPaid = exp.involvedMembers.every(m => m.paymentStatus !== 'PENDING');

              return (
                <div key={exp._id} className="glass-card p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                  {/* Left segment - type, title, status */}
                  <div className="flex gap-4 items-start min-w-0 flex-1">
                    <div className={`p-3 rounded-2xl flex-shrink-0 border flex items-center justify-center ${
                      isPayer 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                    }`}>
                      {isPayer ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-black text-base text-gray-100 truncate max-w-[240px] md:max-w-[320px]">
                          {exp.description}
                        </span>
                        {exp.groupId && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 tracking-wide uppercase shrink-0">
                            {exp.groupId.name}
                          </span>
                        )}
                        {allSplitsPaid ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                            <ShieldCheck size={10} /> Fully Settled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 flex items-center gap-1 shrink-0">
                            <Clock size={10} /> Pending Splits
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 mb-2 font-medium">
                        {getInvolvedText(exp)}
                      </p>

                      <p className="text-[10px] text-gray-500 flex items-center gap-1 font-semibold">
                        <Calendar size={12} className="opacity-75" />
                        {formatDate(exp.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right segment - financial details */}
                  <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center w-full md:w-auto border-t border-white/5 md:border-t-0 pt-3.5 md:pt-0 gap-1.5 flex-shrink-0">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-black md:hidden">Personal Share</span>
                    <div className="text-right flex flex-col">
                      {isPayer ? (
                        <>
                          <span className="text-lg font-black text-emerald-400">&#8377;{myShare.toFixed(2)}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Your Share (Paid ₹{totalAmount.toFixed(2)})</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-black text-rose-400">&#8377;{myShare.toFixed(2)}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Your Share (Owe)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <HomeButton />
    </div>
  );
};

export default ExpenseHistory;
