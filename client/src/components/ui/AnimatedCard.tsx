import { motion } from 'framer-motion'

export default function AnimatedCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border border-white/10 bg-surface/80 p-6 shadow-xl backdrop-blur ${className}`}
    >
      {children}
    </motion.div>
  )
}
