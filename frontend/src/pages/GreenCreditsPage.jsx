import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import { getUserCredits, getLeaderboard } from '../services/returnsApi'
import useAuthStore from '../store/authStore'
import { formatDate } from '../utils/formatters'
import { ACTION_ICONS } from '../utils/gradeColors'

function CountUp({ target, duration = 2000 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return <>{count.toLocaleString()}</>
}

export default function GreenCreditsPage() {
  const { user } = useAuthStore()
  const [credits, setCredits] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    Promise.all([getUserCredits(user.uid), getLeaderboard()])
      .then(([c, l]) => { setCredits(c); setLeaderboard(l.leaderboard || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.uid])

  // Compute totals from transactions
  const totalCO2 = credits?.transactions?.reduce((s, t) => s + (t.carbon_saved_kg || 0), 0) || 0
  const totalWaste = credits?.transactions?.reduce((s, t) => s + (t.waste_saved_kg || 0), 0) || 0
  const totalReturns = credits?.transactions?.length || 0

  // Credit tier
  const totalCredits = credits?.total_credits || 0
  const tier = totalCredits >= 500 ? { name: '🏆 Eco Champion', next: null, nextAt: null } :
               totalCredits >= 200 ? { name: '🌿 Green Hero', next: 'Eco Champion', nextAt: 500 } :
               totalCredits >= 50  ? { name: '♻️ Eco Starter', next: 'Green Hero', nextAt: 200 } :
                                     { name: '🌱 Beginner', next: 'Eco Starter', nextAt: 50 }
  const progress = tier.nextAt ? Math.min((totalCredits / tier.nextAt) * 100, 100) : 100

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="page-container">

        <div className="mb-8">
          <h1 className="section-title">🌱 Green Credits</h1>
          <p className="section-subtitle">Your sustainability impact and rewards</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Credit Balance */}
            <motion.div className="card col-span-1 text-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-5xl mb-3">🌱</div>
              <div className="text-6xl font-black text-gradient-eco mb-2 coin-pop">
                <CountUp target={totalCredits} />
              </div>
              <p className="text-lg font-semibold text-white">Green Credits</p>
              <p className="text-sm text-eco mt-1">{tier.name}</p>

              {tier.nextAt && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{totalCredits} credits</span>
                    <span>{tier.nextAt} for {tier.next}</span>
                  </div>
                  <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-eco-gradient"
                      initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }} />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Sustainability Stats */}
            <motion.div className="card col-span-1 lg:col-span-2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-base font-semibold text-white mb-4">Your Sustainability Impact</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: '♻️', label: 'Waste Diverted', value: `${totalWaste.toFixed(1)} kg` },
                  { icon: '🌿', label: 'CO₂ Saved', value: `${totalCO2.toFixed(1)} kg` },
                  { icon: '📦', label: 'Returns Processed', value: totalReturns },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="text-center p-4 rounded-xl bg-eco/10 border border-eco/20">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-xl font-black text-eco">{value}</div>
                    <div className="text-xs text-slate-400 mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Transaction history */}
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Credit History</h4>
              {credits?.transactions?.length === 0 ? (
                <p className="text-slate-500 text-sm">No credits earned yet. Submit a return to earn your first credits!</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {credits?.transactions?.map((t) => (
                    <div key={t.credit_id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{ACTION_ICONS[t.routing_action] || '🌱'}</span>
                        <div>
                          <p className="text-sm text-white font-medium">{t.routing_action || 'Return'}</p>
                          <p className="text-xs text-slate-500">{formatDate(t.created_at)}</p>
                        </div>
                      </div>
                      <span className="text-eco font-bold">+{t.credits_earned}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Leaderboard */}
        <motion.div className="card mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h3 className="text-base font-semibold text-white mb-5">🏆 Eco Leaderboard — Top Contributors</h3>
          {leaderboard.length === 0 ? (
            <p className="text-slate-500 text-sm">Leaderboard loading...</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, i) => (
                <div key={entry.user_id}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-colors
                    ${i === 0 ? 'bg-primary-500/10 border border-primary-500/20' :
                      i === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                      i === 2 ? 'bg-orange-500/10 border border-orange-500/20' :
                               'bg-dark-surface'}`}>
                  <div className="text-xl font-black w-8 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-ai-gradient flex items-center justify-center text-white font-bold text-sm">
                    {entry.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{entry.display_name || 'Anonymous'}</p>
                    <p className="text-xs text-slate-400">{entry.returns_processed || 0} returns</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-eco">{(entry.total_credits || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">credits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
