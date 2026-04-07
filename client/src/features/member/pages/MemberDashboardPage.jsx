import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.api';
import { APP_ROUTES } from '../../../shared/config/routes';
import { clearAuthToken } from '../../../shared/utils/authSession';
import AuthMessage from '../../auth/components/AuthMessage';

const MotionMain = motion.main;
const MotionSection = motion.section;

const ACTION_MODAL = {
  NONE: null,
  UPDATE_USER: 'UPDATE_USER',
  CREATE_ORG: 'CREATE_ORG',
  JOIN_ORG: 'JOIN_ORG',
};

function ActionCard({ title, description, buttonText, onOpen }) {
  return (
    <article className="rounded-2xl border border-stable-200 bg-white/90 p-6 shadow-md backdrop-blur">
      <h3 className="text-lg font-bold text-stable-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stable-600">{description}</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-700"
      >
        {buttonText}
      </button>
    </article>
  );
}

function DashboardModal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stable-950/45 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-stable-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stable-900">{title}</h2>
            <p className="mt-1 text-sm text-stable-600">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stable-300 px-2.5 py-1.5 text-xs font-semibold text-stable-700 hover:bg-stable-100"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default function MemberDashboardPage() {
  const navigate = useNavigate();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [overview, setOverview] = useState(null);
  const [message, setMessage] = useState({ type: 'info', text: '' });
  const [activeModal, setActiveModal] = useState(ACTION_MODAL.NONE);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
  });
  const [usernameValue, setUsernameValue] = useState('');
  const [createOrgForm, setCreateOrgForm] = useState({
    name: '',
    description: '',
  });
  const [joinOrgName, setJoinOrgName] = useState('');

  const applyOverviewData = useCallback((overviewData) => {
    setOverview(overviewData);

    // NOTE FOR BEGINNERS:
    // We pre-fill the update form with existing user data.
    setProfileForm({
      name: overviewData?.user?.name || '',
      bio: overviewData?.user?.bio || '',
      avatarUrl: overviewData?.user?.avatarUrl || '',
    });
    setUsernameValue(overviewData?.user?.username || '');
  }, []);

  const refreshOverview = useCallback(async () => {
    const response = await dashboardApi.getOverview();
    applyOverviewData(response?.data || null);
  }, [applyOverviewData]);

  const organizations = useMemo(() => overview?.organizations || [], [overview]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsBootstrapping(true);
        await refreshOverview();
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          clearAuthToken();
          navigate(APP_ROUTES.login, { replace: true });
          return;
        }

        if (isMounted) {
          setMessage({
            type: 'error',
            text: error?.response?.data?.message || 'Failed to load dashboard.',
          });
        }
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [navigate, refreshOverview]);

  async function handleCreateOrganization(event) {
    event.preventDefault();

    try {
      setIsSubmittingAction(true);
      const response = await dashboardApi.createOrganization({
        name: createOrgForm.name.trim(),
        description: createOrgForm.description.trim(),
      });

      await refreshOverview();
      setCreateOrgForm({ name: '', description: '' });
      setMessage({
        type: 'success',
        text: response?.message || 'Organization created successfully.',
      });

      // Backend gives the correct route, so we follow it directly.
      if (response?.data?.route) {
        navigate(response.data.route);
      }

      setActiveModal(ACTION_MODAL.NONE);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not create organization.',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleJoinOrganization(event) {
    event.preventDefault();

    try {
      setIsSubmittingAction(true);
      const response = await dashboardApi.joinOrganization({
        organizationName: joinOrgName.trim(),
      });

      await refreshOverview();
      setJoinOrgName('');
      setMessage({
        type: 'success',
        text: response?.message || 'Joined organization successfully.',
      });

      if (response?.data?.route) {
        navigate(response.data.route);
      }

      setActiveModal(ACTION_MODAL.NONE);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not join organization.',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleUpdateAllUserDetails(event) {
    event.preventDefault();

    try {
      setIsSubmittingAction(true);

      await dashboardApi.updateProfile(profileForm);

      let usernameRoute = null;
      if (overview?.user?.username !== usernameValue) {
        const usernameResponse = await dashboardApi.updateUsername({
          username: usernameValue,
        });
        usernameRoute = usernameResponse?.data?.route || null;
      }

      await refreshOverview();

      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setActiveModal(ACTION_MODAL.NONE);

      if (usernameRoute) {
        navigate(usernameRoute);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.response?.data?.message ||
          'Could not update user details. Please check your values.',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  }

  if (isBootstrapping && !overview) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-stable-300/80 bg-white/90 p-6 text-center shadow-sm backdrop-blur">
          <h1 className="text-2xl font-bold text-stable-900">Loading Dashboard</h1>
          <p className="mt-2 text-stable-600">Getting your organization data...</p>
        </section>
      </main>
    );
  }

  return (
    <MotionMain
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <MotionSection
        className="mb-8 rounded-[2rem] border border-stable-200 bg-white/90 p-6 shadow-xl shadow-stable-200/40 backdrop-blur-xl md:p-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-600">
              Workspace Overview
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-stable-900">
              Welcome, {overview?.user?.name?.split(' ')[0] || 'Member'}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-stable-600">
              Create or join organizations from here. Then open each organization
              dashboard to manage members and mail settings.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-stable-200 bg-stable-50 p-4 shadow-inner">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-primary-100 text-2xl font-extrabold text-primary-700">
              {overview?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold text-stable-900">{overview?.user?.name}</p>
              <p className="text-xs text-stable-500">{overview?.user?.email}</p>
              <button
                type="button"
                onClick={() => setActiveModal(ACTION_MODAL.UPDATE_USER)}
                className="mt-2 rounded-lg bg-stable-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stable-700"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <AuthMessage type={message.type} text={message.text} />
        </div>
      </MotionSection>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <ActionCard
          title="Create Organization"
          description="Tip: use a simple, unique name. We convert it to a URL slug automatically."
          buttonText="Create New Organization"
          onOpen={() => setActiveModal(ACTION_MODAL.CREATE_ORG)}
        />
        <ActionCard
          title="Join Organization"
          description="Tip: paste the exact organization slug (for example: acme-marketing)."
          buttonText="Join Organization"
          onOpen={() => setActiveModal(ACTION_MODAL.JOIN_ORG)}
        />
      </section>

      <section>
        <article className="rounded-2xl border border-stable-200 bg-white/90 p-6 shadow-md backdrop-blur">
          <h2 className="text-xl font-bold text-stable-900">Your Organizations</h2>
          <p className="mt-1 text-sm text-stable-500">
            Open an organization dashboard, then click settings to manage members and mail config.
          </p>

          {organizations.length ? (
            <ul className="mt-4 grid gap-4">
              {organizations.map((org) => {
                const canOpenSettings = ['owner', 'admin'].includes(org.role);

                return (
                  <li
                    key={org.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-stable-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-stable-900">
                        {org.name}
                        <span className="rounded-full bg-stable-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-stable-600">
                          {org.role}
                        </span>
                      </h3>
                      <p className="mt-1 text-sm text-stable-500">/{org.slug}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`${APP_ROUTES.dashboardOrgBase}/${org.slug}`}
                        className="inline-flex items-center justify-center rounded-lg bg-stable-100 px-4 py-2 text-sm font-semibold text-stable-700 hover:bg-stable-200"
                      >
                        Open Dashboard
                      </Link>

                      {canOpenSettings ? (
                        <Link
                          to={`${APP_ROUTES.dashboardOrgBase}/${org.slug}/settings`}
                          className="inline-flex items-center justify-center rounded-lg bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
                        >
                          Settings
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-stable-300 bg-stable-50/60 p-8 text-center">
              <p className="font-medium text-stable-700">No organizations yet.</p>
              <p className="mt-1 text-sm text-stable-500">
                Start by creating one, or join with a slug shared by your owner/admin.
              </p>
            </div>
          )}
        </article>
      </section>

      {activeModal === ACTION_MODAL.UPDATE_USER ? (
        <DashboardModal
          title="Update User Details"
          subtitle="Edit your profile details."
          onClose={() => setActiveModal(ACTION_MODAL.NONE)}
        >
          <form className="space-y-3" onSubmit={handleUpdateAllUserDetails}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stable-700" htmlFor="modal-user-name">
                Name
              </label>
              <input
                id="modal-user-name"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none focus:ring-2 focus:ring-primary-500"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="example: Alex Johnson"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-stable-700" htmlFor="modal-user-bio">
                Bio
              </label>
              <textarea
                id="modal-user-bio"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                value={profileForm.bio}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
                }
                placeholder="example: Building internal growth campaigns"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-stable-700" htmlFor="modal-user-avatar">
                Avatar URL
              </label>
              <input
                id="modal-user-avatar"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none focus:ring-2 focus:ring-primary-500"
                value={profileForm.avatarUrl}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, avatarUrl: event.target.value }))
                }
                placeholder="example: https://site.com/photo.png"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-stable-700" htmlFor="modal-user-username">
                Username
              </label>
              <input
                id="modal-user-username"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none focus:ring-2 focus:ring-primary-500"
                value={usernameValue}
                onChange={(event) => setUsernameValue(event.target.value)}
                placeholder="example: alexjohnson"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAction}
              className="w-full rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingAction ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </DashboardModal>
      ) : null}

      {activeModal === ACTION_MODAL.CREATE_ORG ? (
        <DashboardModal
          title="Create Organization"
          subtitle="This creates your organization and makes you owner."
          onClose={() => setActiveModal(ACTION_MODAL.NONE)}
        >
          <form className="space-y-3" onSubmit={handleCreateOrganization}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stable-700" htmlFor="modal-org-name">
                Organization Name
              </label>
              <input
                id="modal-org-name"
                required
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none focus:ring-2 focus:ring-primary-500"
                value={createOrgForm.name}
                onChange={(event) =>
                  setCreateOrgForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="example: Acme Growth Team"
              />
              <p className="mt-1 text-xs text-stable-500">
                Tip: use a clear name. We convert it to a URL slug for routing.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-stable-700" htmlFor="modal-org-description">
                Description
              </label>
              <textarea
                id="modal-org-description"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                value={createOrgForm.description}
                onChange={(event) =>
                  setCreateOrgForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="example: Handles lifecycle and product marketing campaigns"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAction}
              className="w-full rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingAction ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        </DashboardModal>
      ) : null}

      {activeModal === ACTION_MODAL.JOIN_ORG ? (
        <DashboardModal
          title="Join Organization"
          subtitle="Paste organization slug shared by the owner/admin."
          onClose={() => setActiveModal(ACTION_MODAL.NONE)}
        >
          <form className="space-y-3" onSubmit={handleJoinOrganization}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stable-700" htmlFor="modal-org-join-name">
                Organization Slug
              </label>
              <input
                id="modal-org-join-name"
                required
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none focus:ring-2 focus:ring-primary-500"
                value={joinOrgName}
                onChange={(event) => setJoinOrgName(event.target.value)}
                placeholder="example: acme-growth-team"
              />
              <p className="mt-1 text-xs text-stable-500">
                Tip: slug is the text after /dashboard/org/ in URL.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmittingAction}
              className="w-full rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingAction ? 'Joining...' : 'Join Organization'}
            </button>
          </form>
        </DashboardModal>
      ) : null}
    </MotionMain>
  );
}
