import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PayNowButton from './PayNowButton';
import BudgetTracker from './BudgetTracker';
import { useAuth } from '../context/AuthContext';
import { Users, LogOut, Wallet, UserCircle2, BarChart2, HandCoins, X, LayoutDashboard, Target } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const InsightsDrawer = ({ insights, open, onClose }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) { setTimeout(() => setSelectedGroupId(null), 300); }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const hasAny = insights.some(g => g.members?.length > 0);

  const renderGroupList = () => {
    if (!hasAny) {
      return (
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:'48px 20px',color:'#4b5563' }}>
          <HandCoins size={36} style={{ opacity:0.3 }} />
          <p style={{ margin:0,fontSize:14 }}>You haven't paid for anyone yet.</p>
        </div>
      );
    }
    return (
      <div style={{ padding:'0 20px',display:'flex',flexDirection:'column',gap:12 }}>
        {insights.map((group) => {
          const groupTotal = group.members.reduce((sum, m) => sum + m.totalPaid, 0);
          return (
            <div key={group.groupId} onClick={() => setSelectedGroupId(group.groupId)}
              style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',borderRadius:'16px',background:'rgba(255,255,255,0.03)',cursor:'pointer',border:'1px solid rgba(255,255,255,0.05)',transition:'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
            >
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#f472b6,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:'white' }}>
                  {group.groupName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin:0,fontWeight:700,fontSize:15,color:'#f1f5f9' }}>{group.groupName}</p>
                  <p style={{ margin:0,fontSize:12,color:'#6b7280' }}>{group.members.length} members</p>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ margin:0,fontWeight:800,fontSize:16,color:'#f472b6' }}>&#8377;{groupTotal.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMemberList = () => {
    const group = insights.find(g => g.groupId === selectedGroupId);
    if (!group) return null;
    const globalMax = group.members?.[0]?.totalPaid ?? 0;
    return (
      <div>
        <div style={{ padding:'0 20px 12px',display:'flex',alignItems:'center',gap:8 }}>
          <button onClick={() => setSelectedGroupId(null)} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,padding:'4px 8px',cursor:'pointer',color:'#f1f5f9',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:4 }}>
            &#8592; Back
          </button>
          <span style={{ fontSize:14,fontWeight:700,color:'#9ca3af' }}>{group.groupName}</span>
        </div>
        {group.members.map((member, index) => {
          const pct = globalMax > 0 ? (member.totalPaid / globalMax) * 100 : 0;
          return (
            <div key={member.userId} style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:11,color:'#374151',fontWeight:700,width:18,textAlign:'center',flexShrink:0 }}>#{index+1}</span>
              <div style={{ flexShrink:0,width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#f472b6,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,color:'white' }}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ margin:'0 0 5px',fontWeight:700,fontSize:14,color:'#f1f5f9' }}>{member.name}</p>
                <div style={{ height:4,borderRadius:2,background:'rgba(255,255,255,0.07)',overflow:'hidden' }}>
                  <div style={{ height:'100%',borderRadius:2,width:`${pct}%`,background:'linear-gradient(90deg,#f472b6,#a78bfa)',transition:'width 0.5s ease' }} />
                </div>
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <p style={{ margin:0,fontWeight:800,fontSize:15,color:'#f472b6' }}>&#8377;{member.totalPaid.toFixed(2)}</p>
                <p style={{ margin:0,fontSize:10,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.06em' }}>total paid</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:40,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',transition:'opacity 0.3s',opacity:open?1:0,pointerEvents:open?'auto':'none' }} />
      <div style={{ position:'fixed',bottom:0,left:0,right:0,zIndex:50,background:'#111214',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'28px 28px 0 0',transition:'transform 0.35s cubic-bezier(0.32,0.72,0,1)',transform:open?'translateY(0)':'translateY(100%)',height:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex',justifyContent:'center',padding:'12px 0 4px' }}>
          <div style={{ width:40,height:4,borderRadius:2,background:'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 20px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ background:'rgba(244,114,182,0.15)',borderRadius:10,padding:8,display:'flex' }}>
              <HandCoins size={18} style={{ color:'#f472b6' }} />
            </div>
            <div>
              <h2 style={{ margin:0,fontSize:16,fontWeight:800,color:'#f1f5f9' }}>Where My Money Goes</h2>
              <p style={{ margin:0,fontSize:11,color:'#6b7280' }}>Lifetime total paid for each member</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'none',borderRadius:8,padding:6,cursor:'pointer',color:'#9ca3af',display:'flex' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY:'auto',flex:1,paddingBottom:24 }}>
          {selectedGroupId ? renderMemberList() : renderGroupList()}
        </div>
      </div>
    </>
  );
};

const Dashboard = () => {
  const [balances, setBalances]         = useState([]);
  const [insights, setInsights]         = useState([]);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMsg, setToastMsg] = useState('');

  const fetchBalances = async () => {
    try { const res = await axios.get('/api/dashboard'); setBalances(res.data); }
    catch (error) { console.error(error); }
  };
  const fetchInsights = async () => {
    try { const res = await axios.get('/api/dashboard/insights'); setInsights(res.data); }
    catch (error) { console.error(error); }
  };
  
  useEffect(() => { 
    fetchBalances(); 
    fetchInsights(); 
    
    // Check for success messages from redirects (e.g., profile update)
    if (location.state?.message) {
      setToastMsg(location.state.message);
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
      // Auto-hide toast after 3 seconds
      setTimeout(() => setToastMsg(''), 3000);
    }
  }, [location]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const totalOwe  = balances.filter(b => !b.isOwedToMe).reduce((acc, curr) => acc + curr.amount, 0);
  const totalOwed = balances.filter(b =>  b.isOwedToMe).reduce((acc, curr) => acc + curr.amount, 0);
  const oweBalances = balances.filter(b => !b.isOwedToMe);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/profile', icon: UserCircle2, label: 'Profile' },
  ];

  const mobileNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    { action: () => setBudgetOpen(true), icon: Target, label: 'Budget', color: 'text-emerald-400' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/profile', icon: UserCircle2, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20 md:pb-0">

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center gap-2 text-sm font-semibold border border-emerald-400/30">
            <CheckCircle2 size={16} />
            {toastMsg}
          </div>
        </div>
      )}

      {/* Settle Balance Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="text-rose-500" size={20} /> Settle Balances
              </h2>
              <button onClick={() => setShowSettleModal(false)} className="text-zinc-400 hover:text-white p-1.5 bg-white/5 rounded-full hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              {oweBalances.map(balance => (
                <div key={balance.otherUser._id} className="p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-950/60 border border-white/5 hover:border-rose-500/30 transition-colors">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-rose-500/10 text-rose-400 ring-2 ring-rose-500/20">
                      {balance.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-gray-100">{balance.otherUser.name}</span>
                      <span className="text-[10px] text-zinc-500">{balance.otherUser.upiId || 'No UPI ID'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right flex flex-col justify-center">
                      <span className="text-base font-black leading-tight text-rose-400">&#8377;{balance.amount}</span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">You Owe</span>
                    </div>
                    {balance.otherUser.upiId && (
                      <PayNowButton payeeName={balance.otherUser.name} payeeUpiId={balance.otherUser.upiId} amount={balance.amount} payeeId={balance.otherUser._id} onPaymentComplete={fetchBalances} />
                    )}
                  </div>
                </div>
              ))}
              {oweBalances.length === 0 && (
                <div className="text-center py-8 text-zinc-500 bg-zinc-950/40 rounded-2xl text-sm border border-zinc-800">You're all settled up!</div>
              )}
            </div>
          </div>
        </div>
      )}

      <InsightsDrawer insights={insights} open={insightsOpen} onClose={() => setInsightsOpen(false)} />
      <BudgetTracker open={budgetOpen} onClose={() => setBudgetOpen(false)} />

      {/* Header */}
      <header className="flex justify-between items-center glass-panel p-4 rounded-2xl mx-4 mt-4 mb-6 md:mx-8 md:mt-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-full">
            <Wallet className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">HostelSplit</h1>
            <p className="text-xs text-gray-400">Hi, {user?.name}</p>
          </div>
        </div>
        {/* Desktop nav - all icons */}
        <div className="hidden md:flex gap-4">
          <Link to="/profile" className="p-2 hover:bg-white/10 rounded-full transition" title="Profile"><UserCircle2 size={20} /></Link>
          <Link to="/analytics" className="p-2 hover:bg-white/10 rounded-full transition text-emerald-400" title="Analytics"><BarChart2 size={20} /></Link>
          <button onClick={() => setBudgetOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition text-emerald-400" title="Monthly Budget"><Target size={20} /></button>
          <button onClick={() => setInsightsOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition" style={{ color:'#f472b6' }} title="Where My Money Goes"><HandCoins size={20} /></button>
          <Link to="/groups" className="p-2 hover:bg-white/10 rounded-full transition" title="Groups"><Users size={20} /></Link>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full text-red-400 transition" title="Logout"><LogOut size={20} /></button>
        </div>
        {/* Mobile nav - insights + logout only */}
        <div className="flex md:hidden items-center gap-1">
          <button onClick={() => setInsightsOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition" style={{ color:'#f472b6' }}><HandCoins size={20} /></button>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full text-red-400 transition"><LogOut size={20} /></button>
        </div>
      </header>

      {/* Main content */}
      <div className="px-4 md:px-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
          <div className="glass-panel p-4 md:p-5 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <p className="text-xs text-gray-400 mb-1">You Owe</p>
            <p className="text-xl md:text-3xl font-bold text-red-400">&#8377;{totalOwe}</p>
          </div>
          <div className="glass-panel p-4 md:p-5 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <p className="text-xs text-gray-400 mb-1">You are Owed</p>
            <p className="text-xl md:text-3xl font-bold text-emerald-400">&#8377;{totalOwed}</p>
          </div>
        </div>

        {/* Debt Overview */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 text-gray-300">Debt Overview</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* People who owe you */}
            <div className="p-4 rounded-3xl bg-zinc-900/40 border border-zinc-800 border-t-[3px] border-t-emerald-500 shadow-[0_-4px_20px_-5px_rgba(16,185,129,0.15)] flex flex-col">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-4 font-semibold px-1">People who owe you</h3>
              <div className="flex flex-col gap-3">
                {balances.filter(b => b.isOwedToMe).length > 0 ? (
                  balances.filter(b => b.isOwedToMe).map(b => (
                    <div key={b.otherUser._id} className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/20 flex items-center justify-center font-bold text-sm flex-shrink-0">{b.otherUser.name.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{b.otherUser.name}</p>
                          <p className="text-[10px] text-zinc-500">Owes you</p>
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 flex-shrink-0">
                        <span className="text-emerald-400 font-black text-sm">&#8377;{b.amount}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-24 bg-zinc-950/40 border border-zinc-800 rounded-2xl">
                    <span className="text-xs text-zinc-500 font-medium">No one owes you money</span>
                  </div>
                )}
              </div>
            </div>

            {/* People you owe */}
            <div className="p-4 rounded-3xl bg-zinc-900/40 border border-zinc-800 border-t-[3px] border-t-rose-500 shadow-[0_-4px_20px_-5px_rgba(244,63,94,0.15)] flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">People you owe</h3>
                {oweBalances.length > 0 && (
                  <button onClick={() => setShowSettleModal(true)} className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] uppercase tracking-wider font-bold py-1 px-3 rounded-full transition-colors shadow-[0_0_12px_rgba(244,63,94,0.4)] flex items-center gap-1.5">
                    <Wallet size={12} /> Settle Balance
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {balances.filter(b => !b.isOwedToMe).length > 0 ? (
                  balances.filter(b => !b.isOwedToMe).map(b => (
                    <div key={b.otherUser._id} className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-400 ring-2 ring-rose-500/20 flex items-center justify-center font-bold text-sm flex-shrink-0">{b.otherUser.name.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{b.otherUser.name}</p>
                          <p className="text-[10px] text-zinc-500">You owe</p>
                        </div>
                      </div>
                      <div className="bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20 flex-shrink-0">
                        <span className="text-rose-400 font-black text-sm">&#8377;{b.amount}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-24 bg-zinc-950/40 border border-zinc-800 rounded-2xl">
                    <span className="text-xs text-zinc-500 font-medium">You're all caught up</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Nav - mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 h-16">
        <div className="flex justify-around items-center h-full px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            if (item.action) {
              return (
                <button key={item.label} onClick={item.action} className={`flex flex-col items-center gap-0.5 transition-colors ${item.color || 'text-gray-500 hover:text-gray-300'}`}>
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <Icon size={22} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;