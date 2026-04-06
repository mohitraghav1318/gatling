import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../shared/config/routes';

const MotionMain = motion.main;

export default function HomePage() {
  return (
    <MotionMain 
      className="flex flex-col items-center justify-center text-center p-6 mt-12 relative z-10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 mb-8 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
          Frontend Starter
        </span>
      </div>

      <h1 className="max-w-4xl text-5xl md:text-7xl leading-tight font-extrabold text-stable-900 tracking-tight">
        Build auth flows that are <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">easy to scale</span>.
      </h1>

      <p className="mt-8 max-w-2xl text-lg md:text-xl text-stable-600 leading-relaxed font-medium">
        This starter UI includes a production-minded structure, smooth motion, and reusable auth components centered around your users.
      </p>

      <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md mx-auto">
        <Link
          to={APP_ROUTES.register}
          className="w-full sm:w-auto text-center rounded-full bg-teal-600 px-8 py-4 text-sm md:text-base font-bold tracking-wide text-white transition-all hover:-translate-y-1 hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
        >
          Start Registration
        </Link>

        <Link
          to={APP_ROUTES.login}
          className="w-full sm:w-auto text-center rounded-full border-2 border-stable-200 bg-white px-8 py-4 text-sm md:text-base font-bold tracking-wide text-stable-700 transition-all hover:bg-stable-50 hover:border-stable-300 focus:outline-none focus:ring-4 focus:ring-stable-500/20"
        >
          Open Login Page
        </Link>
      </div>
    </MotionMain>
  );
}
