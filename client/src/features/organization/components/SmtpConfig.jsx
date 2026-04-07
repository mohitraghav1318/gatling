import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { organizationApi } from '../api/organization.api';

const MotionDiv = motion.div;

const Spinner = ({ className = 'w-4 h-4' }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

export default function SmtpConfig({ organizationName }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mailConfigMeta, setMailConfigMeta] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // NOTE FOR BEGINNERS:
  // Backend expects smtpFrom as one string (for example: "Acme Team <noreply@acme.com>").
  const [config, setConfig] = useState({
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
  });

  const fetchMeta = useCallback(async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      const response = await organizationApi.getMailConfigMeta(organizationName);
      const meta = response?.data?.mailConfig || null;

      setMailConfigMeta(meta);

      if (meta) {
        setConfig((prev) => ({
          ...prev,
          smtpHost: meta.smtpHost || '',
          smtpPort: meta.smtpPort || 465,
          smtpSecure: Boolean(meta.smtpSecure),
          smtpUser: meta.smtpUser || '',
          smtpFrom: meta.smtpFrom || '',
          smtpPass: '',
        }));
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Could not load mail config.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationName]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  async function handleSave(event) {
    event.preventDefault();

    if (!config.smtpPass.trim()) {
      setMessage({
        type: 'error',
        text: 'SMTP password is required when saving mail config.',
      });
      return;
    }

    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });

      await organizationApi.upsertMailConfig(organizationName, {
        smtpHost: config.smtpHost.trim(),
        smtpPort: Number(config.smtpPort),
        smtpSecure: config.smtpSecure,
        smtpUser: config.smtpUser.trim(),
        smtpPass: config.smtpPass,
        smtpFrom: config.smtpFrom.trim(),
      });

      setMessage({ type: 'success', text: 'Mail config saved successfully.' });
      await fetchMeta();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save mail config.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-stable-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-bold text-stable-900">Organization Mail Config</h3>
      <p className="mt-1 text-sm text-stable-500">
        Tip: this is used by all members while sending emails. Password is stored encrypted on server.
      </p>

      {mailConfigMeta ? (
        <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800">
          Existing config found. Last updated:{' '}
          <strong>{new Date(mailConfigMeta.updatedAt).toLocaleString()}</strong>
        </div>
      ) : null}

      {message.text ? (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <form onSubmit={handleSave} className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-stable-700">SMTP Host</label>
          <input
            type="text"
            required
            value={config.smtpHost}
            onChange={(event) => setConfig((prev) => ({ ...prev, smtpHost: event.target.value }))}
            placeholder="example: smtp.gmail.com"
            className="w-full rounded-xl border border-stable-300 px-4 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-stable-700">SMTP Port</label>
          <input
            type="number"
            required
            value={config.smtpPort}
            onChange={(event) =>
              setConfig((prev) => ({
                ...prev,
                smtpPort: Number(event.target.value) || 465,
              }))
            }
            placeholder="example: 465"
            className="w-full rounded-xl border border-stable-300 px-4 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-stable-700">SMTP User</label>
          <input
            type="text"
            required
            value={config.smtpUser}
            onChange={(event) => setConfig((prev) => ({ ...prev, smtpUser: event.target.value }))}
            placeholder="example: your-email@domain.com"
            className="w-full rounded-xl border border-stable-300 px-4 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-stable-700">SMTP Password</label>
          <input
            type="password"
            required
            value={config.smtpPass}
            onChange={(event) => setConfig((prev) => ({ ...prev, smtpPass: event.target.value }))}
            placeholder="paste smtp/app password"
            className="w-full rounded-xl border border-stable-300 px-4 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-stable-700">From (Sender)</label>
          <input
            type="text"
            required
            value={config.smtpFrom}
            onChange={(event) => setConfig((prev) => ({ ...prev, smtpFrom: event.target.value }))}
            placeholder='example: Acme Team <noreply@acme.com>'
            className="w-full rounded-xl border border-stable-300 px-4 py-2.5 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-stable-500">
            Tip: write both name and email so recipients can identify your organization.
          </p>
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <input
            id="smtp-secure-checkbox"
            type="checkbox"
            checked={config.smtpSecure}
            onChange={(event) => setConfig((prev) => ({ ...prev, smtpSecure: event.target.checked }))}
            className="h-4 w-4 rounded border-stable-300"
          />
          <label htmlFor="smtp-secure-checkbox" className="text-sm text-stable-700">
            Use secure connection (recommended for port 465)
          </label>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-w-[180px] items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Mail Config'}
          </button>
        </div>
      </form>
    </MotionDiv>
  );
}
