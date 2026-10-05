import { motion } from 'framer-motion';

interface Props {
  onClick: () => void;
}

export default function FAB({ onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      style={{
        background: 'var(--accent)',
        color: '#ffffff',
        right: 16,
        bottom: `calc(64px + env(safe-area-inset-bottom, 0px) + 12px)`,
        boxShadow: '0 4px 20px rgba(139,26,26,0.3)',
      }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" d="M12 5v14m-7-7h14" />
      </svg>
    </motion.button>
  );
}
