import Modal from './Modal';
import { UserX } from 'lucide-react';
import { format } from 'date-fns';

// Shown on the login page when a deactivated member tries to log in.
// `notice` is the server's ACCOUNT_DEACTIVATED response.
const AccountDeactivatedModal = ({ notice, onClose }) => {
  const reasons = notice?.deactivation?.reasons || [];
  const name = notice?.deactivation?.name;

  return (
    <Modal isOpen={!!notice} onClose={onClose} title="Account Deactivated" maxWidth="440px">
      <div className="flex-col gap-4 items-center text-center" style={{ padding: '4px 0' }}>
        <div className="flex items-center justify-center"
          style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#dc2626' }}>
          <UserX size={30} />
        </div>

        <p style={{ color: 'var(--gray-600)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          {name ? <><strong>{name}</strong>, your</> : 'Your'} account is currently <strong style={{ color: '#dc2626' }}>deactivated</strong>, so you cannot log in or access your dashboard.
        </p>

        {reasons.length > 0 && (
          <div style={{ width: '100%', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', textAlign: 'left', fontSize: '0.85rem', color: '#7f1d1d' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Reason</div>
            <ul style={{ margin: '0 0 0 18px', lineHeight: 1.6 }}>
              {reasons.map((r, i) => (
                <li key={i}>
                  {r.reason || 'Unpaid contribution'}
                  {r.amountOwed ? <> — <strong>₪ {r.amountOwed.toLocaleString()}</strong> outstanding</> : null}
                  {r.deactivatedAt && <span style={{ opacity: 0.75 }}> (since {format(new Date(r.deactivatedAt), 'dd MMM yyyy')})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p style={{ color: 'var(--gray-600)', lineHeight: 1.6, fontSize: '0.88rem' }}>
          Please pay any outstanding amount and contact a leader to have your account reactivated.
        </p>

        <button type="button" className="btn btn-primary w-full" onClick={onClose}>OK</button>
      </div>
    </Modal>
  );
};

export default AccountDeactivatedModal;
