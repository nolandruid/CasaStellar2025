import WalletConnect from '../components/WalletConnect'
import PayrollUpload from '../components/PayrollUpload'
import './Dashboard.css'

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div className="header-content">
          <h1>🚀 CasaStellar Dashboard</h1>
          <WalletConnect />
        </div>
        <p className="tagline">Soroban-powered payroll platform for LATAM businesses</p>
      </header>

      <main className="page-main">
        <PayrollUpload />
      </main>
    </div>
  )
}
