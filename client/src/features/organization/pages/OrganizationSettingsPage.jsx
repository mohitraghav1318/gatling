import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardApi } from '../../member/api/dashboard.api';
import MemberManagement from '../components/MemberManagement';
import SmtpConfig from '../components/SmtpConfig';
import { APP_ROUTES } from '../../../shared/config/routes';

const MotionDiv = motion.div;

export default function OrganizationSettingsPage() {
  const { organizationName } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    async function loadOverview() {
      try {
        setIsLoading(true);
        const res = await dashboardApi.getOverview();
        if (res.data) setOverview(res.data);
      } catch {
        setError('Failed to load access permissions. Please try reloading.');
      } finally {
        setIsLoading(false);
      }
    }
    loadOverview();
  }, []);

  const currentUser = useMemo(() => overview?.user || null, [overview]);

  const currentOrgMembership = useMemo(() => {
    if (!overview || !overview.organizations) return null;
    return overview.organizations.find(
      (org) => org.slug === organizationName || org.name === organizationName,
    );
  }, [overview, organizationName]);

  const currentRole = currentOrgMembership?.role;

  // Protect route based on role
  useEffect(() => {
    if (
      !isLoading &&
      currentRole &&
      !['owner', 'admin'].includes(currentRole)
    ) {
      navigate(`${APP_ROUTES.dashboardOrgBase}/${organizationName}`, {
        replace: true,
      });
    }
  }, [isLoading, currentRole, navigate, organizationName]);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !currentOrgMembership) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full space-y-4">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="text-stable-600">
          {error || 'Organization not found or access denied.'}
        </p>
        <Link
          to={APP_ROUTES.dashboard}
          className="bg-primary-600 hover:bg-primary-700 px-6 py-2 rounded-xl text-white font-medium"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'members', label: 'Members' },
    // Only owners can see the SMTP tab
    ...(currentRole === 'owner' ? [{ id: 'smtp', label: 'SMTP Config' }] : []),
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stable-200 pb-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-stable-900 tracking-tight">
            Organization Settings
          </h1>
          <p className="text-stable-500 mt-2 text-lg">
            Manage your team and connections for{' '}
            <span className="font-bold text-primary-700">
              {currentOrgMembership.name}
            </span>
            .
          </p>
        </div>
        <Link
          to={`${APP_ROUTES.dashboardOrgBase}/${organizationName}`}
          className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 bg-white border border-stable-300 rounded-xl font-medium text-stable-700 hover:bg-stable-50 transition-colors shadow-sm"
        >
          &larr; Back to Dashboard
        </Link>
      </MotionDiv>

      {/* Custom Tab Navigation */}
      <div className="flex space-x-1 border-b border-stable-200 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-3 font-medium text-sm transition-colors block whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-primary-600 hover:text-primary-700'
                : 'text-stable-500 hover:text-stable-700 hover:bg-stable-50 rounded-t-xl'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <MotionDiv
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <MotionDiv
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full relative"
          >
            {activeTab === 'members' && (
              <MemberManagement
                organizationName={organizationName}
                currentUserId={currentUser?._id || currentUser?.id}
                currentUserRole={currentRole}
              />
            )}

            {activeTab === 'smtp' && currentRole === 'owner' && (
              <SmtpConfig organizationName={organizationName} />
            )}
          </MotionDiv>
        </AnimatePresence>
      </div>
    </div>
  );
}
