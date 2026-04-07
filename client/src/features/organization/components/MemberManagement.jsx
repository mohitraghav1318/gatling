import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { organizationApi } from '../api/organization.api';

const MotionDiv = motion.div;
const MotionTr = motion.tr;

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

export default function MemberManagement({
  organizationName,
  currentUserId,
  currentUserRole,
}) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });

  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('member');
  const [isAdding, setIsAdding] = useState(false);

  const [processingMembershipId, setProcessingMembershipId] = useState('');

  // NOTE FOR BEGINNERS:
  // We keep this function in useCallback so React doesn't recreate it every render.
  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await organizationApi.listMembers(organizationName);
      setMembers(res?.data?.members || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load members.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationName]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleAddMember(event) {
    event.preventDefault();
    if (!addEmail.trim()) return;

    try {
      setIsAdding(true);
      setBanner({ type: '', text: '' });

      // Backend expects email/username + role.
      await organizationApi.addMember(organizationName, {
        email: addEmail.trim(),
        role: addRole,
      });

      setAddEmail('');
      setAddRole('member');
      setBanner({ type: 'success', text: 'Member added successfully.' });
      await fetchMembers();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to add member.',
      });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleUpdateRole(membershipId, nextRole) {
    try {
      setProcessingMembershipId(membershipId);
      setBanner({ type: '', text: '' });
      await organizationApi.updateMemberRole(organizationName, membershipId, {
        role: nextRole,
      });
      setBanner({ type: 'success', text: 'Member role updated.' });
      await fetchMembers();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to update role.',
      });
    } finally {
      setProcessingMembershipId('');
    }
  }

  async function handleRemoveMember(membershipId) {
    const confirmed = window.confirm(
      'Remove this member from the organization?',
    );
    if (!confirmed) return;

    try {
      setProcessingMembershipId(membershipId);
      setBanner({ type: '', text: '' });
      await organizationApi.removeMember(organizationName, membershipId);
      setBanner({ type: 'success', text: 'Member removed.' });
      await fetchMembers();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to remove member.',
      });
    } finally {
      setProcessingMembershipId('');
    }
  }

  const roleColors = {
    owner: 'bg-purple-100 text-purple-700 border-purple-200',
    admin: 'bg-blue-100 text-blue-700 border-blue-200',
    member: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner className="w-8 h-8 text-primary-600" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <MotionDiv
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-stable-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-bold text-stable-900">Add Member</h3>
        <p className="mt-1 text-sm text-stable-500">
          Tip: add by email of an existing account. Admins can only add{' '}
          <strong>member</strong> role.
        </p>

        <form
          onSubmit={handleAddMember}
          className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]"
        >
          <input
            type="email"
            required
            value={addEmail}
            onChange={(event) => setAddEmail(event.target.value)}
            placeholder="example: team.member@company.com"
            className="w-full rounded-xl border border-stable-300 px-4 py-2.5 text-sm text-stable-900 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />

          <select
            value={addRole}
            onChange={(event) => setAddRole(event.target.value)}
            className="w-full rounded-xl border border-stable-300 bg-white px-4 py-2.5 text-sm text-stable-900 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          >
            <option value="member">Member</option>
            {currentUserRole === 'owner' && <option value="admin">Admin</option>}
          </select>

          <button
            type="submit"
            disabled={isAdding}
            className="min-w-[130px] rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdding ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </MotionDiv>

      {banner.text ? (
        <div
          className={`rounded-xl border p-3 text-sm ${
            banner.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      <MotionDiv
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-stable-200 bg-white shadow-sm"
      >
        <div className="border-b border-stable-100 px-6 py-4">
          <h4 className="text-base font-bold text-stable-900">Organization Members</h4>
          <p className="text-sm text-stable-500">
            Tip: owner can manage admin/member roles; admin can manage only members.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-stable-200 bg-stable-50 text-sm text-stable-500">
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stable-100">
              {members.map((membership) => {
                const userId = membership?.user?.id;
                const membershipId = membership?.membershipId;
                const isSelf = String(userId) === String(currentUserId);
                const isProcessing =
                  processingMembershipId &&
                  String(processingMembershipId) === String(membershipId);

                // Permission hints mirrored from backend rules.
                const canManage =
                  currentUserRole === 'owner'
                    ? membership.role !== 'owner'
                    : membership.role === 'member';

                return (
                  <MotionTr
                    key={membershipId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-stable-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                          {(membership?.user?.name || membership?.user?.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-stable-900">
                            {membership?.user?.name || 'Unnamed User'}
                            {isSelf ? (
                              <span className="ml-2 rounded-full bg-stable-200 px-2 py-0.5 text-xs font-medium text-stable-700">
                                You
                              </span>
                            ) : null}
                          </p>
                          <p className="text-sm text-stable-500">{membership?.user?.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${roleColors[membership.role]}`}
                      >
                        {membership.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isProcessing ? <Spinner className="w-5 h-5 text-stable-500" /> : null}

                        {!isProcessing && canManage ? (
                          <>
                            {currentUserRole === 'owner' ? (
                              <select
                                value={membership.role}
                                onChange={(event) =>
                                  handleUpdateRole(membershipId, event.target.value)
                                }
                                className="rounded-lg border border-stable-300 bg-white px-3 py-1.5 text-sm"
                              >
                                <option value="member">member</option>
                                <option value="admin">admin</option>
                              </select>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleRemoveMember(membershipId)}
                              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </>
                        ) : null}

                        {!isProcessing && !canManage ? (
                          <span className="text-xs italic text-stable-400">No actions</span>
                        ) : null}
                      </div>
                    </td>
                  </MotionTr>
                );
              })}
            </tbody>
          </table>

          {members.length === 0 ? (
            <p className="p-6 text-center text-sm text-stable-500">No members found.</p>
          ) : null}
        </div>
      </MotionDiv>
    </div>
  );
}
