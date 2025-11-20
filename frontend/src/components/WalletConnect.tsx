import { useEffect, useRef } from 'react'
import { useWallet } from '../context/WalletContext'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import './WalletConnect.css'

export default function WalletConnect() {
  const { publicKey, isConnected, disconnectWallet } = useWallet()
  const buttonWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Create the wallet button using the kit's native button
    if (buttonWrapperRef.current && !isConnected) {
      try {
        StellarWalletsKit.createButton(buttonWrapperRef.current)
      } catch (error) {
        console.error('Error creating wallet button:', error)
      }
    }
  }, [isConnected])

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
        <div ref={buttonWrapperRef} className="wallet-button-wrapper"></div>
      )}
    </div>
  )
}
