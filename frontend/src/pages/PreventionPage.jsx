import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import { getReturnRisk } from '../services/returnsApi'

const CATEGORIES = [
  { name: 'Electronics',       icon: '💻', color: 'blue' },
  { name: 'Clothing & Apparel',icon: '👕', color: 'purple' },
  { name: 'Home & Kitchen',    icon: '🏠', color: 'green' },
  { name: 'Sports & Outdoors', icon: '⚽', color: 'orange' },
  { name: 'Beauty & Personal Care', icon: '💄', color: 'pink' },
]

function RiskGauge({ pct }) {
  const color = pct >= 30 ? '#EF4444' : pct >= 20 ? '#F59E0B' : '#10B981'
  const strokeDasharray = 2 * Math.PI * 54
  const strokeDashoffset = strokeDasharray * (1 - pct / 100)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="rotate-[-90deg]">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#2E3A52" strokeWidth="12" />
        <motion.circle
          cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: strokeDasharray }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="text-3xl font-black"
          style={{ color }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {pct}%
        </motion.div>
        <p className="text-xs text-slate-400">Return Rate</p>
      </div>
    </div>
  )
}

export default function PreventionPage() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCategorySelect = async (cat) => {
    if (selectedCategory === cat.name) return
    setSelectedCategory(cat.name)
    setRiskData(null)
    setLoading(true)
    try {
      const res = await getReturnRisk(cat.name)
      setRiskData(res.risk_profile)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (pct) =>
    pct >= 30 ? { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' } :
    pct >= 20 ? { label: 'Moderate Risk', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' } :
                { label: 'Low Risk', color: 'text-eco', bg: 'bg-eco/10 border-eco/20' }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="page-container">

        <div className="mb-8">
          <h1 className="section-title">🔮 Predictive Return Prevention</h1>
          <p className="section-subtitle">AI-powered return risk analysis before customers make a purchase</p>
        </div>

        {/* Category selector */}
        <div className="card mb-6">
          <h3 className="text-base font-semibold text-white mb-4">Select a Product Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategorySelect(cat)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                  ${selectedCategory === cat.name
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-border bg-dark-surface hover:border-primary-500/40 hover:bg-dark-hover'}`}
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xs text-center text-slate-300 font-medium leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card text-center py-12">
            <div className="w-10 h-10 border-4 border-ai/30 border-t-ai rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Analyzing return patterns...</p>
          </div>
        )}

        {/* Risk Result */}
        <AnimatePresence>
          {riskData && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Gauge */}
              <div className="card flex flex-col items-center justify-center gap-4">
                <RiskGauge pct={riskData.return_rate_pct} />
                {(() => {
                  const risk = getRiskLevel(riskData.return_rate_pct)
                  return (
                    <div className={`px-4 py-2 rounded-full border ${risk.bg}`}>
                      <span className={`text-sm font-bold ${risk.color}`}>{risk.label}</span>
                    </div>
                  )
                })()}
                <div className="flex items-center gap-1.5 text-center">
                  {'★'.repeat(Math.round(riskData.satisfaction_score)).split('').map((s, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                  <span className="text-slate-400 text-sm ml-1">{riskData.satisfaction_score}/5</span>
                </div>
                <p className="text-xs text-slate-500 text-center">Avg. Customer Satisfaction</p>
              </div>

              {/* Top return reasons */}
              <div className="card">
                <h3 className="text-base font-semibold text-white mb-4">Top Return Reasons</h3>
                <div className="space-y-4">
                  {riskData.top_return_reasons?.map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-300">{r.reason}</span>
                        <span className="font-semibold text-white">{r.pct}%</span>
                      </div>
                      <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary-gradient"
                          initial={{ width: 0 }}
                          animate={{ width: `${r.pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Tip */}
              <div className="card border-eco/20 bg-eco/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🌿</span>
                  <h3 className="text-base font-semibold text-eco">AI Tip to Reduce Returns</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{riskData.ai_tip}</p>

                <div className="mt-5 pt-4 border-t border-dark-border">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">If this item is returned, it could be:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Resold ♻️', 'Refurbished 🔧', 'Donated 💝'].map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-dark-surface border border-dark-border text-xs text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explainer (when nothing selected) */}
        {!selectedCategory && !loading && (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">🔮</div>
            <h3 className="text-xl font-bold text-white mb-2">Select a category above</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Our AI analyzes historical return patterns to predict return likelihood
              and give actionable tips to prevent returns before they happen.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
