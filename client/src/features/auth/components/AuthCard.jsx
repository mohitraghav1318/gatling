import { motion } from 'framer-motion';

const MotionSection = motion.section;

export default function AuthCard({ title, subtitle, children }) {
  return (
    <MotionSection
      // Centered card, frosted glass look, subtle borders and shadows.
      className="mx-auto w-full max-w-md rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur-xl border border-stable-200/50 relative overflow-hidden"
      // Entrance animation
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <header className="mb-6 space-y-2 text-center">
        {/* Title matches the bold centered focus style */}
        <h1 className="text-3xl font-bold tracking-tight text-stable-900">{title}</h1>
        {/* Subtitle adds subtle context */}
        <p className="text-sm font-medium text-stable-500">{subtitle}</p>
      </header>
      
      {/* Content wrapper */}
      <div className="relative z-10 w-full">
        {children}
      </div>
      
    </MotionSection>
  );
}
