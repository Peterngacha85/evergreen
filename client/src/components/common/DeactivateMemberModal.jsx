import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { deactivateMember } from '../../api/members';

// Confirms deactivating `member` for non-payment. Pass `campaign` when it is
// done from a campaign page, so what they owe on it is recorded.
const DeactivateMemberModal = ({ member, campaign, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => { setReason(''); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await deactivateMember(member._id, { reason, campaignId: campaign?._id });
      toast.success(`${member.name} deactivated`);
      setReason('');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={!!member} onClose={handleClose} title={`Deactivate — ${member?.name || ''}`} maxWidth="440px">
      <form onSubmit={handleSubmit} className="flex-col gap-4">
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#991b1b' }}>
          <strong>{member?.name}</strong> will not be able to log in or access their dashboard until a leader reactivates them.
          When they try to log in they will be shown the reason below.
        </div>
        <div className="form-group">
          <label className="form-label">Reason (Optional)</label>
          <input type="text" className="form-input" value={reason} onChange={e => setReason(e.target.value)}
            placeholder={campaign ? `e.g. Did not contribute to "${campaign.title}"` : 'e.g. No contribution for over 31 days'} />
        </div>
        <div className="flex justify-between" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn" style={{ background: '#dc2626', color: 'white' }} disabled={submitting}>
            {submitting ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DeactivateMemberModal;
