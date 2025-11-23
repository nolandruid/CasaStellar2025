import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Status from './pages/Status'
import Employees from './pages/Employees'
import Settings from './pages/Settings'
import PaymentProof from './pages/PaymentProof'
import SplashScreen from './components/SplashScreen'
import LoginScreen from './components/LoginScreen'
import RegisterScreen from './components/RegisterScreen'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function AppContent() {
  const [showSplash, setShowSplash] = useState(true)

  const handleLoadingComplete = () => {
    setShowSplash(false)
  }

  // Show splash screen on first load
  if (showSplash) {
    return <SplashScreen onLoadingComplete={handleLoadingComplete} />
  }

  // Main app routes
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute>
          <MainLayout>
            <Employees />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/status" element={
        <ProtectedRoute>
          <MainLayout>
            <Status />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/payment-proof" element={
        <ProtectedRoute>
          <MainLayout>
            <PaymentProof />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Layout component with navbar
function MainLayout({ children }: { children: React.ReactNode }) {
  const { logout, employer } = useAuth()

  return (
    <div className="app">
      <nav className="main-nav">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <img 
              src="/assets/paydat_logo.jpeg" 
              alt="PayDay" 
              className="logo-nav-image"
            />
            <span className="logo-text">PayDay</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/employees" className="nav-link">Employees</Link>
            <Link to="/status" className="nav-link">Status</Link>
            <Link to="/settings" className="nav-link">Settings</Link>
            {employer && (
              <span className="nav-link" style={{ color: '#9ca3af' }}>
                {employer.companyName}
              </span>
            )}
            <button onClick={logout} className="nav-link logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}

// Main App component with providers
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <AppContent />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
