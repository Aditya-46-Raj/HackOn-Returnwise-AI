import React, { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import { analyzeReturn, getListings } from '../services/returnsApi'
import { GRADE_CLASSES, GRADE_LABELS, GRADE_ICONS, ACTION_CLASSES, ACTION_ICONS } from '../utils/gradeColors'
import { formatCurrency, formatKg } from '../utils/formatters'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const AI_STEPS = [
  'Downloading product images...',
  'Running Gemini Vision analysis...',
  'Assessing condition grade...',
  'Calculating routing recommendation...',
  'Estimating recovery value...',
  'Computing sustainability impact...',
  'Awarding green credits...',
]

function AnalysisLoader() {
  const [stepIdx, setStepIdx] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, AI_STEPS.length - 1))
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center py-16 gap-6">
      {/* Animated AI orb */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-ai-gradient opacity-20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-ai-gradient opacity-40 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-ai-gradient flex items-center justify-center">
          <span className="text-2xl">🤖</span>
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-bold text-white">Gemini Vision Analyzing...</p>
        <motion.p
          key={stepIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-slate-400 text-sm"
        >
          {AI_STEPS[stepIdx]}
        </motion.p>
      </div>
      {/* Progress dots */}
      <div className="flex gap-2">
        {AI_STEPS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300
            ${i <= stepIdx ? 'bg-ai' : 'bg-dark-border'}`} />
        ))}
      </div>
    </div>
  )
}

function GradeRevealCard({ grade, score, defects }) {
  const gradeColors = { A: 'eco', B: 'blue', C: 'warning', D: 'danger' }
  const glowClasses = { A: 'glow-eco', B: '', C: '', D: '' }

  return (
    <motion.div
      className="text-center py-8"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
    >
      <div className={`inline-flex flex-col items-center gap-3 p-8 rounded-2xl border-2
        ${grade === 'A' ? 'border-grade-a/40 bg-grade-a/10' :
          grade === 'B' ? 'border-grade-b/40 bg-grade-b/10' :
          grade === 'C' ? 'border-grade-c/40 bg-grade-c/10' :
                          'border-grade-d/40 bg-grade-d/10'}`}>
        <div className="text-6xl grade-reveal">{GRADE_ICONS[grade]}</div>
        <div>
          <span className={`text-7xl font-black ${
            grade === 'A' ? 'text-grade-a' : grade === 'B' ? 'text-grade-b' :
            grade === 'C' ? 'text-grade-c' : 'text-grade-d'
          }`}>{grade}</span>
        </div>
        <p className="text-xl font-bold text-white">{GRADE_LABELS[grade]}</p>
        <p className="text-sm text-slate-400">Condition Score: <strong className="text-white">{score}/100</strong></p>
      </div>

      {defects.length > 0 && (
        <div className="mt-6 text-left max-w-md mx-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detected Issues</p>
          <ul className="space-y-1.5">
            {defects.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-yellow-500 mt-0.5">⚠</span> {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

function ConfidenceBar({ confidence }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
        <span>AI Confidence</span>
        <span className="font-semibold text-white">{confidence}%</span>
      </div>
      <div className="h-2 bg-dark-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-ai-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
        />
      </div>
    </div>
  )
}

function SustainabilityCard({ wasteSaved, carbonSaved, credits }) {
  return (
    <motion.div
      className="grid grid-cols-3 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      {[
        { icon: '♻️', label: 'Waste Diverted', value: formatKg(wasteSaved), color: 'eco' },
        { icon: '🌿', label: 'CO₂ Saved', value: formatKg(carbonSaved), color: 'eco' },
        { icon: '⭐', label: 'Credits Earned', value: `+${credits}`, color: 'primary' },
      ].map(({ icon, label, value, color }) => (
        <div key={label} className={`text-center p-4 rounded-xl border
          ${color === 'eco' ? 'bg-eco/10 border-eco/20' : 'bg-primary-500/10 border-primary-500/20'}`}>
          <div className="text-2xl mb-1">{icon}</div>
          <div className={`text-lg font-black ${color === 'eco' ? 'text-eco' : 'text-primary-500'}`}>
            {value}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        </div>
      ))}
    </motion.div>
  )
}

export default function AnalysisResultPage() {
  const { returnId } = useParams()
  const { state } = useLocation()
  const { user } = useAuthStore()

  const [analyzing, setAnalyzing] = useState(true)
  const [result, setResult] = useState(null)
  const [listings, setListings] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!state?.returnId) return

    const runAnalysis = async () => {
      try {
        const res = await analyzeReturn({
          return_id:       state.returnId,
          image_urls:      state.imageUrls || [],
          product_name:    state.productName,
          category:        state.category,
          return_reason:   state.returnReason,
          condition_notes: state.conditionNotes,
          original_price:  state.originalPrice,
        })
        setResult(res.result)

        // Fetch refurbished recommendations
        const listRes = await getListings({ category: state.category })
        setListings((listRes.listings || []).slice(0, 3))
      } catch (err) {
        setError(err.message)
        toast.error('Analysis failed: ' + err.message)
      } finally {
        setAnalyzing(false)
      }
    }

    runAnalysis()
  }, [state])

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="page-container max-w-4xl mx-auto">

        <div className="mb-6">
          <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="section-title mt-2">🤖 AI Analysis Result</h1>
          <p className="section-subtitle">Powered by Google Gemini Vision</p>
        </div>

        {analyzing && (
          <div className="card">
            <AnalysisLoader />
          </div>
        )}

        {error && (
          <div className="card border-red-500/30 bg-red-500/5">
            <p className="text-red-400 font-semibold">Analysis failed</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
            <Link to="/returns/new" className="btn-secondary btn-sm mt-4 inline-flex">
              Try Again
            </Link>
          </div>
        )}

        {result && !analyzing && (
          <div className="space-y-6">
            {/* Grade Reveal */}
            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GradeRevealCard
                grade={result.grade}
                score={result.condition_score}
                defects={result.detected_defects || []}
              />
            </motion.div>

            {/* Routing Recommendation */}
            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="flex items-start gap-4 mb-5">
                <div className="text-3xl">{ACTION_ICONS[result.recommended_action]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-white">Recommendation: {result.recommended_action}</h2>
                    <span className={ACTION_CLASSES[result.recommended_action]}>
                      {result.recommended_action}
                    </span>
                    {!result.ai_powered && (
                      <span className="badge bg-slate-700/50 text-slate-400 border-slate-600">Rule-based</span>
                    )}
                    {result.ai_powered && (
                      <span className="badge bg-ai/20 text-ai-light border-ai/30">✨ Gemini AI</span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm mt-3 leading-relaxed">{result.routing_reason}</p>
                </div>
              </div>
              <ConfidenceBar confidence={result.confidence} />
            </motion.div>

            {/* Value Estimates */}
            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <h3 className="text-base font-semibold text-white mb-4">💰 Recovery Estimates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-dark-surface">
                  <p className="text-xs text-slate-400">Estimated Resale Value</p>
                  <p className="text-2xl font-black text-eco mt-1">{formatCurrency(result.estimated_resale_value)}</p>
                </div>
                <div className="p-4 rounded-xl bg-dark-surface">
                  <p className="text-xs text-slate-400">Est. Refurbishment Cost</p>
                  <p className="text-2xl font-black text-warning mt-1">{formatCurrency(result.estimated_refurbish_cost)}</p>
                </div>
              </div>
            </motion.div>

            {/* Sustainability */}
            <SustainabilityCard
              wasteSaved={result.waste_saved_kg}
              carbonSaved={result.carbon_saved_kg}
              credits={result.green_credits_awarded}
            />

            {/* Listing description */}
            {result.listing_description && (
              <motion.div className="card border-ai/20 bg-ai/5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <p className="text-xs font-semibold text-ai-light uppercase tracking-wider mb-2">✨ AI-Generated Listing Description</p>
                <p className="text-slate-300 text-sm italic">"{result.listing_description}"</p>
              </motion.div>
            )}

            {/* Refurbished Recommendations */}
            {listings.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                <h3 className="section-title mb-4">🛍️ Similar Refurbished Products</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {listings.map((listing) => (
                    <div key={listing.listing_id} className="card card-hover">
                      <img src={listing.image_url} alt={listing.product_name}
                        className="w-full h-40 object-cover rounded-lg mb-3" />
                      <div className="flex items-center gap-2 mb-2">
                        <span className={GRADE_CLASSES[listing.grade]}>{listing.grade} — {GRADE_LABELS[listing.grade]}</span>
                      </div>
                      <p className="font-medium text-white text-sm line-clamp-2">{listing.product_name}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <p className="text-eco font-bold">{formatCurrency(listing.resale_price)}</p>
                          <p className="text-xs text-slate-500 line-through">{formatCurrency(listing.original_price)}</p>
                        </div>
                        <p className="text-xs text-eco">🌱 {listing.co2_saved_kg}kg saved</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <Link to={`/returns/${returnId}`} className="btn-primary btn-md">View Full Report →</Link>
              <Link to="/dashboard" className="btn-secondary btn-md">← Dashboard</Link>
              <Link to="/credits" className="btn-eco btn-md">🌱 See Credits</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
