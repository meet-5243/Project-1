import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, UserPlus, Receipt, Users, PlusCircle, ChevronDown, ChevronUp, Trophy, TrendingUp, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GroupDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  
  // Expense Form State
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splits, setSplits] = useState({}); // { memberId: "amount" }
  const [expandedExpenses, setExpandedExpenses] = useState({});
  const [activeLeftTab, setActiveLeftTab] = useState('members'); // 'members' or 'leaderboards'

  const getLocalDateStringInit = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayInit = new Date();
  const initialToday = getLocalDateStringInit(todayInit);
  
  const yesterdayDateInit = new Date(todayInit);
  yesterdayDateInit.setDate(todayInit.getDate() - 1);
  const initialYesterday = getLocalDateStringInit(yesterdayDateInit);

  const [filterType, setFilterType] = useState('today'); // 'all', 'today', 'yesterday', 'specific_date', 'member'
  const [selectedDate, setSelectedDate] = useState(initialYesterday);
  const [selectedMember, setSelectedMember] = useState('');

  const fetchGroupDetails = async () => {
    try {
      // In a real app we'd have a specific GET /api/groups/:id, 
      // but we can just fetch all and filter for now to save time
      const res = await axios.get('/api/groups');
      const foundGroup = res.data.groups.find(g => g._id === id);
      setGroup(foundGroup);
      if (foundGroup && user) {
        setPayerId(user._id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`/api/expenses/${id}`);
      setExpenses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
    fetchExpenses();
  }, [id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/groups/${id}/invite`, { email: inviteEmail });
      setInviteEmail('');
      alert('Invitation sent successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send invite');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const totalAmount = parseFloat(expenseAmount);
      if (!totalAmount || isNaN(totalAmount)) return alert("Invalid amount");

      const involvedMembers = Object.entries(splits)
        .map(([userId, amount]) => ({
          userId,
          amountOwed: parseFloat(amount) || 0
        }))
        .filter(m => m.amountOwed > 0);

      if (involvedMembers.length === 0) {
        return alert("Please specify the amount for at least one member");
      }

      const sum = involvedMembers.reduce((acc, curr) => acc + curr.amountOwed, 0);
      if (Math.abs(sum - totalAmount) > 0.1) {
        if (!window.confirm(`The split amounts (₹${sum.toFixed(2)}) don't match the total (₹${totalAmount}). Continue anyway?`)) {
          return;
        }
      }

      await axios.post('/api/expenses', {
        groupId: id,
        amount: totalAmount,
        description: expenseDesc,
        involvedMembers,
        payerId
      });

      setShowExpenseForm(false);
      setExpenseAmount('');
      setExpenseDesc('');
      setSplits({});
      fetchExpenses();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add expense');
    }
  };

  const handleToggleExpenseForm = () => {
    const nextShow = !showExpenseForm;
    setShowExpenseForm(nextShow);
    if (nextShow && group) {
      // Pre-select all members of the group by default
      const defaultSplits = {};
      group.members.forEach(m => {
        defaultSplits[m._id] = '';
      });
      setSplits(defaultSplits);
    }
  };

  const handleAmountChange = (val) => {
    setExpenseAmount(val);
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount > 0) {
      const selectedMemberIds = Object.keys(splits);
      if (selectedMemberIds.length > 0) {
        const equalAmount = (amount / selectedMemberIds.length).toFixed(2);
        const newSplits = {};
        selectedMemberIds.forEach(id => {
          newSplits[id] = equalAmount;
        });
        setSplits(newSplits);
      }
    } else {
      // Reset splits to blank values if amount is cleared
      const newSplits = {};
      Object.keys(splits).forEach(id => {
        newSplits[id] = '';
      });
      setSplits(newSplits);
    }
  };

  const toggleMemberSelection = (memberId) => {
    setSplits(prev => {
      const newSplits = { ...prev };
      if (newSplits[memberId] !== undefined) {
        delete newSplits[memberId];
      } else {
        newSplits[memberId] = '';
      }

      // Auto-recalculate split if there is a total amount entered
      const amount = parseFloat(expenseAmount);
      if (!isNaN(amount) && amount > 0) {
        const selectedMemberIds = Object.keys(newSplits);
        if (selectedMemberIds.length > 0) {
          const equalAmount = (amount / selectedMemberIds.length).toFixed(2);
          selectedMemberIds.forEach(id => {
            newSplits[id] = equalAmount;
          });
        }
      }
      return newSplits;
    });
  };

  const handleSplitEqually = () => {
    const totalAmount = parseFloat(expenseAmount);
    if (!totalAmount || isNaN(totalAmount)) return alert("Enter total amount first");
    
    const memberIds = Object.keys(splits);
    if (memberIds.length === 0) return alert("Select at least one member to split with");

    const equalAmount = (totalAmount / memberIds.length).toFixed(2);
    const newSplits = {};
    memberIds.forEach(id => {
      newSplits[id] = equalAmount;
    });
    setSplits(newSplits);
  };

  const handleMarkAsPaid = async (expenseId, userId, method) => {
    try {
      await axios.post(`/api/expenses/${expenseId}/pay/${userId}`, { method });
      fetchExpenses(); // Refresh the list
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const toggleExpenseExpand = (expenseId) => {
    setExpandedExpenses(prev => ({
      ...prev,
      [expenseId]: !prev[expenseId]
    }));
  };

  if (!group) return <div className="min-h-screen bg-[#0a0a0a] text-white p-8">Loading...</div>;

  // Calculate Leaderboards
  const memberStats = {};
  group.members.forEach(m => {
    memberStats[m._id] = { id: m._id, name: m.name, paidTotal: 0, spentTotal: 0 };
  });

  expenses.forEach(exp => {
    // Add to paid total for creator
    if (memberStats[exp.creatorId._id]) {
      memberStats[exp.creatorId._id].paidTotal += exp.amount;
    }
    // Add to spent total for all involved members
    exp.involvedMembers.forEach(split => {
      if (memberStats[split.userId._id]) {
        memberStats[split.userId._id].spentTotal += split.amountOwed;
      }
    });
  });

  const mostGenerous = Object.values(memberStats).sort((a, b) => b.paidTotal - a.paidTotal).filter(s => s.paidTotal > 0);
  const bigSpenders = Object.values(memberStats).sort((a, b) => b.spentTotal - a.spentTotal).filter(s => s.spentTotal > 0);

  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Timezone-safe: compares date strings in LOCAL time, not UTC
  const toLocalDateStr = (isoString) => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredExpenses = expenses.filter(exp => {
    if (filterType === 'all') return true;

    if (filterType === 'member') {
      if (!selectedMember) return true;
      // Show expenses paid by this member (lifetime payments made by them)
      return exp.creatorId._id === selectedMember;
    }

    const expDateStr = toLocalDateStr(exp.createdAt);
    if (filterType === 'today')         return expDateStr === initialToday;
    if (filterType === 'yesterday')     return expDateStr === initialYesterday;
    if (filterType === 'specific_date') return expDateStr === selectedDate;

    return true;
  });

  const pendingExpenses = filteredExpenses.filter(exp => exp.involvedMembers.some(m => m.paymentStatus === 'PENDING'));
  const completedExpenses = filteredExpenses.filter(exp => exp.involvedMembers.every(m => m.paymentStatus !== 'PENDING'));

  const renderExpenseList = (list) => {
    if (list.length === 0) {
      return <div className="text-center py-6 text-gray-500 text-sm">No expenses here.</div>;
    }
    
    return list.map(expense => {
      const isExpanded = expandedExpenses[expense._id];
      const isCompleted = expense.involvedMembers.every(m => m.paymentStatus !== 'PENDING');
      
      return (
        <div key={expense._id} className="bg-white/5 p-4 rounded-2xl border border-white/5 transition-all">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleExpenseExpand(expense._id)}
          >
            <div>
              <h3 className="font-bold text-base md:text-lg flex items-center gap-2 truncate">
                {expense.description}
                {isCompleted && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Settled</span>}
              </h3>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                Paid by <span className="font-semibold text-gray-300">{expense.creatorId.name}</span>
                <span className="text-white/20">•</span>
                <span>{new Date(expense.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-bold text-emerald-400 text-lg">₹{expense.amount}</p>
              <div className="p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-white transition">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          </div>
          
          {isExpanded && (
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Split Details:</span>
              {expense.involvedMembers.map(m => (
                <div key={m.userId._id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.userId.name}</span>
                    <span className="text-xs text-gray-400">₹{m.amountOwed.toFixed(2)}</span>
                    {m.paymentStatus === 'PAID_ONLINE' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Paid Online</span>
                    )}
                    {m.paymentStatus === 'PAID_PHYSICALLY' && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">Paid Physically</span>
                    )}
                    {m.paymentStatus === 'PENDING' && (
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">Pending</span>
                    )}
                  </div>
                  {m.paymentStatus === 'PENDING' && m.userId._id === user?._id && (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const upiLink = `upi://pay?pa=${expense.creatorId.upiId}&pn=${expense.creatorId.name}&am=${m.amountOwed}&cu=INR`;
                          window.open(upiLink, '_blank');
                          handleMarkAsPaid(expense._id, m.userId._id, 'ONLINE');
                        }}
                        className="text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg transition"
                      >
                        Settle via UPI
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsPaid(expense._id, m.userId._id, 'PHYSICAL');
                        }}
                        className="text-[10px] font-bold bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border border-blue-500/50 px-2 py-1 rounded-lg transition"
                      >
                        Paid Cash
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans pb-20 md:pb-8">
      <header className="flex items-center gap-4 mb-8">
        <Link to="/groups" className="p-2 glass-panel rounded-full hover:bg-white/10 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">{group.name}</h1>
          <p className="text-sm text-gray-400">{group.members.length} Members</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column: Members & Invites */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users size={20} className="text-primary" /> 
              Invite Members
            </h2>
            <form onSubmit={handleInvite} className="flex gap-3">
              <input 
                type="email" 
                placeholder="Friend's Email Address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                required
              />
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-xl transition flex items-center gap-2 font-bold">
                <UserPlus size={18} />
                Invite
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-3">
              They will receive an invitation in their pending invites tab.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex bg-[#0a0a0a]/50 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setActiveLeftTab('members')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition ${activeLeftTab === 'members' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Users size={16} /> Members
              </button>
              <button 
                onClick={() => setActiveLeftTab('leaderboards')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition ${activeLeftTab === 'leaderboards' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <BarChart2 size={16} /> Leaderboards
              </button>
            </div>

            {activeLeftTab === 'members' ? (
              <div className="flex flex-col gap-3">
                {group.members.map(member => (
                  <div key={member._id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 items-center justify-center font-bold text-lg text-black shadow-sm">
                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="font-bold">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Trophy size={16} /> Most Generous
                  </h3>
                  {mostGenerous.length === 0 ? (
                    <p className="text-xs text-gray-500">No payments made yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {mostGenerous.map((stat, index) => (
                        <div key={`gen-${stat.id}`} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-bold w-4">#{index + 1}</span>
                            <span className="font-medium text-sm">{stat.name}</span>
                          </div>
                          <span className="text-emerald-400 font-bold text-sm">₹{stat.paidTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp size={16} /> Big Spenders
                  </h3>
                  {bigSpenders.length === 0 ? (
                    <p className="text-xs text-gray-500">No expenses recorded yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {bigSpenders.map((stat, index) => (
                        <div key={`spnd-${stat.id}`} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-bold w-4">#{index + 1}</span>
                            <span className="font-medium text-sm">{stat.name}</span>
                          </div>
                          <span className="text-orange-400 font-bold text-sm">₹{stat.spentTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Expenses */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Receipt size={20} className="text-cyan-400" />
                Group Expenses
              </h2>
              <button 
                onClick={handleToggleExpenseForm}
                className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 text-sm font-bold"
              >
                <PlusCircle size={16} />
                Add Expense
              </button>
            </div>

            {/* Expense Creation Form */}
            {showExpenseForm && (
              <form onSubmit={handleAddExpense} className="bg-white/5 border border-emerald-500/30 p-4 rounded-2xl mb-6 flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="What was this for? (e.g. Dinner)" 
                  className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} required 
                />
                <input 
                  type="number" 
                  placeholder="Total Amount Paid (₹)" 
                  className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  value={expenseAmount} onChange={e => handleAmountChange(e.target.value)} required 
                />
                
                <div className="mb-4">
                  <label className="text-sm font-semibold mb-2 text-gray-300 block">Who paid?</label>
                  <select 
                    value={payerId} 
                    onChange={e => setPayerId(e.target.value)}
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                  >
                    {group.members.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-300">Split among:</p>
                    <button type="button" onClick={handleSplitEqually} className="text-xs text-emerald-400 font-bold hover:underline">
                      Split Equally
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.members.map(member => {
                      const isSelected = splits[member._id] !== undefined;
                      return (
                        <div key={member._id} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleMemberSelection(member._id)}
                            className={`flex-1 text-left px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                              isSelected 
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {member.name}
                          </button>
                          {isSelected && (
                            <input 
                              type="number"
                              placeholder="₹"
                              value={splits[member._id]}
                              onChange={e => setSplits({...splits, [member._id]: e.target.value})}
                              className="w-24 bg-[#0a0a0a]/50 border border-white/10 rounded-xl p-2 text-white outline-none focus:border-emerald-500 text-sm"
                              required
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Select involved members, then click "Split Equally" or type exact amounts.
                  </p>
                </div>

                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition">
                  Split & Save Expense
                </button>
              </form>
            )}

            {/* Filters */}
            <div className="mb-6 p-3 bg-[#0a0a0a]/30 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
                  <button 
                    onClick={() => { setFilterType('all'); setSelectedMember(''); }}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 ${filterType === 'all' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    All Time
                  </button>
                  <button 
                    onClick={() => { setFilterType('today'); setSelectedMember(''); }}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 ${filterType === 'today' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => { setFilterType('yesterday'); setSelectedMember(''); }}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 ${filterType === 'yesterday' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    Yesterday
                  </button>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setFilterType('specific_date');
                        setSelectedMember('');
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-medium outline-none transition-all cursor-pointer shrink-0 ${filterType === 'specific_date' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                
                <div className="flex items-center gap-2 shrink-0 min-w-[160px] max-w-xs">
                  <select
                    value={selectedMember}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedMember(e.target.value);
                        setFilterType('member');
                      } else {
                        setSelectedMember('');
                        setFilterType('all');
                      }
                    }}
                    className={`w-full px-4 py-2 rounded-full text-xs font-medium outline-none transition-all cursor-pointer ${filterType === 'member' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    <option value="" className="bg-[#0a0a0a] text-white">Filter by Member (Lifetime Paid)</option>
                    {group.members.map(m => (
                      <option key={m._id} value={m._id} className="bg-[#0a0a0a] text-white">{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Expense Lists */}
            <div className="flex flex-col gap-6">
              {filteredExpenses.length === 0 && (
                <div className="text-center py-8 bg-white/3 rounded-2xl border border-white/5">
                  <p className="text-gray-500 text-sm">
                    {filterType === 'today'         && 'No expenses added today.'}
                    {filterType === 'yesterday'     && 'No expenses added yesterday.'}
                    {filterType === 'specific_date' && `No expenses on ${selectedDate}.`}
                    {filterType === 'member'        && 'No expenses found for this member.'}
                    {filterType === 'all'           && 'No expenses added yet.'}
                  </p>
                </div>
              )}
              
              {pendingExpenses.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3">Pending Action</h3>
                  <div className="flex flex-col gap-3">
                    {renderExpenseList(pendingExpenses)}
                  </div>
                </div>
              )}

              {completedExpenses.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Completed / Settled</h3>
                  <div className="flex flex-col gap-3 opacity-80">
                    {renderExpenseList(completedExpenses)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
