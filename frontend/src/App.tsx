import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Dashboard from './pages/Dashboard'
import Status from './pages/Status'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="app">
          <nav className="main-nav">
            <div className="nav-content">
              <Link to="/" className="nav-logo">
                ⭐ CasaStellar
              </Link>
              <div className="nav-links">
                <Link to="/" className="nav-link">Upload</Link>
                <Link to="/status" className="nav-link">Status</Link>
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/status" element={<Status />} />
          </Routes>
        </div>
      </WalletProvider>
    </BrowserRouter>
  )
}

export default App
