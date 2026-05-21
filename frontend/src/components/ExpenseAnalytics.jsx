import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
  PieChart, Pie,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, TrendingUp, Calendar, Zap, IndianRupee } from 'lucide-react';
import HomeButton from './HomeButton';

// ────────────────────────────────────────────────────────────
// Colour palette — consistent with the emerald/cyan brand
// ────────────────────────────────────────────────────────────
const PALETTE = [
  '#34d399', // emerald-400
  '#22d3ee', // cyan-400
  '#a78bfa', // violet-400
  '#fb923c', // orange-400
  '#f472b6', // pink-400
  '#facc15', // yellow-400
  '#60a5fa', // blue-400
  '#4ade80', // green-400
  '#f87171', // red-400
  '#e879f9', // fuchsia-400
  '#2dd4bf', // teal-400
  '#fbbf24', // amber-400
];

const TODAY_COLOR  = '#34d399';
const NORMAL_COLOR = 'rgba(52,211,153,0.35)';
const WEEKEND_COLOR = 'rgba(139,92,246,0.55)'; // weekends (Sat, Sun)

// ────────────────────────────────────────────────────────────
// Shared tooltip component
// ────────────────────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(15,15,20,0.92)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12,
      padding: '10px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontSize: 13,
    }}>
      <p style={{ color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#34d399', margin: '2px 0', fontWeight: 700 }}>
          ₹{Number(p.value).toFixed(2)}
          {p.name === 'cumulative' && <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>running total</span>}
        </p>
      ))}
    </div>
  );
};

// Donut custom label
const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
      {name}
    </text>
  );
};

// ────────────────────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div
    className="flex flex-col items-center justify-between p-3 min-h-[90px] text-center w-full min-w-0"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
    }}
  >
    <div className="flex flex-col xs:flex-row items-center gap-1 mb-2">
      <div style={{ background: `${color}22`, borderRadius: 8, padding: 6, display: 'flex' }}>
        <Icon size={14} style={{ color }} />
      </div>
      <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-tight leading-tight max-w-full text-center balance-text">
        {label}
      </span>
    </div>
    <span
      className="text-sm sm:text-base font-bold mt-1 block truncate"
      style={{ color }}
    >
      {value}
    </span>
  </div>
);

// ────────────────────────────────────────────────────────────
// Tab button
// ────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '9px 18px',
      borderRadius: 12,
      border: 'none',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: 13,
      transition: 'all 0.2s',
      background: active ? 'linear-gradient(135deg, rgba(52,211,153,0.25), rgba(34,211,238,0.15))' : 'transparent',
      color: active ? '#34d399' : '#6b7280',
      boxShadow: active ? '0 0 0 1px rgba(52,211,153,0.4) inset' : 'none',
    }}
  >
    <Icon size={15} />
    {label}
  </button>
);

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
const ExpenseAnalytics = () => {
  const [view, setView] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async (v) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/dashboard/analytics?view=${v}`);
      setData(res.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(view);
  }, [view, fetchData]);

  const switchView = (v) => {
    setView(v);
  };

  // ── Derived stats display helpers
  const statsRow = () => {
    if (!data) return null;
    if (data.view === 'daily') {
      return (
        <div className="grid grid-cols-3 gap-2.5 w-full px-1 mb-6">
          <StatCard icon={IndianRupee} label="This Week" value={`₹${data.total}`} color="#34d399" />
          <StatCard icon={TrendingUp}  label="Daily Avg"  value={`₹${data.avg}`}   color="#22d3ee" />
          <StatCard icon={Zap}         label="Peak Day"   value={data.peak || '—'}  color="#a78bfa" />
        </div>
      );
    }
    if (data.view === 'monthly') {
      return (
        <div className="grid grid-cols-3 gap-2.5 w-full px-1 mb-6">
          <StatCard icon={IndianRupee} label="This Month" value={`₹${data.total}`}       color="#34d399" />
          <StatCard icon={TrendingUp}  label="Daily Avg"  value={`₹${data.avg}`}          color="#22d3ee" />
          <StatCard icon={Zap}         label="Peak Day"   value={`Day ${data.peakDay || '—'}`} color="#fb923c" />
        </div>
      );
    }
    if (data.view === 'yearly') {
      return (
        <div className="grid grid-cols-3 gap-2.5 w-full px-1 mb-6">
          <StatCard icon={IndianRupee} label="This Year"  value={`₹${data.total}`}       color="#34d399" />
          <StatCard icon={TrendingUp}  label="Monthly Avg" value={`₹${data.avg}`}        color="#22d3ee" />
          <StatCard icon={Zap}         label="Peak Month" value={data.peakMonth || '—'} color="#f472b6" />
        </div>
      );
    }
    return null;
  };

  // ── Chart renderers
  const renderChart = () => {
    if (loading) {
      return (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: 14 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(52,211,153,0.3)', borderTopColor: '#34d399', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            Loading analytics…
          </div>
        </div>
      );
    }

    if (!data || !data.data || data.data.every(d => d.amount === 0)) {
      return (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#4b5563' }}>
          <BarChart2 size={40} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No spending data for this period yet.</p>
          <p style={{ fontSize: 12, color: '#374151' }}>Add some expenses in your groups to see your trends here.</p>
        </div>
      );
    }

    // ── DAILY / WEEKLY — 7-day Bar Chart
    if (data.view === 'daily') {
      return (
        <>
          <h3 style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Current Week — Daily Spend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barCategoryGap="30%">
              <defs>
                <linearGradient id="barGradToday" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="barGradWeekend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="barGradNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {data.data.map((entry, index) => {
                  const isWeekend = entry.label === 'Sat' || entry.label === 'Sun';
                  const fill = entry.isToday
                    ? 'url(#barGradToday)'
                    : isWeekend
                    ? 'url(#barGradWeekend)'
                    : 'url(#barGradNormal)';
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#4b5563' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#34d399', display: 'inline-block' }} /> Today
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#a78bfa', display: 'inline-block' }} /> Weekend
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(52,211,153,0.4)', display: 'inline-block' }} /> Weekday
            </span>
          </div>
        </>
      );
    }

    // ── MONTHLY — Area / Line Chart
    if (data.view === 'monthly') {
      // Only label a tick every 5 days
      const tickFormatter = (v) => (v % 5 === 1 || v === 1 ? `${v}` : '');
      return (
        <>
          <h3 style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()} — Daily + Running Total
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tickFormatter={tickFormatter} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<GlassTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>
                    {value === 'amount' ? 'Daily Spend' : 'Running Total'}
                  </span>
                )}
              />
              <Area type="monotone" dataKey="amount"     stroke="#34d399" strokeWidth={2} fill="url(#gradAmount)"     dot={false} />
              <Area type="monotone" dataKey="cumulative" stroke="#22d3ee" strokeWidth={2} fill="url(#gradCumulative)" dot={false} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </>
      );
    }

    // ── YEARLY — Donut + Monthly Bar Chart
    if (data.view === 'yearly') {
      // Filter out zero months for donut
      const nonZero = data.data.filter(d => d.amount > 0);

      return (
        <>
          {/* Donut */}
          <h3 style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {new Date().getFullYear()} — Month-by-Month Breakdown
          </h3>

          {nonZero.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={nonZero}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    paddingAngle={3}
                    labelLine={false}
                    label={renderDonutLabel}
                  >
                    {nonZero.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`₹${val}`, 'Spent']}
                    contentStyle={{
                      background: 'rgba(15,15,20,0.92)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: '#d1d5db',
                      fontSize: 13,
                    }}
                  />
                  {/* Centre label */}
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-10" style={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}>Total</tspan>
                    <tspan x="50%" dy="22" style={{ fill: '#34d399', fontSize: 20, fontWeight: 800 }}>₹{data.total}</tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: '#4b5563', textAlign: 'center', marginBottom: 12 }}>No data yet for this year.</p>
          )}

          {/* Month-over-Month Bar Chart */}
          <h3 style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, margin: '16px 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Month-over-Month Comparison
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.data} margin={{ top: 4, right: 10, left: -10, bottom: 0 }} barCategoryGap="35%">
              <defs>
                {data.data.map((_, i) => (
                  <linearGradient key={i} id={`yrBar${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.2} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {data.data.map((_, i) => (
                  <Cell key={i} fill={`url(#yrBar${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      );
    }

    return null;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: 'white',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '16px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .analytics-card { animation: fadeIn 0.35s ease both; }
      `}</style>

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 24,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '14px 18px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 8, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#34d399'}
          onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(52,211,153,0.15)', borderRadius: 10, padding: 8 }}>
            <BarChart2 size={20} style={{ color: '#34d399' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, background: 'linear-gradient(135deg,#34d399,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Spending Analytics
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>Your personal expense trends</p>
          </div>
        </div>
      </header>

      {/* View Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '6px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        marginBottom: 24,
      }}>
        <Tab active={view === 'daily'}   onClick={() => switchView('daily')}   icon={BarChart2}   label="Daily / Weekly" />
        <Tab active={view === 'monthly'} onClick={() => switchView('monthly')} icon={TrendingUp}   label="Monthly" />
        <Tab active={view === 'yearly'}  onClick={() => switchView('yearly')}  icon={Calendar}     label="Yearly" />
      </div>

      {/* Stats Row */}
      <div className="analytics-card" key={`stats-${view}`}>
        {statsRow()}
      </div>

      {/* Chart Card */}
      <div
        className="analytics-card"
        key={`chart-${view}`}
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '20px 16px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.37)',
        }}
      >
        {renderChart()}
      </div>

      {/* Footer hint */}
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#374151' }}>
        Showing your personal share of all group expenses
      </p>
      <HomeButton />
    </div>
  );
};

export default ExpenseAnalytics;
