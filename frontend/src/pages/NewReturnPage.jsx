import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import Navbar from '../components/layout/Navbar'
import useReturnStore from '../store/returnStore'
import useAuthStore from '../store/authStore'
import { createReturn, uploadReturnImages } from '../services/returnsApi'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Electronics','Clothing & Apparel','Home & Kitchen',
  'Sports & Outdoors','Books & Media','Beauty & Personal Care',
  'Toys & Games','Automotive','Health & Wellness','Other',
]

const RETURN_REASONS = [
  'Defective / Not Working','Wrong Item Received','Not as Described',
  'Changed Mind','Damaged in Shipping','Wrong Size / Fit',
  'Missing Parts / Accessories','Found Better Price','Other',
]

function StepIndicator({ currentStep, totalSteps }) {
  const labels = ['Product Details', 'Condition & Photos', 'Review & Submit']
  return (
    <div className="flex items-center gap-3 mb-8">
      {labels.map((label, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isDone   = step < currentStep
        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${isDone   ? 'bg-eco text-dark-bg' :
                  isActive ? 'bg-primary text-dark-bg glow-primary' :
                             'bg-dark-card border border-dark-border text-slate-500'}`}>
                {isDone ? '✓' : step}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
            {step < totalSteps && (
              <div className={`flex-1 h-0.5 transition-all ${isDone ? 'bg-eco' : 'bg-dark-border'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1({ onNext }) {
  const { productDetails, setProductDetails } = useReturnStore()
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!productDetails.productName.trim()) e.productName = 'Product name is required'
    if (!productDetails.category) e.category = 'Category is required'
    if (!productDetails.returnReason) e.returnReason = 'Return reason is required'
    if (!productDetails.originalPrice || Number(productDetails.originalPrice) <= 0)
      e.originalPrice = 'Valid price is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="form-label">Product Name *</label>
          <input className={`form-input ${errors.productName ? 'border-red-500' : ''}`}
            placeholder="e.g. Sony WH-1000XM5 Headphones"
            value={productDetails.productName}
            onChange={e => setProductDetails({ productName: e.target.value })}
          />
          {errors.productName && <p className="text-red-400 text-xs mt-1">{errors.productName}</p>}
        </div>

        <div>
          <label className="form-label">Category *</label>
          <select className={`form-select ${errors.category ? 'border-red-500' : ''}`}
            value={productDetails.category}
            onChange={e => setProductDetails({ category: e.target.value })}>
            <option value="">Select category...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="form-label">Brand</label>
          <input className="form-input" placeholder="e.g. Sony, Apple, Nike"
            value={productDetails.brand}
            onChange={e => setProductDetails({ brand: e.target.value })}
          />
        </div>

        <div>
          <label className="form-label">Original Purchase Price (USD) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input type="number" step="0.01" min="0"
              className={`form-input pl-8 ${errors.originalPrice ? 'border-red-500' : ''}`}
              placeholder="0.00"
              value={productDetails.originalPrice}
              onChange={e => setProductDetails({ originalPrice: e.target.value })}
            />
          </div>
          {errors.originalPrice && <p className="text-red-400 text-xs mt-1">{errors.originalPrice}</p>}
        </div>

        <div>
          <label className="form-label">Return Reason *</label>
          <select className={`form-select ${errors.returnReason ? 'border-red-500' : ''}`}
            value={productDetails.returnReason}
            onChange={e => setProductDetails({ returnReason: e.target.value })}>
            <option value="">Select reason...</option>
            {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.returnReason && <p className="text-red-400 text-xs mt-1">{errors.returnReason}</p>}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button className="btn-primary btn-lg" onClick={() => validate() && onNext()}>
          Next: Condition & Photos →
        </button>
      </div>
    </motion.div>
  )
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2({ onNext, onBack }) {
  const { condition, setCondition, addImages, removeImage } = useReturnStore()

  const onDrop = useCallback((acceptedFiles) => {
    if (condition.images.length >= 5) {
      toast.error('Maximum 5 images allowed')
      return
    }
    const remaining = 5 - condition.images.length
    addImages(acceptedFiles.slice(0, remaining))
    toast.success(`${Math.min(acceptedFiles.length, remaining)} image(s) added`)
  }, [condition.images.length, addImages])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: condition.images.length >= 5,
  })

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-6">
      {/* Image Upload Zone */}
      <div>
        <label className="form-label">Product Photos ({condition.images.length}/5)</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive ? 'border-primary-500 bg-primary-500/5' :
              condition.images.length >= 5 ? 'border-dark-border opacity-50 cursor-not-allowed' :
              'border-dark-border hover:border-primary-500/50 hover:bg-dark-hover'}`}
        >
          <input {...getInputProps()} />
          <div className="text-4xl mb-3">{isDragActive ? '📥' : '📸'}</div>
          <p className="text-white font-medium">
            {isDragActive ? 'Drop images here' : 'Drag & drop product photos'}
          </p>
          <p className="text-slate-500 text-sm mt-1">or click to browse • JPG, PNG, WebP • Max 10MB each • Up to 5 images</p>
          <p className="text-primary-400 text-xs mt-2">
            More photos = better AI analysis accuracy 🤖
          </p>
        </div>

        {/* Image previews */}
        {condition.images.length > 0 && (
          <div className="flex gap-3 mt-4 flex-wrap">
            {condition.images.map((file, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative group"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${i+1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-dark-border"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs
                    opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Condition Notes */}
      <div>
        <label className="form-label">Condition Notes</label>
        <textarea
          className="form-input min-h-[120px] resize-none"
          placeholder="Describe the item's condition, any visible damage, missing parts, or functional issues..."
          value={condition.conditionNotes}
          onChange={e => setCondition({ conditionNotes: e.target.value })}
        />
        <p className="text-xs text-slate-500 mt-1">
          The more detail you provide, the more accurate the AI analysis will be.
        </p>
      </div>

      <div className="flex justify-between mt-8">
        <button className="btn-ghost btn-lg" onClick={onBack}>← Back</button>
        <button className="btn-primary btn-lg" onClick={onNext}>
          Next: Review & Submit →
        </button>
      </div>
    </motion.div>
  )
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3({ onBack, onSubmit, submitting }) {
  const { productDetails, condition } = useReturnStore()
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-6">
      <div className="card-glass">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Product Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Product', productDetails.productName],
            ['Category', productDetails.category],
            ['Brand', productDetails.brand || '—'],
            ['Original Price', `$${productDetails.originalPrice}`],
            ['Return Reason', productDetails.returnReason],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-slate-500 text-xs">{k}</p>
              <p className="text-white font-medium mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Condition</h3>
        <p className="text-sm text-slate-300">{condition.conditionNotes || 'No additional notes'}</p>
        <div className="flex gap-2 mt-3">
          {condition.images.map((f, i) => (
            <img key={i} src={URL.createObjectURL(f)} alt="" className="w-14 h-14 object-cover rounded-lg border border-dark-border" />
          ))}
          {condition.images.length === 0 && (
            <p className="text-slate-500 text-sm">No images uploaded — rule-based analysis will be used</p>
          )}
        </div>
      </div>

      <div className="card-glass bg-primary-500/5 border-primary-500/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-semibold text-primary-400">AI Analysis Ready</p>
            <p className="text-sm text-slate-400 mt-1">
              After submission, Google Gemini Vision will analyze your {condition.images.length > 0 ? `${condition.images.length} image(s)` : 'product details'} and recommend the best routing action. Green credits will be awarded automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button className="btn-ghost btn-lg" onClick={onBack} disabled={submitting}>← Back</button>
        <button className="btn-primary btn-lg" onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-dark-bg/30 border-t-dark-bg rounded-full animate-spin" />
              Submitting & Uploading...
            </span>
          ) : '🚀 Submit & Analyze'}
        </button>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NewReturnPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentStep, nextStep, prevStep, productDetails, condition, setImageUrls, reset } = useReturnStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // 1. Create return record first (get return_id)
      const returnRes = await createReturn({
        product_name:    productDetails.productName,
        category:        productDetails.category,
        brand:           productDetails.brand || null,
        original_price:  Number(productDetails.originalPrice),
        return_reason:   productDetails.returnReason,
        condition_notes: condition.conditionNotes || null,
        image_urls:      [],
        processed_by:    user?.uid,
      })
      const returnId = returnRes.return.return_id

      // 2. Upload images to cloud/local storage (if any)
      let imageUrls = []
      if (condition.images.length > 0) {
        toast.loading('Uploading images...', { id: 'upload' })
        imageUrls = await uploadReturnImages(returnId, condition.images)
        setImageUrls(imageUrls)
        toast.dismiss('upload')
        toast.success('Images uploaded!')
      }

      toast.success('Return submitted! Running AI analysis...')
      reset()
      // Navigate to analysis page
      navigate(`/returns/${returnId}/analysis`, {
        state: {
          returnId, imageUrls,
          productName:    productDetails.productName,
          category:       productDetails.category,
          returnReason:   productDetails.returnReason,
          conditionNotes: condition.conditionNotes,
          originalPrice:  Number(productDetails.originalPrice),
        }
      })
    } catch (err) {
      toast.error(`Submission failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="page-container max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="section-title">📦 New Return</h1>
          <p className="section-subtitle">Submit a returned product for AI-powered condition grading and routing</p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={3} />

        <div className="card">
          <AnimatePresence mode="wait">
            {currentStep === 1 && <Step1 key="s1" onNext={nextStep} />}
            {currentStep === 2 && <Step2 key="s2" onNext={nextStep} onBack={prevStep} />}
            {currentStep === 3 && <Step3 key="s3" onBack={prevStep} onSubmit={handleSubmit} submitting={submitting} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
