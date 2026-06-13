import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { logout } from '../../services/authService'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard',   label: 'Dashboard',   icon: '📊' },
  { path: '/returns/new', label: 'New Return',   icon: '📦' },
  { path: '/marketplace', label: 'Marketplace',  icon: '🛍️' },
  { path: '/prevention',  label: 'Prevention',   icon: '🔮' },
  { path: '/credits',     label: 'Green Credits', icon: '🌱' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      toast.success('Logged out successfully')
    } catch {
      toast.error('Logout failed')
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-border bg-dark-surface/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center glow-primary group-hover:scale-105 transition-transform">
              <span className="text-dark-bg font-black text-sm">R</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-white text-lg leading-none">ReturnWise</span>
              <span className="font-black text-primary-500 text-lg leading-none"> AI</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-dark-hover'
                    }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Credits badge */}
            <Link to="/credits" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-eco/10 border border-eco/20 hover:bg-eco/20 transition-colors">
              <span className="text-xs">🌱</span>
              <span className="text-xs font-semibold text-eco">
                {useAuthStore.getState().user ? 'Credits' : ''}
              </span>
            </Link>

            {/* User avatar */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-hover transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-ai-gradient flex items-center justify-center text-white text-sm font-bold">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm text-slate-300 max-w-[120px] truncate">
                  {user?.displayName || user?.email}
                </span>
                <span className="text-slate-500 text-xs">▾</span>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 card shadow-card-hover z-50"
                  >
                    <div className="px-3 py-2 border-b border-dark-border">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{role?.replace('_', ' ')}</p>
                      <p className="text-sm font-medium text-white truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/credits"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-dark-hover rounded-lg mx-1 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        🌱 My Green Credits
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg mx-1 transition-colors"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-dark-border bg-dark-surface overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-dark-hover transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                🚪 Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
