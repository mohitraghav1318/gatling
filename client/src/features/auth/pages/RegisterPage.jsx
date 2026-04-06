import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import AuthCard from '../components/AuthCard';
import AuthField from '../components/AuthField';
import AuthMessage from '../components/AuthMessage';
import { APP_ROUTES } from '../../../shared/config/routes';
import { APP_STORAGE_KEYS } from '../../../shared/config/env';
import { hasAuthToken } from '../../../shared/utils/authSession';

const MotionMain = motion.main;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState({ type: 'info', text: '' });

  // Automatically redirect to dashboard if the user already has a valid token
  useEffect(() => {
    if (hasAuthToken()) {
      navigate(APP_ROUTES.dashboard, { replace: true });
    }
  }, [navigate]);

  function storeTokenFromResponse(response) {
    if (response?.data?.token) {
      localStorage.setItem(APP_STORAGE_KEYS.authToken, response.data.token);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.register({ name, email, password });
      storeTokenFromResponse(response);
      navigate(APP_ROUTES.dashboard, { replace: true });
      setMessage({ type: 'success', text: 'Registration successful.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not register.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <MotionMain
      className="w-full flex items-center justify-center p-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AuthCard
        title="Create Account"
        subtitle="Sign up for a new account. It takes just seconds."
      >
        <form className="space-y-5" onSubmit={handleRegister}>
          <AuthField
            id="register-name"
            label="Full Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="John Doe"
            autoComplete="name"
            disabled={isLoading}
          />

          <AuthField
            id="register-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isLoading}
          />

          <AuthField
            id="register-password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
            disabled={isLoading}
          />

          <button
            className="w-full rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Creating Account...' : 'Continue Registration'}
          </button>
        </form>

        <div className="mt-5">
          <AuthMessage type={message.type} text={message.text} />
        </div>

        <p className="mt-8 text-center text-sm font-medium text-stable-500">
          Already have an account?{' '}
          <Link
            className="font-bold tracking-wide text-teal-600 underline-offset-4 hover:underline transition-all"
            to={APP_ROUTES.login}
          >
            Log in
          </Link>
        </p>
      </AuthCard>
    </MotionMain>
  );
}
