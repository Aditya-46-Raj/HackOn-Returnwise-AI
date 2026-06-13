import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import { getListings } from '../services/returnsApi'
import { GRADE_CLASSES, GRADE_LABELS } from '../utils/gradeColors'
import { formatCurrency } from '../utils/formatters'

const CATEGORIES = ['Electronics','Clothing & Apparel','Home & Kitchen','Sports & Outdoors','Beauty & Personal Care']
const GRADES = ['A', 'B', 'C']

function ProductCard({ listing }) {
  const savings = listing.original_price - listing.resale_price
  const savingsPct = Math.round((savings / listing.original_price) * 100)

  return (
    <motion.div
      className="card card-hover overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <img
          src={listing.image_url}
          alt={listing.product_name}
          className="w-full h-48 object-cover rounded-lg"
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
        />
        {/* Grade badge overlay */}
        <div className="absolute top-2 left-2">
          <span className={GRADE_CLASSES[listing.grade]}>{listing.grade} — {GRADE_LABELS[listing.grade]}</span>
        </div>
        {/* Savings badge */}
        <div className="absolute top-2 right-2 bg-eco text-dark-bg text-xs font-bold px-2 py-1 rounded-full">
          -{savingsPct}%
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="font-semibold text-white text-sm line-clamp-2">{listing.product_name}</p>
        <p className="text-xs text-slate-400">{listing.brand} • {listing.category}</p>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-eco font-black text-lg">{formatCurrency(listing.resale_price)}</p>
            <p className="text-xs text-slate-500 line-through">{formatCurrency(listing.original_price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-eco">🌱 {listing.co2_saved_kg}kg CO₂</p>
            <div className="flex gap-0.5 justify-end mt-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-xs ${i < Math.round(listing.trust_score) ? 'text-yellow-400' : 'text-dark-border'}`}>★</span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 italic">"{listing.description}"</p>

        {listing.warranty_months > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>🛡️</span> {listing.warranty_months}-month warranty
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function MarketplacePage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ category: '', grade: '', sortBy: 'grade' })

  const fetchListings = async (f) => {
    setLoading(true)
    try {
      const res = await getListings({ category: f.category, grade: f.grade, sortBy: f.sortBy })
      setListings(res.listings || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchListings(filter) }, [filter])

  const handleFilter = (key, value) => {
    const newFilter = { ...filter, [key]: value }
    setFilter(newFilter)
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="section-title">🛍️ Certified Refurbished Marketplace</h1>
            <p className="section-subtitle">AI-graded, verified second-life products</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-eco/10 border border-eco/20">
            <span className="text-eco text-sm">🌱</span>
            <span className="text-sm text-eco font-semibold">{listings.length} items available</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select className="form-select text-sm py-2 w-48"
            value={filter.category} onChange={e => handleFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="form-select text-sm py-2 w-36"
            value={filter.grade} onChange={e => handleFilter('grade', e.target.value)}>
            <option value="">All Grades</option>
            {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>

          <select className="form-select text-sm py-2 w-44"
            value={filter.sortBy} onChange={e => handleFilter('sortBy', e.target.value)}>
            <option value="grade">Sort: Best Grade</option>
            <option value="price_asc">Sort: Price ↑</option>
            <option value="price_desc">Sort: Price ↓</option>
            <option value="co2">Sort: Most CO₂ Saved</option>
          </select>

          {(filter.category || filter.grade) && (
            <button
              className="btn-ghost btn-sm"
              onClick={() => setFilter({ category: '', grade: '', sortBy: filter.sortBy })}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* Trust banner */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-dark-surface border border-dark-border">
          {['✅ AI Quality Verified', '🛡️ Buyer Protected', '📦 Free Returns', '🌱 Carbon Neutral Shipping'].map(tag => (
            <span key={tag} className="text-sm text-slate-300">{tag}</span>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-72 rounded-xl" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-400">No listings match your filters.</p>
            <button className="btn-ghost btn-sm mt-4"
              onClick={() => setFilter({ category: '', grade: '', sortBy: 'grade' })}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((listing) => (
              <ProductCard key={listing.listing_id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
