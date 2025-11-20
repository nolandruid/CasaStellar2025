import { useWallet } from '../context/WalletContext'
import './WalletConnect.css'

export default function WalletConnect() {
  const { publicKey, isConnected, connectWallet, disconnectWallet } = useWallet()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="wallet-connect">
      {isConnected && publicKey ? (
        <div className="wallet-connected">
          <span className="wallet-address">🔗 {formatAddress(publicKey)}</span>
          <button onClick={disconnectWallet} className="btn-disconnect">
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={connectWallet} className="btn-connect">
          Connect Wallet
        </button>
      )}
    </div>
  )
}
