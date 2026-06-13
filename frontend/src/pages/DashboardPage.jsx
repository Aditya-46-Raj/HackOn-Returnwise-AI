import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { getDashboardStats, listReturns } from '../services/returnsApi'
import { formatCurrency, formatKg, formatDate, timeAgo } from '../utils/formatters'
import { ACTION_CLASSES, ACTION_ICONS, GRADE_CLASSES, GRADE_LABELS } from '../utils/gradeColors'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

const ACTION_CHART_COLORS = {
  Resell: '#3B82F6', Refurbish: '#F59E0B', Donate: '#8B5CF6',
  Recycle: '#6B7280', Restock: '#10B981', Exchange: '#FF9900',
}

function KPICard({ icon, label, value, sub, color = 'primary', delay = 0 }) {
  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full
          ${color === 'eco' ? 'bg-eco/15 text-eco' :
            color === 'ai' ? 'bg-ai/15 text-ai-light' :
            'bg-primary-500/15 text-primary-400'}`}>
          Live
        </span>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-sm font-medium text-slate-300 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </motion.div>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ grade: '', action: '', category: '' })

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      listReturns({ page: 1, limit: 15 }),
    ]).then(([statsRes, returnsRes]) => {
      setStats(statsRes.stats)
      setReturns(returnsRes.returns || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // Chart data
  const pieData = stats
    ? Object.entries(stats.action_distribution || {}).map(([name, value]) => ({ name, value }))
    : []
  const lineData = stats?.weekly_returns || []

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />

      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Operations Dashboard</h1>
            <p className="section-subtitle">Real-time return processing overview</p>
          </div>
          <Link to="/returns/new" className="btn-primary btn-md">
            + New Return
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : (
            <>
              <KPICard icon="📦" label="Total Returns" value={stats?.total_returns?.toLocaleString() || '0'} sub="All time" delay={0} />
              <KPICard icon="💰" label="Value Recovered" value={formatCurrency(stats?.total_value_recovered)} sub="Estimated resale" color="eco" delay={0.1} />
              <KPICard icon="🌿" label="CO₂ Saved" value={formatKg(stats?.total_co2_saved_kg)} sub="Carbon equivalent" color="eco" delay={0.2} />
              <KPICard icon="⭐" label="Green Credits" value={(stats?.total_credits_issued || 0).toLocaleString()} sub="Credits issued" color="ai" delay={0.3} />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Donut Chart */}
          <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h3 className="text-base font-semibold text-white mb-4">Action Distribution</h3>
            {loading ? <Skeleton className="h-48 rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={ACTION_CHART_COLORS[entry.name] || '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#232B3E', border: '1px solid #2E3A52', borderRadius: '8px', color: '#F1F5F9' }}
                    formatter={(val, name) => [val, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              {pieData.map(({ name, value }) => (
                <div key={name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: ACTION_CHART_COLORS[name] }} />
                  <span className="text-xs text-slate-400">{name} ({value})</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Line Chart */}
          <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h3 className="text-base font-semibold text-white mb-4">Returns This Week</h3>
            {loading ? <Skeleton className="h-48 rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E3A52" />
                  <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#232B3E', border: '1px solid #2E3A52', borderRadius: '8px', color: '#F1F5F9' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#FF9900" strokeWidth={2.5}
                    dot={{ fill: '#FF9900', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#FF9900' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Returns Table */}
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h3 className="text-base font-semibold text-white">Recent Returns</h3>
            {/* Filters */}
            <div className="flex gap-2">
              <select className="form-select text-sm py-1.5 w-36"
                value={filter.grade} onChange={e => setFilter(f => ({ ...f, grade: e.target.value }))}>
                <option value="">All Grades</option>
                {['A', 'B', 'C', 'D'].map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
              <select className="form-select text-sm py-1.5 w-36"
                value={filter.action} onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}>
                <option value="">All Actions</option>
                {['Restock','Resell','Refurbish','Donate','Recycle','Exchange'].map(a =>
                  <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-slate-400">No returns yet.</p>
              <Link to="/returns/new" className="btn-primary btn-sm mt-4 inline-flex">
                Submit First Return
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    {['Product', 'Category', 'Grade', 'Action', 'Value', 'Date', ''].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {returns.map((ret) => (
                    <tr key={ret.return_id} className="hover:bg-dark-hover transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white truncate max-w-[160px]">{ret.product_name}</div>
                        <div className="text-xs text-slate-500">{ret.brand || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{ret.category}</td>
                      <td className="px-6 py-4">
                        {ret.condition_grade ? (
                          <span className={GRADE_CLASSES[ret.condition_grade]}>
                            {ret.condition_grade} — {GRADE_LABELS[ret.condition_grade]}
                          </span>
                        ) : <span className="text-slate-600 text-xs">Pending</span>}
                      </td>
                      <td className="px-6 py-4">
                        {ret.recommended_action ? (
                          <span className={ACTION_CLASSES[ret.recommended_action]}>
                            {ACTION_ICONS[ret.recommended_action]} {ret.recommended_action}
                          </span>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                        {formatCurrency(ret.original_price)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                        {timeAgo(ret.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/returns/${ret.return_id}`}
                          className="text-xs text-primary-500 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
