import { motion } from 'framer-motion';

const MotionDiv = motion.div;

export default function AuthField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  disabled = false,
}) {
  return (
    <MotionDiv 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col space-y-2 mb-4"
    >
      <label 
        htmlFor={id} 
        className="text-sm font-semibold text-stable-700 tracking-wide ml-1"
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full px-4 py-3 text-stable-900 bg-white border border-stable-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all duration-200 placeholder:text-stable-400 disabled:opacity-50 disabled:bg-stable-50"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
      />
    </MotionDiv>
  );
}
