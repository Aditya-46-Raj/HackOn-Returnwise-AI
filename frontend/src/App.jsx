import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthSync } from './hooks/useAuth'
import useAuthStore from './store/authStore'

// Lazy-load pages for code splitting
const LoginPage          = lazy(() => import('./pages/LoginPage'))
const DashboardPage      = lazy(() => import('./pages/DashboardPage'))
const NewReturnPage      = lazy(() => import('./pages/NewReturnPage'))
const AnalysisResultPage = lazy(() => import('./pages/AnalysisResultPage'))
const ItemDetailPage     = lazy(() => import('./pages/ItemDetailPage'))
const GreenCreditsPage   = lazy(() => import('./pages/GreenCreditsPage'))
const PreventionPage     = lazy(() => import('./pages/PreventionPage'))
const MarketplacePage    = lazy(() => import('./pages/MarketplacePage'))

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading ReturnWise AI...</p>
      </div>
    </div>
  )
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Public route (redirect to dashboard if logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  // Sync backend auth state with Zustand on app mount
  useAuthSync()

  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#232B3E',
            color: '#F1F5F9',
            border: '1px solid #2E3A52',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00C851', secondary: '#0F1111' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#0F1111' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/returns/new" element={
            <ProtectedRoute><NewReturnPage /></ProtectedRoute>
          } />
          <Route path="/returns/:returnId/analysis" element={
            <ProtectedRoute><AnalysisResultPage /></ProtectedRoute>
          } />
          <Route path="/returns/:returnId" element={
            <ProtectedRoute><ItemDetailPage /></ProtectedRoute>
          } />
          <Route path="/credits" element={
            <ProtectedRoute><GreenCreditsPage /></ProtectedRoute>
          } />
          <Route path="/prevention" element={
            <ProtectedRoute><PreventionPage /></ProtectedRoute>
          } />
          <Route path="/marketplace" element={
            <ProtectedRoute><MarketplacePage /></ProtectedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
