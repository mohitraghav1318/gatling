import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../shared/config/routes';

const HOME_FEATURES = [
  {
    title: 'Secure Signup Flow',
    description:
      'Users verify email with OTP before setting password, reducing fake registrations.',
  },
  {
    title: 'Flexible Login Methods',
    description:
      'Supports both password login and OTP login for better user experience.',
  },
  {
    title: 'Scalable Architecture',
    description:
      'Feature-based folder structure keeps code readable and easier to grow later.',
  },
];

const MotionDiv = motion.div;
const MotionAside = motion.aside;

export default function HomePage() {
  return (
    <main className="page-content mx-auto w-full max-w-6xl px-4 pb-14 pt-10 md:px-6 md:pt-14">
      <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-start">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <p
            className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{
              borderColor: 'hsl(var(--color-border))',
              color: 'hsl(var(--color-text-muted))',
            }}
          >
            Frontend Starter
          </p>

          <h1 className="text-4xl leading-tight font-bold md:text-5xl">
            Build auth flows that are easy to read, debug, and scale.
          </h1>

          <p className="text-muted mt-4 max-w-xl text-base md:text-lg">
            This starter UI includes a production-minded structure, smooth
            motion, and reusable auth components so you can keep building
            features faster.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold"
              to={APP_ROUTES.register}
            >
              Start Registration
            </Link>

            <Link
              className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold"
              to={APP_ROUTES.login}
            >
              Open Login Page
            </Link>
          </div>
        </MotionDiv>

        <MotionAside
          className="surface-card p-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
        >
          <h2 className="text-lg font-semibold">What you already have</h2>
          <ul className="mt-4 space-y-3">
            {HOME_FEATURES.map((item) => (
              <li
                key={item.title}
                className="rounded-lg border p-3"
                style={{
                  borderColor: 'hsl(var(--color-border))',
                  background: 'hsl(var(--color-surface))',
                }}
              >
                <h3 className="text-sm font-bold">{item.title}</h3>
                <p className="text-muted mt-1 text-sm">{item.description}</p>
              </li>
            ))}
          </ul>
        </MotionAside>
      </section>
    </main>
  );
}
