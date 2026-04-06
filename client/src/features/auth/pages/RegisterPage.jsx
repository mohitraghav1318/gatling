import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import AuthCard from '../components/AuthCard';
import AuthField from '../components/AuthField';
import AuthMessage from '../components/AuthMessage';
import { APP_ROUTES } from '../../../shared/config/routes';
import { APP_STORAGE_KEYS } from '../../../shared/config/env';

const REGISTER_STEPS = {
  contact: 'contact',
  otp: 'otp',
  password: 'password',
};

const MotionMain = motion.main;

export default function RegisterPage() {
  const [step, setStep] = useState(REGISTER_STEPS.contact);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState({ type: 'info', text: '' });

  const stepLabel = useMemo(() => {
    if (step === REGISTER_STEPS.contact)
      return 'Step 1 of 3: Verify your email';
    if (step === REGISTER_STEPS.otp) return 'Step 2 of 3: Submit OTP';
    return 'Step 3 of 3: Secure your account';
  }, [step]);

  async function handleStartSignup(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.startSignup({ name, email });
      setStep(REGISTER_STEPS.otp);
      setMessage({
        type: 'success',
        text: response.message || 'OTP sent successfully',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.response?.data?.message ||
          'Could not start signup. Please try again.',
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
      const response = await authApi.verifySignupOtp({ email, otp });
      setStep(REGISTER_STEPS.password);
      setMessage({
        type: 'success',
        text: response.message || 'OTP verified successfully',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'OTP verification failed.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCompleteSignup(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '' });

    try {
      const response = await authApi.completeSignup({
        email,
        password,
        confirmPassword,
      });

      if (response?.data?.token) {
        localStorage.setItem(APP_STORAGE_KEYS.authToken, response.data.token);
      }

      setMessage({
        type: 'success',
        text: 'Account created. You can now continue inside the app.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not create account.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function renderStepForm() {
    if (step === REGISTER_STEPS.contact) {
      return (
        <form className="space-y-4" onSubmit={handleStartSignup}>
          <AuthField
            id="register-name"
            label="Full Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            disabled={isLoading}
          />

          <AuthField
            id="register-email"
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
            {isLoading ? 'Sending OTP...' : 'Verify Email'}
          </button>
        </form>
      );
    }

    if (step === REGISTER_STEPS.otp) {
      return (
        <form className="space-y-4" onSubmit={handleVerifyOtp}>
          <AuthField
            id="register-otp"
            label="OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="Enter 6-digit OTP"
            autoComplete="one-time-code"
            disabled={isLoading}
          />

          <button
            className="btn-primary w-full rounded-xl px-4 py-2.5 font-semibold"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Verifying OTP...' : 'Confirm OTP'}
          </button>
        </form>
      );
    }

    return (
      <form className="space-y-4" onSubmit={handleCompleteSignup}>
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
          placeholder="Repeat the same password"
          autoComplete="new-password"
          disabled={isLoading}
        />

        <button
          className="btn-primary w-full rounded-xl px-4 py-2.5 font-semibold"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    );
  }

  return (
    <MotionMain
      className="page-content mx-auto w-full max-w-6xl px-4 pb-10 pt-8 md:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      <AuthCard
        title="Register"
        subtitle="Follow the secure 3-step signup flow using email OTP verification."
      >
        <p className="mb-4 text-sm font-semibold text-muted">{stepLabel}</p>

        {renderStepForm()}

        <AuthMessage type={message.type} text={message.text} />

        <p className="mt-5 text-sm text-muted">
          Already have an account?{' '}
          <Link
            className="font-semibold"
            style={{ color: 'hsl(var(--color-primary))' }}
            to={APP_ROUTES.login}
          >
            Login here
          </Link>
        </p>
      </AuthCard>
    </MotionMain>
  );
}
