import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PublicKey } from '@solana/web3.js'
import * as web3 from '@solana/web3.js';

interface CreatorProfileProps {
  address: string
}

export function CreatorProfile({ address }: CreatorProfileProps) {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed')
        const publicKey = new PublicKey(address)
        const balance = await connection.getBalance(publicKey)
        setBalance(balance / web3.LAMPORTS_PER_SOL)
      } catch (error) {
        console.error('Error fetching balance:', error)
      }
    }

    fetchBalance()
  }, [address])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-4 text-indigo-600">Creator Profile</h2>
      <p className="text-gray-700 mb-2">Address: {address}</p>
      {balance !== null ? (
        <p className="text-gray-700">Balance: {balance.toFixed(2)} SOL</p>
      ) : (
        <p className="text-gray-600">Loading balance...</p>
      )}
    </motion.div>
  )
}

