import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp, AlertTriangle, ShieldCheck, X } from 'lucide-react';

const BudgetTracker = ({ open, onClose }) => {
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/budget/status');
      setBudgetStatus(res.data);
      if (res.data.totalBudget) {
        setBudgetInput(res.data.totalBudget.toString());
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBudget();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetInput || isNaN(budgetInput) || Number(budgetInput) < 0) return;
    
    setIsSubmitting(true);
    try {
      await axios.post('/api/budget', { amount: Number(budgetInput) });
      await fetchBudget();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete('/api/budget');
      await fetchBudget();
      setBudgetInput('');
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = endOfMonth.getDate() - now.getDate() + 1;

  let content;

  if (loading || !budgetStatus) {
    content = (
      <div className="flex flex-col items-center justify-center h-full animate-pulse gap-4">
        <div className="w-32 h-32 rounded-full border-4 border-white/10 border-t-emerald-500 animate-spin"></div>
        <p className="text-gray-400">Loading budget...</p>
      </div>
    );
  } else {
    const { totalBudget, totalSpent, remainingBudget, percentageUsed } = budgetStatus;
    
    if (totalBudget === null) {
      content = (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <Target size={40} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No budget set</h3>
          <p className="text-gray-400 mb-8 text-sm">Set a monthly spending limit to track your progress and manage your finances better.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Set Monthly Budget
          </button>
        </div>
      );
    } else {
      const dailySafeSpend = remainingBudget > 0 ? (remainingBudget / daysLeft).toFixed(0) : 0;
      let strokeColor = '#34d399'; // emerald-400
      let bgColor = 'bg-emerald-500/20';
      let icon = <ShieldCheck size={24} className="text-emerald-400" />;
      
      if (percentageUsed >= 90) {
        strokeColor = '#fb7185'; // rose-400
        bgColor = 'bg-rose-500/20';
        icon = <AlertTriangle size={24} className="text-rose-400" />;
      } else if (percentageUsed >= 70) {
        strokeColor = '#fbbf24'; // amber-400
        bgColor = 'bg-amber-500/20';
        icon = <TrendingUp size={24} className="text-amber-400" />;
      }

      // SVG Circular Progress Calculations
      const radius = 70;
      const stroke = 12;
      const normalizedRadius = radius - stroke * 2;
      const circumference = normalizedRadius * 2 * Math.PI;
      const strokeDashoffset = circumference - (Math.min(percentageUsed, 100) / 100) * circumference;

      content = (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Circular Progress */}
            <div className="flex justify-center items-center py-6 relative">
              <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${bgColor} w-48 h-48 mx-auto top-4`}></div>
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg height="176" width="176" className="absolute -rotate-90">
                  <circle
                    stroke="rgba(255,255,255,0.05)"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius - 8}
                    cx="88"
                    cy="88"
                  />
                  <circle
                    stroke={strokeColor}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
                    strokeLinecap="round"
                    r={normalizedRadius - 8}
                    cx="88"
                    cy="88"
                  />
                </svg>
                <div className="text-center absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">&#8377;{totalSpent.toFixed(0)}</span>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">Spent</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-3xl p-4 border border-white/5 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-400">Total Limit</span>
                <span className="text-base font-bold text-white">&#8377;{totalBudget}</span>
              </div>
              <div className="w-full h-[1px] bg-white/5 mb-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-400">Percentage Used</span>
                <span className="text-base font-bold" style={{ color: strokeColor }}>{percentageUsed.toFixed(1)}%</span>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center gap-2">
                <div className={`p-2 rounded-xl ${bgColor}`}>
                  {icon}
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Remaining</p>
                  <p className="text-lg font-bold" style={{ color: strokeColor }}>&#8377;{remainingBudget.toFixed(0)}</p>
                </div>
              </div>
              <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20">
                  <TrendingUp size={24} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Safe to spend</p>
                  <p className="text-lg font-bold text-blue-400">&#8377;{dailySafeSpend} <span className="text-xs text-blue-400/70 font-normal">/ day</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky edit button - always visible */}
          <div className="px-4 pt-3 pb-6 border-t border-white/5 bg-[#111214]">
            <button 
              onClick={() => setShowModal(true)}
              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold py-4 rounded-2xl border border-emerald-500/30 transition-colors text-base tracking-wide"
            >
              ✎ Edit Budget Limit
            </button>
          </div>
        </>
      );
    }

  return (
    <>
      <div 
        onClick={onClose} 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      />
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#111214] border border-white/10 rounded-t-[32px] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-white/15" />
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/15 rounded-xl p-2.5">
              <Target size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="m-0 text-base font-extrabold text-gray-100">Monthly Budget</h2>
              <p className="m-0 text-[11px] text-gray-400 tracking-wide">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="bg-white/5 hover:bg-white/10 border-none rounded-xl p-2 cursor-pointer text-gray-400 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </div>

      {/* Set Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="text-emerald-400" size={20} /> 
                {budgetStatus?.totalBudget ? 'Edit Budget' : 'Set Budget'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-zinc-400 hover:text-white p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveBudget} className="p-5">
              <label className="text-xs text-gray-400 mb-2 block font-semibold">Maximum Spend Limit (₹)</label>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input 
                  type="number" 
                  autoFocus
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-black/50 border border-zinc-700 rounded-2xl py-4 pl-10 pr-4 text-white text-xl font-bold outline-none focus:border-emerald-500 transition shadow-inner"
                  required
                />
              </div>

              <div className="flex gap-3">
                {budgetStatus?.totalBudget && (
                  <button
                    type="button"
                    onClick={handleDeleteBudget}
                    disabled={isSubmitting}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-rose-400 font-bold py-3 rounded-xl transition"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !budgetInput}
                  className="flex-[2] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {isSubmitting ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetTracker;
