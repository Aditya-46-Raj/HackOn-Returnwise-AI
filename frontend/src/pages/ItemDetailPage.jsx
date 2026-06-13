import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import { getReturn, overrideReturnAction } from '../services/returnsApi'
import { GRADE_CLASSES, GRADE_LABELS, GRADE_ICONS, ACTION_CLASSES, ACTION_ICONS } from '../utils/gradeColors'
import { formatCurrency, formatKg, formatDateTime } from '../utils/formatters'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const ROUTING_OPTIONS = ['Restock','Resell','Refurbish','Donate','Recycle','Exchange']

function StatusTimeline({ status, createdAt, reviewedAt }) {
  const steps = [
    { label: 'Returned',  done: true,              icon: '📦' },
    { label: 'Assessed',  done: !!status,           icon: '🔍' },
    { label: 'Routed',    done: status !== 'pending', icon: '🎯' },
    { label: 'Closed',    done: status === 'closed', icon: '✅' },
  ]
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
              ${step.done ? 'bg-eco/20 border-2 border-eco' : 'bg-dark-card border-2 border-dark-border'}`}>
              {step.icon}
            </div>
            <span className={`text-xs ${step.done ? 'text-eco' : 'text-slate-600'}`}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${steps[i+1].done ? 'bg-eco' : 'bg-dark-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function ItemDetailPage() {
  const { returnId } = useParams()
  const { isAdmin } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [overrideAction, setOverrideAction] = useState('')
  const [overrideNote, setOverrideNote] = useState('')
  const [overriding, setOverriding] = useState(false)
  const [selectedImg, setSelectedImg] = useState(0)

  useEffect(() => {
    getReturn(returnId)
      .then(setData)
      .catch(() => toast.error('Failed to load return'))
      .finally(() => setLoading(false))
  }, [returnId])

  const handleOverride = async () => {
    if (!overrideAction) return
    setOverriding(true)
    try {
      await overrideReturnAction(returnId, overrideAction, overrideNote)
      toast.success(`Action updated to ${overrideAction}`)
      const updated = await getReturn(returnId)
      setData(updated)
    } catch (err) {
      toast.error('Override failed: ' + err.message)
    } finally {
      setOverriding(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-dark-bg"><Navbar />
      <div className="page-container space-y-4">
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-dark-bg"><Navbar />
      <div className="page-container text-center py-16">
        <p className="text-slate-400">Return not found.</p>
        <Link to="/dashboard" className="btn-secondary btn-sm mt-4 inline-flex">← Dashboard</Link>
      </div>
    </div>
  )

  const { return: ret, report } = data
  const imageUrls = ret.image_urls || []

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="page-container max-w-5xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white">← Dashboard</Link>
            <h1 className="section-title mt-1">{ret.product_name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {ret.condition_grade && <span className={GRADE_CLASSES[ret.condition_grade]}>{GRADE_ICONS[ret.condition_grade]} Grade {ret.condition_grade} — {GRADE_LABELS[ret.condition_grade]}</span>}
              {ret.recommended_action && <span className={ACTION_CLASSES[ret.recommended_action]}>{ACTION_ICONS[ret.recommended_action]} {ret.recommended_action}</span>}
              <span className={`badge ${ret.status === 'closed' ? 'bg-slate-700/50 text-slate-400 border-slate-600' : 'bg-primary-500/20 text-primary-400 border-primary-500/30'}`}>
                {ret.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Return ID</p>
            <p className="text-xs font-mono text-slate-400">{returnId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Image Gallery */}
            {imageUrls.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Product Images</h3>
                <img src={imageUrls[selectedImg]} alt="Product"
                  className="w-full h-64 object-cover rounded-xl mb-3" />
                <div className="flex gap-2">
                  {imageUrls.map((url, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                        ${selectedImg === i ? 'border-primary-500' : 'border-dark-border'}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">🤖 AI Analysis</h3>
              {ret.gemini_analysis ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-ai/10 rounded-xl border border-ai/20">
                    <span className="text-ai text-lg mt-0.5">✨</span>
                    <p className="text-slate-300 text-sm leading-relaxed">{ret.gemini_analysis}</p>
                  </div>
                  {ret.detected_defects?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Detected Issues</p>
                      <ul className="space-y-1">
                        {ret.detected_defects.map((d, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                            <span className="text-yellow-500">⚠</span> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Analysis pending or not yet run.</p>
              )}
            </div>

            {/* Timeline */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Status Timeline</h3>
              <StatusTimeline status={ret.status} createdAt={ret.created_at} />
              <p className="text-xs text-slate-500 mt-4">Submitted: {formatDateTime(ret.created_at)}</p>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Product Info</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Category', ret.category],
                  ['Brand', ret.brand || '—'],
                  ['Original Price', formatCurrency(ret.original_price)],
                  ['Return Reason', ret.return_reason],
                  ['Condition Notes', ret.condition_notes || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-500">{k}</p>
                    <p className="text-white font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recovery Report */}
            {report && (
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">💰 Recovery Report</h3>
                <div className="space-y-3 text-sm">
                  {[
                    ['Est. Resale Value', formatCurrency(report.estimated_resale_value), 'text-eco'],
                    ['Est. Refurb Cost', formatCurrency(report.estimated_refurbish_cost), 'text-warning'],
                    ['Waste Saved', formatKg(report.waste_saved_kg), 'text-eco'],
                    ['CO₂ Saved', formatKg(report.carbon_saved_kg), 'text-eco'],
                    ['Green Credits', `+${report.green_credits_awarded}`, 'text-primary-400'],
                  ].map(([k, v, cls]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{k}</span>
                      <span className={`font-bold ${cls}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Override */}
            {isAdmin() && (
              <div className="card border-primary-500/20">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">🔑 Admin Override</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Current: <strong className="text-white">{ret.final_action || ret.recommended_action || 'Pending'}</strong>
                </p>
                <select className="form-select text-sm mb-3"
                  value={overrideAction} onChange={e => setOverrideAction(e.target.value)}>
                  <option value="">Select new action...</option>
                  {ROUTING_OPTIONS.map(o => <option key={o} value={o}>{ACTION_ICONS[o]} {o}</option>)}
                </select>
                <textarea className="form-input text-sm min-h-[80px] resize-none mb-3"
                  placeholder="Admin note (optional)..."
                  value={overrideNote} onChange={e => setOverrideNote(e.target.value)} />
                <button className="btn-primary btn-sm w-full justify-center"
                  onClick={handleOverride} disabled={!overrideAction || overriding}>
                  {overriding ? 'Updating...' : 'Apply Override'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
