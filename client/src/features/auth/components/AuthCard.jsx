import { motion } from 'framer-motion';

const MotionSection = motion.section;

export default function AuthCard({ title, subtitle, children }) {
  return (
    <MotionSection
      className="surface-card mx-auto w-full max-w-md p-6 md:p-7"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: 'easeOut' }}
    >
      <header className="mb-5">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted mt-2 text-sm">{subtitle}</p>
      </header>
      {children}
    </MotionSection>
  );
}
