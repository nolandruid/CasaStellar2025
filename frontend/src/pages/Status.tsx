import WalletConnect from '../components/WalletConnect'
import PayrollStatusList from '../components/PayrollStatusList'
import './Status.css'

export default function Status() {
  return (
    <div className="status-page">
      <header className="page-header">
        <div className="header-content">
          <h1>📊 Payroll Status</h1>
          <WalletConnect />
        </div>
        <p className="tagline">Monitor your payroll batches and yield generation</p>
      </header>

      <main className="page-main">
        <PayrollStatusList />
      </main>
    </div>
  )
}
