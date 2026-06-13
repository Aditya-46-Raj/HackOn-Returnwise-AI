import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { login } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: 'Warehouse Operator', email: 'operator@demo.com', password: 'Demo@123', icon: '📦', role: 'operator' },
  { label: 'Admin / Reviewer',   email: 'admin@demo.com',    password: 'Demo@123', icon: '🔑', role: 'admin' },
  { label: 'Ops Manager',        email: 'manager@demo.com',  password: 'Demo@123', icon: '📊', role: 'manager' },
]

const STATS = [
  { value: '847', label: 'Returns Processed', icon: '📦' },
  { value: '68%', label: 'Items Resold/Reused', icon: '♻️' },
  { value: '1.9T', label: 'CO₂ Saved (kg)', icon: '🌱' },
  { value: '22K', label: 'Green Credits Issued', icon: '⭐' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back! 👋')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (account) => {
    setLoading(true)
    setEmail(account.email)
    setPassword(account.password)
    try {
      await login(account.email, account.password)
      toast.success(`Logged in as ${account.label}`)
      navigate('/dashboard')
    } catch (err) {
      toast.error('Demo login failed')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await login('google.user@demo.com', 'Demo@123')
      toast.success('Signed in with Google! 🎉')
      navigate('/dashboard')
    } catch {
      toast.error('Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Left — Hero Panel */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 bg-hero-gradient relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ai/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-eco/5 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center glow-primary">
            <span className="text-dark-bg font-black text-lg">R</span>
          </div>
          <div>
            <span className="font-black text-white text-2xl">ReturnWise</span>
            <span className="font-black text-primary-500 text-2xl"> AI</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/20 mb-4">
              <span className="text-xs">🏆</span>
              <span className="text-xs font-semibold text-primary-400">Amazon HackOn 2026</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Every return gets a{' '}
              <span className="text-gradient-primary">second life.</span>
            </h1>
            <p className="mt-4 text-lg text-slate-400 leading-relaxed">
              AI-powered decision intelligence for returned products. 
              Powered by Google Gemini Vision.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {['🤖 Gemini Vision AI', '🌱 Green Credits', '🔮 Return Prevention', '🛍️ Marketplace'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-dark-surface/80 border border-dark-border text-sm text-slate-300">
                {f}
              </span>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            className="grid grid-cols-2 gap-4 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="card-glass p-4">
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label} {stat.icon}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-600">
          Built for Second Life Commerce Track • Amazon HackOn
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 lg:max-w-md xl:max-w-lg flex flex-col justify-center px-8 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center">
              <span className="text-dark-bg font-black text-sm">R</span>
            </div>
            <span className="font-black text-white text-xl">ReturnWise <span className="text-primary-500">AI</span></span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white">Sign in</h2>
            <p className="mt-2 text-slate-400">Access the return management platform</p>
          </div>

          {/* Demo accounts */}
          <div className="space-y-2">
            <p className="form-label">⚡ Quick Demo Login</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  disabled={loading}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-surface border border-dark-border hover:border-primary-500/40 hover:bg-dark-hover transition-all duration-200 text-left group"
                >
                  <span className="text-xl">{account.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{account.label}</div>
                    <div className="text-xs text-slate-500 truncate">{account.email}</div>
                  </div>
                  <span className="text-slate-600 group-hover:text-primary-500 transition-colors text-xs">→</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="divider" />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 px-3 bg-dark-bg text-xs text-slate-500">
              or sign in manually
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary btn-lg justify-center mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-dark-bg/30 border-t-dark-bg rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full btn-secondary btn-lg justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-slate-600">
            Second Life Commerce Platform • Amazon HackOn 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}
