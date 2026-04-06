import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import AuthCard from '../components/AuthCard';
import AuthField from '../components/AuthField';
import AuthMessage from '../components/AuthMessage';
import { APP_ROUTES } from '../../../shared/config/routes';
import { APP_STORAGE_KEYS } from '../../../shared/config/env';

const LOGIN_MODE = {
  password: 'password',
  otp: 'otp',
};

const MotionMain = motion.main;

export default function LoginPage() {
  const [mode, setMode] = useState(LOGIN_MODE.password);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);

  const [message, setMessage] = useState({ type: 'info', text: '' });

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
      setMessage({ type: 'success', text: 'Login successful.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.response?.data?.message || 'Could not login with password.',
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
    <MotionMain
      className="page-content mx-auto w-full max-w-6xl px-4 pb-10 pt-8 md:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      <AuthCard
        title="Login"
        subtitle="Use either password login or OTP login based on your preference."
      >
        <div
          className="mb-4 grid grid-cols-2 gap-2 rounded-xl border p-1"
          style={{ borderColor: 'hsl(var(--color-border))' }}
        >
          <button
            className="rounded-lg px-3 py-2 text-sm font-semibold"
            style={{
              background:
                mode === LOGIN_MODE.password
                  ? 'hsl(var(--color-primary))'
                  : 'transparent',
              color:
                mode === LOGIN_MODE.password
                  ? 'hsl(var(--color-on-primary))'
                  : 'hsl(var(--color-text))',
            }}
            onClick={() => {
              setMode(LOGIN_MODE.password);
              setMessage({ type: 'info', text: '' });
            }}
            type="button"
          >
            Password
          </button>

          <button
            className="rounded-lg px-3 py-2 text-sm font-semibold"
            style={{
              background:
                mode === LOGIN_MODE.otp
                  ? 'hsl(var(--color-primary))'
                  : 'transparent',
              color:
                mode === LOGIN_MODE.otp
                  ? 'hsl(var(--color-on-primary))'
                  : 'hsl(var(--color-text))',
            }}
            onClick={() => {
              setMode(LOGIN_MODE.otp);
              resetOtpMode();
              setMessage({ type: 'info', text: '' });
            }}
            type="button"
          >
            OTP
          </button>
        </div>

        {mode === LOGIN_MODE.password ? (
          <form className="space-y-4" onSubmit={handlePasswordLogin}>
            <AuthField
              id="login-email"
              label="Email"
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
              className="btn-primary w-full rounded-xl px-4 py-2.5 font-semibold"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'Logging in...' : 'Login with Password'}
            </button>
          </form>
        ) : (
          <>
            {!otpRequested ? (
              <form className="space-y-4" onSubmit={handleRequestOtp}>
                <AuthField
                  id="login-otp-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                />

                <button
                  className="btn-primary w-full rounded-xl px-4 py-2.5 font-semibold"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? 'Requesting OTP...' : 'Request OTP'}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <AuthField
                  id="login-otp-code"
                  label="OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter OTP"
                  autoComplete="one-time-code"
                  disabled={isLoading}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="btn-primary rounded-xl px-4 py-2.5 font-semibold"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <button
                    className="btn-secondary rounded-xl px-4 py-2.5 font-semibold"
                    disabled={isLoading}
                    onClick={handleRequestOtp}
                    type="button"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        <AuthMessage type={message.type} text={message.text} />

        <p className="mt-5 text-sm text-muted">
          Need an account?{' '}
          <Link
            className="font-semibold"
            style={{ color: 'hsl(var(--color-primary))' }}
            to={APP_ROUTES.register}
          >
            Create one
          </Link>
        </p>
      </AuthCard>
    </MotionMain>
  );
}
