'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor'
import { motion, AnimatePresence } from 'framer-motion'
import { IDL } from '@/types/minter'
import { TipHistory } from './components/TipHistory'
import { CreatorProfile } from './components/CreatorProfile'

const PROGRAM_ID = new PublicKey('8ubPzisSkpZ7NMcgK72MZUYfx4XcTL9wh9QaBtanGpLP');

export default function Home() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [creatorAddress, setCreatorAddress] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [tipHistory, setTipHistory] = useState<{ amount: number; date: Date }[]>([])
  const [tipper , setTipper] = useState<PublicKey | null>(null);


  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      setTipper(wallet.publicKey);
    } else {
      setTipper(null);
    }
  }, [wallet.connected, wallet.publicKey])

  const getProgram = () => {
    const provider = new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions())
    return new Program(IDL, PROGRAM_ID, provider)
  }

  const initializeTipAccount = async (creatorPublicKey: PublicKey) => {
    if (!tipper) {
      throw new Error("Wallet not connected")
    }
    const program = getProgram()
    const [tipAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tip_account"), tipper.toBuffer()],
      program.programId
    )

    try {
      await program.methods
        .initialize()
        .accounts({
          tipAccount: tipAccountPda,
          tipper: tipper,
          creator: creatorPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      console.log("Tip account initialized")
    } catch (error) {
      console.error("Error initializing tip account:", error)
      // If the account already exists, we can ignore this error
      if (!(error instanceof Error) || !error.message.includes("already in use")) {
        throw error
      }
    }
  }

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet.connected) {
      setStatus('error')
      setMessage('Please connect your wallet first')
      return
    }
    if (!wallet.publicKey || !wallet.signTransaction) return

    setStatus('loading')
    setMessage('Processing your tip...')

    try {
      const creatorPublicKey = new PublicKey(creatorAddress)
      const amount = parseFloat(tipAmount) * web3.LAMPORTS_PER_SOL

      if (wallet.publicKey.equals(creatorPublicKey)) {
        throw new Error("You cannot tip yourself")
      }

      if (amount <= 0) {
        throw new Error("Tip amount must be greater than 0")
      }

      // Initialize tip account if it doesn't exist
      await initializeTipAccount(creatorPublicKey)

      const program = getProgram()
      const [tipAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("tip_account"), tipper!.toBuffer()],
        program.programId
      )

      const tx = await program.methods
        .sendTip(new BN(amount))
        .accounts({
          tipAccount: tipAccountPda,
          tipper: tipper!,
          creator: creatorPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const latestBlockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = wallet.publicKey;

      // Sign the transaction
      const signedTx = await wallet.signTransaction(tx);

      // Send the signed transaction
      const txId = await connection.sendRawTransaction(signedTx.serialize());

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature: txId,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm')
      }

      setStatus('success')
      setMessage(`Tip of ${tipAmount} SOL sent successfully!`)
      setTipHistory([...tipHistory, { amount: parseFloat(tipAmount), date: new Date() }])
      setTipAmount('')
    } catch (error) {
      console.error('Error sending tip:', error)
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('An unknown error occurred')
      }
      setStatus('error')
    }
  }

  useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => setStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h1 className="text-4xl font-bold mb-6 text-center text-indigo-600">SolTip</h1>
        <p className="text-center text-gray-600 mb-6">Support your favorite creators with SOL</p>
        <WalletMultiButton className="w-full mb-6" />
        <AnimatePresence mode="wait">
          {wallet.publicKey ? (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleTip} 
              className="space-y-4"
            >
              <div>
                <label htmlFor="creatorAddress" className="block text-sm font-medium text-gray-700">
                  Creator Address
                </label>
                <input
                  type="text"
                  id="creatorAddress"
                  value={creatorAddress}
                  onChange={(e) => setCreatorAddress(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-700 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  placeholder="Enter creator's Solana address"
                />
              </div>
              <div>
                <label htmlFor="tipAmount" className="block text-sm font-medium text-gray-700">
                  Tip Amount (SOL)
                </label>
                <input
                  type="number"
                  id="tipAmount"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-700 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  min="0.000001"
                  step="0.000001"
                  placeholder="0.00"
                />
              </div>
              <motion.button
                type="submit"
                className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={status === 'loading'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {status === 'loading' ? 'Processing...' : 'Send Tip'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.p 
              key="connect-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-gray-600"
            >
              Connect your wallet to send tips
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-4 p-4 rounded-md ${
                status === 'success' ? 'bg-green-100 text-green-800' : 
                status === 'error' ? 'bg-red-100 text-red-800' : 
                'bg-blue-100 text-blue-800'
              }`}
            >
              <p className="text-center">{message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {wallet.publicKey && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 w-full max-w-md"
        >
          <TipHistory history={tipHistory} />
        </motion.div>
      )}
      {creatorAddress && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 w-full max-w-md"
        >
          <CreatorProfile address={creatorAddress} />
        </motion.div>
      )}
    </div>
  )
}

