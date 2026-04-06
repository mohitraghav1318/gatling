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

const LOGIN_MODE = {
  password: 'password',
  otp: 'otp',
};

const MotionMain = motion.main;

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(LOGIN_MODE.password);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);

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

  async function handlePasswordLogin(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.loginWithPassword({ email, password });
      storeTokenFromResponse(response);
      navigate(APP_ROUTES.dashboard, { replace: true });
      setMessage({ type: 'success', text: 'Login successful.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not login with password.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRequestOtp(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.requestLoginOtp({ email });
      setOtpRequested(true);
      setMessage({
        type: 'success',
        text: response.message || 'OTP sent to your email.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not request OTP.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.verifyLoginOtp({ email, otp });
      storeTokenFromResponse(response);
      navigate(APP_ROUTES.dashboard, { replace: true });
      setMessage({ type: 'success', text: 'OTP login successful.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not verify OTP login.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function resetOtpMode() {
    setOtpRequested(false);
    setOtp('');
  }

  return (
    // MotionMain animates smoothly upon rendering the page
    <MotionMain
      className="w-full flex items-center justify-center p-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AuthCard
        title="Welcome Back"
        subtitle="Log in using your preferred method below."
      >
        <div className="mb-6 flex overflow-hidden rounded-2xl bg-stable-100 p-1 ring-1 ring-inset ring-stable-200/60 shadow-inner">
          <button
            className={`w-1/2 rounded-xl px-4 py-2.5 text-sm font-bold tracking-wide transition-all ${
              mode === LOGIN_MODE.password
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/30 ring-1 ring-teal-500'
                : 'text-stable-600 hover:bg-stable-200 hover:text-stable-900'
            }`}
            onClick={() => {
              setMode(LOGIN_MODE.password);
              setMessage({ type: 'info', text: '' });
            }}
            type="button"
          >
            Password
          </button>

          <button
            className={`w-1/2 rounded-xl px-4 py-2.5 text-sm font-bold tracking-wide transition-all ${
              mode === LOGIN_MODE.otp
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/30 ring-1 ring-teal-500'
                : 'text-stable-600 hover:bg-stable-200 hover:text-stable-900'
            }`}
            onClick={() => {
              setMode(LOGIN_MODE.otp);
              resetOtpMode();
              setMessage({ type: 'info', text: '' });
            }}
            type="button"
          >
            OTP Code
          </button>
        </div>

        {mode === LOGIN_MODE.password ? (
          <form className="space-y-5" onSubmit={handlePasswordLogin}>
            <AuthField
              id="login-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isLoading}
            />

            <AuthField
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              disabled={isLoading}
            />

            <button
              className="w-full rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <>
            {!otpRequested ? (
              <form className="space-y-5" onSubmit={handleRequestOtp}>
                <AuthField
                  id="login-otp-email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                />

                <button
                  className="w-full rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? 'Requesting Code...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                <AuthField
                  id="login-otp-code"
                  label="One-Time Passcode"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                  disabled={isLoading}
                />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    className="w-full rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>

                  <button
                    className="w-full rounded-2xl bg-stable-100 border border-stable-200 px-5 py-3.5 text-sm font-bold tracking-wide text-stable-700 transition-all hover:bg-stable-200 focus:outline-none focus:ring-4 focus:ring-stable-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    onClick={handleRequestOtp}
                    type="button"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        <div className="mt-5">
          <AuthMessage type={message.type} text={message.text} />
        </div>

        <p className="mt-8 text-center text-sm font-medium text-stable-500">
          Need an account?{' '}
          <Link
            className="font-bold tracking-wide text-teal-600 underline-offset-4 hover:underline transition-all"
            to={APP_ROUTES.register}
          >
            Create one
          </Link>
        </p>
      </AuthCard>
    </MotionMain>
  );
}
