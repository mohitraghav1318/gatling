import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
    <article className="rounded-2xl border border-stable-300/80 bg-white/90 p-5 shadow-sm backdrop-blur">
      <h3 className="text-lg font-semibold text-stable-900">{title}</h3>
      <p className="mt-2 text-sm text-stable-600">{description}</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      >
        {buttonText}
      </button>
    </article>
  );
}

function DashboardModal({ title, subtitle, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-stable-950/45 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-lg rounded-2xl border border-stable-200 bg-white p-5 shadow-2xl"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MemberDashboardPage() {
  const navigate = useNavigate();
  const { organizationName, username } = useParams();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
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
  const [organizationLookup, setOrganizationLookup] = useState('');
  const [userLookup, setUserLookup] = useState('');

  const [organizationDetails, setOrganizationDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const applyOverviewData = useCallback((overviewData) => {
    setOverview(overviewData);
    setProfileForm({
      name: overviewData?.user?.name || '',
      bio: overviewData?.user?.bio || '',
      avatarUrl: overviewData?.user?.avatarUrl || '',
    });
    setUsernameValue(overviewData?.user?.username || '');
  }, []);

  const refreshCoreDashboard = useCallback(async () => {
    const [overviewResponse, activityResponse] = await Promise.all([
      dashboardApi.getOverview(),
      dashboardApi.getMyActivity(),
    ]);

    applyOverviewData(overviewResponse?.data || null);
    setActivity(activityResponse?.data?.activity || []);
  }, [applyOverviewData]);

  const organizations = useMemo(
    () => overview?.organizations || [],
    [overview],
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsBootstrapping(true);
        await refreshCoreDashboard();

        // Deep-link support: /dashboard/org/:organizationName auto-loads org panel.
        if (organizationName && isMounted) {
          const response =
            await dashboardApi.getOrganizationByName(organizationName);
          if (isMounted) {
            setOrganizationLookup(organizationName);
            setOrganizationDetails(response?.data || null);
          }
        }

        // Deep-link support: /dashboard/u/:username auto-loads user panel.
        if (username && isMounted) {
          const response = await dashboardApi.getUserByUsername(username);
          if (isMounted) {
            setUserLookup(username);
            setUserDetails(response?.data || null);
          }
        }
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
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [navigate, organizationName, refreshCoreDashboard, username]);

  async function handleCreateOrganization(event) {
    event.preventDefault();
    try {
      setIsSubmittingAction(true);
      const response = await dashboardApi.createOrganization(createOrgForm);
      await refreshCoreDashboard();
      setCreateOrgForm({ name: '', description: '' });
      setMessage({
        type: 'success',
        text: response?.message || 'Organization created successfully.',
      });

      if (response?.data?.route) {
        navigate(response.data.route);
      }
      setActiveModal(ACTION_MODAL.NONE);
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.response?.data?.message || 'Could not create organization.',
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
        organizationName: joinOrgName,
      });
      await refreshCoreDashboard();
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

      // Step 1: update profile fields first.
      await dashboardApi.updateProfile(profileForm);

      // Step 2: update username only when changed.
      let usernameRoute = null;
      if (overview?.user?.username !== usernameValue) {
        const usernameResponse = await dashboardApi.updateUsername({
          username: usernameValue,
        });
        usernameRoute = usernameResponse?.data?.route || null;
      }

      await refreshCoreDashboard();

      setMessage({
        type: 'success',
        text: 'User details updated successfully.',
      });

      setActiveModal(ACTION_MODAL.NONE);

      // If backend gives canonical username route, use it.
      if (usernameRoute) {
        navigate(usernameRoute);
      } else if (usernameValue) {
        navigate(`${APP_ROUTES.dashboardUserBase}/${usernameValue}`);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.response?.data?.message ||
          'Could not update user details. Please recheck your values.',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleOrganizationLookup(event) {
    event.preventDefault();
    try {
      const response =
        await dashboardApi.getOrganizationByName(organizationLookup);
      setOrganizationDetails(response?.data || null);
      setMessage({ type: 'success', text: 'Organization loaded.' });
    } catch (error) {
      setOrganizationDetails(null);
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Organization lookup failed.',
      });
    }
  }

  async function handleUserLookup(event) {
    event.preventDefault();
    try {
      const response = await dashboardApi.getUserByUsername(userLookup);
      setUserDetails(response?.data || null);
      setMessage({ type: 'success', text: 'User profile loaded.' });
    } catch (error) {
      setUserDetails(null);
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'User lookup failed.',
      });
    }
  }

  if (isBootstrapping && !overview) {
    return (
      <main className="page-content mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-stable-300/80 bg-white/90 p-6 text-center shadow-sm backdrop-blur">
          <h1 className="text-2xl font-bold text-stable-900">
            Loading Dashboard
          </h1>
          <p className="mt-2 text-stable-600">
            Fetching your latest profile and activity...
          </p>
        </section>
      </main>
    );
  }

  return (
    <MotionMain
      className="page-content mx-auto w-full max-w-5xl px-4 py-7 sm:px-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <MotionSection
        className="rounded-3xl border border-stable-300/80 bg-white/90 p-5 shadow-sm backdrop-blur md:p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-stable-500">
          Centered Focused UI
        </p>
        <h1 className="mt-2 text-3xl font-bold text-stable-900">
          Member Dashboard
        </h1>
        <p className="mt-2 text-sm text-stable-600 md:text-base">
          This page is protected by your auth token and talks to the backend
          dashboard APIs.
        </p>

        <AuthMessage type={message.type} text={message.text} />

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-stable-300/80 bg-white p-4">
            <p className="text-xs text-stable-500">Logged in as</p>
            <p className="mt-1 text-lg font-semibold text-stable-900">
              {overview?.user?.name}
            </p>
            <p className="text-sm text-stable-600">{overview?.user?.email}</p>
            <p className="mt-2 text-sm text-stable-700">
              Route key: <strong>{overview?.user?.username}</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-stable-300/80 bg-white p-4">
            <p className="text-xs text-stable-500">Quick navigation</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                className="rounded-lg border border-stable-300 bg-white px-3 py-1.5 text-sm font-medium text-stable-800 hover:bg-stable-100"
                to={APP_ROUTES.home}
              >
                Home
              </Link>
              {overview?.user?.username ? (
                <Link
                  className="rounded-lg border border-stable-300 bg-white px-3 py-1.5 text-sm font-medium text-stable-800 hover:bg-stable-100"
                  to={`${APP_ROUTES.dashboardUserBase}/${overview.user.username}`}
                >
                  My /u route
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </MotionSection>

      <section className="mt-4 grid gap-3 md:grid-cols-3">
        <ActionCard
          title="Update User Details"
          description="Edit name, bio, avatar URL, and username in one popup form."
          buttonText="Open User Editor"
          onOpen={() => setActiveModal(ACTION_MODAL.UPDATE_USER)}
        />
        <ActionCard
          title="Create Organization"
          description="Create a new organization and auto-open its dashboard route."
          buttonText="Create New Org"
          onOpen={() => setActiveModal(ACTION_MODAL.CREATE_ORG)}
        />
        <ActionCard
          title="Join Organization"
          description="Join an organization by slug and jump directly to its page."
          buttonText="Join As Member"
          onOpen={() => setActiveModal(ACTION_MODAL.JOIN_ORG)}
        />
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-stable-300/80 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stable-900">
            Your Organizations
          </h2>
          {organizations.length ? (
            <ul className="mt-3 space-y-2">
              {organizations.map((org) => (
                <li
                  key={org.id}
                  className="rounded-xl border border-stable-300/80 bg-white p-3"
                >
                  <p className="font-semibold text-stable-900">{org.name}</p>
                  <p className="text-sm text-stable-600">Role: {org.role}</p>
                  <Link
                    className="mt-2 inline-flex rounded-lg bg-stable-100 px-3 py-1.5 text-sm font-semibold text-stable-800 hover:bg-stable-200"
                    to={`${APP_ROUTES.dashboardOrgBase}/${org.slug}`}
                  >
                    Open /dashboard/org/{org.slug}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stable-600">No organizations yet.</p>
          )}
        </article>

        <article className="rounded-2xl border border-stable-300/80 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stable-900">Route Lookup</h2>
          <p className="mt-1 text-sm text-stable-600">
            Use backend route patterns directly to inspect org and user pages.
          </p>

          <form
            className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"
            onSubmit={handleOrganizationLookup}
          >
            <input
              className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
              value={organizationLookup}
              onChange={(event) => setOrganizationLookup(event.target.value)}
              placeholder="organization slug"
            />
            <button
              type="submit"
              className="rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm font-semibold text-stable-800 hover:bg-stable-100"
            >
              Load Org
            </button>
          </form>

          <form
            className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]"
            onSubmit={handleUserLookup}
          >
            <input
              className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
              value={userLookup}
              onChange={(event) => setUserLookup(event.target.value)}
              placeholder="username"
            />
            <button
              type="submit"
              className="rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm font-semibold text-stable-800 hover:bg-stable-100"
            >
              Load User
            </button>
          </form>

          {organizationDetails ? (
            <div className="mt-3 rounded-xl border border-stable-300/80 bg-white p-3">
              <p className="text-sm font-semibold text-stable-900">
                Organization
              </p>
              <p className="mt-1 text-sm text-stable-800">
                {organizationDetails.organization?.name}
              </p>
              <p className="text-xs text-stable-500">
                /{organizationDetails.organization?.slug}
              </p>
            </div>
          ) : null}

          {userDetails ? (
            <div className="mt-3 rounded-xl border border-stable-300/80 bg-white p-3">
              <p className="text-sm font-semibold text-stable-900">User</p>
              <p className="mt-1 text-sm text-stable-800">
                {userDetails.user?.name}
              </p>
              <p className="text-xs text-stable-500">
                {userDetails.user?.username}
              </p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-stable-300/80 bg-white/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stable-900">
          Recent Activity
        </h2>
        {activity.length ? (
          <ul className="mt-3 space-y-2">
            {activity.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-stable-300/80 bg-white p-3"
              >
                <p className="font-semibold text-stable-900">
                  {item.actionType}
                </p>
                <p className="text-sm text-stable-700">{item.message}</p>
                <p className="mt-1 text-xs text-stable-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stable-600">No activity yet.</p>
        )}
      </section>

      {activeModal === ACTION_MODAL.UPDATE_USER ? (
        <DashboardModal
          title="Update User Details"
          subtitle="One form for profile + username updates"
          onClose={() => setActiveModal(ACTION_MODAL.NONE)}
        >
          <form className="space-y-3" onSubmit={handleUpdateAllUserDetails}>
            <div>
              <label
                className="mb-1 block text-sm font-semibold text-stable-700"
                htmlFor="modal-user-name"
              >
                Name
              </label>
              <input
                id="modal-user-name"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-semibold text-stable-700"
                htmlFor="modal-user-bio"
              >
                Bio
              </label>
              <textarea
                id="modal-user-bio"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
                rows={3}
                value={profileForm.bio}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    bio: event.target.value,
                  }))
                }
                placeholder="Tell people about yourself"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-semibold text-stable-700"
                htmlFor="modal-user-avatar"
              >
                Avatar URL
              </label>
              <input
                id="modal-user-avatar"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
                value={profileForm.avatarUrl}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    avatarUrl: event.target.value,
                  }))
                }
                placeholder="https://example.com/photo.png"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-semibold text-stable-700"
                htmlFor="modal-user-username"
              >
                Username
              </label>
              <input
                id="modal-user-username"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
                value={usernameValue}
                onChange={(event) => setUsernameValue(event.target.value)}
                placeholder="lowercase_letters_or_numbers"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAction}
              className="w-full rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingAction ? 'Saving...' : 'Save User Details'}
            </button>
          </form>
        </DashboardModal>
      ) : null}

      {activeModal === ACTION_MODAL.CREATE_ORG ? (
        <DashboardModal
          title="Create Organization"
          subtitle="Creates org and redirects to its dashboard path"
          onClose={() => setActiveModal(ACTION_MODAL.NONE)}
        >
          <form className="space-y-3" onSubmit={handleCreateOrganization}>
            <div>
              <label
                className="mb-1 block text-sm font-semibold text-stable-700"
                htmlFor="modal-org-name"
              >
                Organization Name
              </label>
              <input
                id="modal-org-name"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
                value={createOrgForm.name}
                onChange={(event) =>
                  setCreateOrgForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Acme Team"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-semibold text-stable-700"
                htmlFor="modal-org-description"
              >
                Description
              </label>
              <textarea
                id="modal-org-description"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
                rows={3}
                value={createOrgForm.description}
                onChange={(event) =>
                  setCreateOrgForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="What this organization does"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAction}
              className="w-full rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingAction ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        </DashboardModal>
      ) : null}

      {activeModal === ACTION_MODAL.JOIN_ORG ? (
        <DashboardModal
          title="Join Organization"
          subtitle="Join as member using an organization slug"
          onClose={() => setActiveModal(ACTION_MODAL.NONE)}
        >
          <form className="space-y-3" onSubmit={handleJoinOrganization}>
            <div>
              <label
                className="mb-1 block text-sm font-semibold text-stable-700"
                htmlFor="modal-org-join-name"
              >
                Organization Slug
              </label>
              <input
                id="modal-org-join-name"
                className="w-full rounded-xl border border-stable-300 bg-white px-3 py-2 text-sm text-stable-900 outline-none ring-teal-200 focus:ring"
                value={joinOrgName}
                onChange={(event) => setJoinOrgName(event.target.value)}
                placeholder="my-organization"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAction}
              className="w-full rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/30 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingAction ? 'Joining...' : 'Join Organization'}
            </button>
          </form>
        </DashboardModal>
      ) : null}
    </MotionMain>
  );
}
