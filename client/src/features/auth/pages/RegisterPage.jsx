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

const SIGNUP_STEP = {
  REQUEST_OTP: 'request-otp',
  VERIFY_OTP: 'verify-otp',
  COMPLETE: 'complete',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(SIGNUP_STEP.REQUEST_OTP);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  // Step 1: name + email -> server sends OTP email.
  async function handleStartSignup(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.startSignup({
        name: name.trim(),
        email: email.trim(),
      });
      setStep(SIGNUP_STEP.VERIFY_OTP);
      setMessage({
        type: 'success',
        text:
          response?.message ||
          'OTP sent. Please check your email and enter the code.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not start signup.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: verify OTP.
  async function handleVerifyOtp(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.verifySignupOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      setStep(SIGNUP_STEP.COMPLETE);
      setMessage({
        type: 'success',
        text: response?.message || 'OTP verified. Set your password now.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not verify OTP.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Step 3: set password + confirm password and create account.
  async function handleCompleteSignup(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Password and confirm password must match.',
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.completeSignup({
        email: email.trim(),
        password,
        confirmPassword,
      });
      storeTokenFromResponse(response);
      navigate(APP_ROUTES.dashboard, { replace: true });
      setMessage({ type: 'success', text: 'Registration successful.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not complete signup.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.startSignup({
        name: name.trim(),
        email: email.trim(),
      });
      setMessage({
        type: 'success',
        text: response?.message || 'OTP resent to your email.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not resend OTP.',
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
        subtitle="Secure signup with email OTP verification."
      >
        <div className="mb-5 rounded-xl border border-stable-200 bg-stable-50 px-3 py-2 text-xs font-semibold text-stable-600">
          Step{' '}
          {step === SIGNUP_STEP.REQUEST_OTP
            ? '1'
            : step === SIGNUP_STEP.VERIFY_OTP
              ? '2'
              : '3'}{' '}
          of 3
        </div>

        {step === SIGNUP_STEP.REQUEST_OTP ? (
          <form className="space-y-5" onSubmit={handleStartSignup}>
            <AuthField
              id="register-name"
              label="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: John Doe"
              autoComplete="name"
              disabled={isLoading}
            />

            <AuthField
              id="register-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Example: name@example.com"
              autoComplete="email"
              disabled={isLoading}
            />

            <p className="text-xs text-stable-500">
              Tip: use an email you can access now. OTP will be sent there.
            </p>

            <button
              className="w-full rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : null}

        {step === SIGNUP_STEP.VERIFY_OTP ? (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <AuthField
              id="register-email-readonly"
              label="Email Address"
              type="email"
              value={email}
              onChange={() => {}}
              placeholder="Email"
              autoComplete="email"
              disabled
            />

            <AuthField
              id="register-otp"
              label="OTP Code"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Example: 123456"
              autoComplete="one-time-code"
              disabled={isLoading}
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                className="w-full rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                className="w-full rounded-2xl border border-stable-200 bg-stable-100 px-5 py-3.5 text-sm font-bold tracking-wide text-stable-700 transition-all hover:bg-stable-200 focus:outline-none focus:ring-4 focus:ring-stable-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                onClick={handleResendOtp}
                type="button"
              >
                Resend OTP
              </button>
            </div>
          </form>
        ) : null}

        {step === SIGNUP_STEP.COMPLETE ? (
          <form className="space-y-5" onSubmit={handleCompleteSignup}>
            <AuthField
              id="register-password"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              disabled={isLoading}
            />

            <AuthField
              id="register-confirm-password"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              disabled={isLoading}
            />

            <button
              className="w-full rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        ) : null}

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
