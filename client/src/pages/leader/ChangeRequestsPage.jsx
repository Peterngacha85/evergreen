import { useEffect, useState } from 'react';
import { getChangeRequests, createChangeRequest, voteOnChangeRequest, validateSession } from '../../api/changeRequests';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { Check, X, ShieldAlert, Plus, Info } from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

const ChangeRequestsPage = () => {
  const { user, isSuperAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const [r, s] = await Promise.all([
        getChangeRequests(),
        !isSuperAdmin ? validateSession().catch(() => ({ data: { hasSession: false } })) : Promise.resolve({ data: { hasSession: true } })
      ]);
      setRequests(r.data);
      if (!isSuperAdmin) setActiveSession(s.data.changeRequest || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createChangeRequest({ reason });
      toast.success('Access request submitted to other leaders');
      setIsModalOpen(false);
      setReason('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id, approved) => {
    try {
      await voteOnChangeRequest(id, { approved });
      toast.success(`Vote recorded: ${approved ? 'Approved' : 'Rejected'}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record vote');
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Change Requests</h1>
          <p className="page-subtitle">Approve peer actions or request access yourself</p>
        </div>
        {!isSuperAdmin && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Request Edit Access
          </button>
        )}
      </div>

      {!isSuperAdmin && activeSession && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: '#15803d' }}>
          <ShieldAlert size={24} />
          <div>
            <div style={{ fontWeight: 700 }}>You have active edit access</div>
            <div style={{ fontSize: '0.85rem' }}>Your session expires at {format(new Date(activeSession.expiresAt), 'HH:mm')}. You can now make changes across the portal.</div>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: '#1d4ed8' }}>
          <Info size={24} />
          <div>
            <div style={{ fontWeight: 700 }}>Super Admin bypass active</div>
            <div style={{ fontSize: '0.85rem' }}>You do not need to request access to make changes.</div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Requested By</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Votes</th>
                <th>Your Vote</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No requests found</div></div></td></tr>
              ) : requests.map(req => {
                const myVote = req.votes.find(v => v.leader?._id === user?._id);
                const canVote = req.status === 'pending' && req.requestedBy?._id !== user?._id && !myVote && !isSuperAdmin;

                return (
                  <tr key={req._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{format(new Date(req.createdAt), 'dd MMM yyyy')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{format(new Date(req.createdAt), 'HH:mm')}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{req.requestedBy?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.requestedBy?.leaderRole}</div>
                    </td>
                    <td style={{ maxWidth: 300, fontSize: '0.88rem' }}>{req.reason}</td>
                    <td><StatusBadge status={req.status} /></td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--green-600)', fontWeight: 600 }}>{req.votes.filter(v => v.approved).length}</span> Yes,{' '}
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>{req.votes.filter(v => !v.approved).length}</span> No
                      </div>
                    </td>
                    <td>
                      {canVote ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleVote(req._id, true)} className="btn btn-sm btn-outline" style={{ padding: 6 }} title="Approve"><Check size={16} /></button>
                          <button onClick={() => handleVote(req._id, false)} className="btn btn-sm btn-danger" style={{ padding: 6 }} title="Reject"><X size={16} /></button>
                        </div>
                      ) : myVote ? (
                        <span className={`badge ${myVote.approved ? 'badge-green' : 'badge-red'}`}>
                          {myVote.approved ? 'Approved' : 'Rejected'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Edit Access">
        <form onSubmit={handleCreateRequest} className="flex-col gap-4">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            To modify data (add members, record contributions, etc.), you must briefly describe what you intend to do. All other active leaders must approve this request.
          </p>
          <div className="form-group">
            <label className="form-label">Reason for access</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Recording monthly contributions for June and updating 2 member profiles."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChangeRequestsPage;
