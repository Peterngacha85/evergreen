import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Clock, ArrowRight, CheckCircle2, Hourglass, UserCheck } from 'lucide-react';
import Modal from './Modal';
import { getChangeRequests } from '../../api/changeRequests';
import { useAuth } from '../../context/AuthContext';

const APPROVER_ROLES = ['Chairperson', 'Secretary', 'Treasurer'];

const AccessRequiredModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [pendingRequest, setPendingRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    getChangeRequests({ status: 'pending' })
      .then(res => {
        const mine = res.data.find(r => r.requestedBy?._id === user._id);
        setPendingRequest(mine || null);
      })
      .catch(() => setPendingRequest(null))
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  const hasPending = !!pendingRequest;
  const requesterRole = pendingRequest?.requestedBy?.leaderRole;

  const approvedRoles = hasPending
    ? pendingRequest.votes
        .filter(v => v.approved && APPROVER_ROLES.includes(v.leader?.leaderRole))
        .map(v => v.leader.leaderRole)
    : [];

  const stillPending = APPROVER_ROLES.filter(
    r => r !== requesterRole && !approvedRoles.includes(r)
  );

  const waitingText =
    stillPending.length === 0
      ? 'All approvals received — refreshing soon.'
      : stillPending.length === 1
      ? `Waiting for ${stillPending[0]} to approve.`
      : `Waiting for ${stillPending.slice(0, -1).join(', ')} and ${stillPending[stillPending.length - 1]} to approve.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access Restricted">
      <div className="flex-col items-center text-center gap-4" style={{ padding: '10px 0' }}>

        {/* Icon */}
        <div style={{
          background: hasPending ? '#fef3c7' : '#fee2e2',
          color: hasPending ? '#d97706' : '#dc2626',
          width: 80, height: 80,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 4,
        }}>
          {hasPending ? <Clock size={40} /> : <ShieldAlert size={40} />}
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
          {hasPending ? 'Awaiting Approval' : 'Approval Required'}
        </h3>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Checking your request status…</p>
        ) : hasPending ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
              {waitingText}
            </p>

            {/* Per-role status cards */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {APPROVER_ROLES.map(role => {
                const isRequester = role === requesterRole;
                const didApprove = approvedRoles.includes(role);

                let bg, border, textColor, icon, label;
                if (isRequester) {
                  bg = 'var(--gray-50)'; border = 'var(--border)'; textColor = 'var(--text-muted)';
                  icon = <UserCheck size={15} />;
                  label = 'You (requester)';
                } else if (didApprove) {
                  bg = '#dcfce7'; border = '#86efac'; textColor = '#16a34a';
                  icon = <CheckCircle2 size={15} />;
                  label = 'Approved';
                } else {
                  bg = '#fef3c7'; border = '#fde68a'; textColor = '#d97706';
                  icon = <Hourglass size={15} />;
                  label = 'Pending';
                }

                return (
                  <div key={role} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: bg, border: `1px solid ${border}`,
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--gray-800)' }}>{role}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600, color: textColor }}>
                      {icon} {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.9rem', margin: 0 }}>
              You don't have an active change request. Submit one and the{' '}
              <strong>Chairperson, Secretary, and Treasurer</strong> will need to approve it before you can make edits.
            </p>

            <div style={{
              background: 'var(--gray-50)', padding: 14,
              borderRadius: 'var(--radius-lg)', width: '100%',
              border: '1px solid var(--border)', textAlign: 'left',
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>How it works</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Submit a request with a brief reason. All three office bearers must approve before your edit session is unlocked.
              </div>
            </div>
          </>
        )}

        <div className="flex-col gap-3 w-full" style={{ marginTop: 16 }}>
          <Link
            to="/leader/change-requests"
            className="btn btn-primary w-full justify-center"
            onClick={onClose}
            style={{ padding: '12px' }}
          >
            {hasPending ? 'View Request' : 'Submit a Request'} <ArrowRight size={18} />
          </Link>
          <button type="button" className="btn btn-ghost w-full justify-center" onClick={onClose}>
            Maybe Later
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default AccessRequiredModal;
