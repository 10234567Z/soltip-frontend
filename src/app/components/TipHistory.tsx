import { motion } from 'framer-motion'

interface TipHistoryProps {
  history: { amount: number; date: Date }[]
}

export function TipHistory({ history }: TipHistoryProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-4 text-indigo-600">Tip History</h2>
      {history.length === 0 ? (
        <p className="text-gray-600">No tips sent yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((tip, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex justify-between items-center text-gray-700"
            >
              <span>{tip.amount} SOL</span>
              <span>{tip.date.toLocaleString()}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

