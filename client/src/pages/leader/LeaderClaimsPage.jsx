import { useEffect, useState } from 'react';
import { getClaims, createClaim, updateClaimStatus, deleteClaim } from '../../api/claims';
import { getMembers } from '../../api/members';
import { validateSession } from '../../api/changeRequests';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { Plus, CheckCircle, XCircle, DollarSign, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const CLAIM_TYPES = ['Medical', 'Bereavement', 'Emergency', 'Education', 'Other'];

const LeaderClaimsPage = () => {
  const { isSuperAdmin } = useAuth();
  const [claims, setClaims] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // New Claim Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ memberId: '', title: '', description: '', amount: '', claimType: CLAIM_TYPES[0], notes: '' });
  const [submitting, setSubmitting] = useState(false);

  // Status Update Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeClaim, setActiveClaim] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: 'approved', notes: '' });

  const fetchData = async () => {
    try {
      const [c, m, s] = await Promise.all([
        getClaims(),
        getMembers(),
        !isSuperAdmin ? validateSession().catch(() => ({ data: { hasSession: false } })) : Promise.resolve({ data: { hasSession: true } })
      ]);
      setClaims(c.data);
      setMembers(m.data);
      setHasAccess(s.data.hasSession);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenCreateModal = () => {
    if (!hasAccess && !isSuperAdmin) return toast.error('You need an approved change request session.');
    setFormData({ memberId: '', title: '', description: '', amount: '', claimType: CLAIM_TYPES[0], notes: '' });
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createClaim({ ...formData, amount: Number(formData.amount) });
      toast.success('Claim recorded');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatusModal = (claim) => {
    if (!hasAccess && !isSuperAdmin) return toast.error('You need an approved change request session.');
    setActiveClaim(claim);
    setStatusUpdate({ status: claim.status === 'pending' ? 'approved' : 'paid', notes: claim.notes || '' });
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateClaimStatus(activeClaim._id, statusUpdate);
      toast.success('Claim status updated');
      setIsStatusModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!hasAccess && !isSuperAdmin) return toast.error('You need an approved change request session.');
    if (!window.confirm('Delete this claim record?')) return;
    try {
      await deleteClaim(id);
      toast.success('Record deleted');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">Manage Claims</h1></div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal} disabled={!hasAccess && !isSuperAdmin}><Plus size={18} /> Record Claim</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Claim Info</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state">No claims recorded.</div></td></tr>
              ) : claims.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.member?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.member?.idNumber}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.title} <span className="badge badge-gray ml-2">{c.claimType}</span></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description?.substring(0, 50)}...</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>KES {c.amount.toLocaleString()}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenStatusModal(c)} className="btn btn-sm btn-outline" style={{ padding: '4px 8px' }}>Update Status</button>
                      <button onClick={() => handleDelete(c._id)} className="btn btn-sm btn-ghost btn-icon" style={{ color: '#dc2626' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Claim Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Claim">
        <form onSubmit={handleCreateSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Select Member</label>
            <select className="form-select" required value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})}>
              <option value="">-- Choose Member --</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.idNumber})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Claim Title</label>
            <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Claim Type</label>
            <select className="form-select" required value={formData.claimType} onChange={e => setFormData({...formData, claimType: e.target.value})}>
              {CLAIM_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (KES)</label>
            <input type="number" className="form-input" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Claim'}</button>
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Update Claim Status">
        <form onSubmit={handleStatusSubmit} className="flex-col gap-4">
          <div style={{ background: 'var(--gray-50)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{activeClaim?.title}</div>
            <div style={{ fontSize: '0.85rem' }}>For: {activeClaim?.member?.name}</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Amount: KES {activeClaim?.amount?.toLocaleString()}</div>
          </div>
          
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">New Status</label>
            <select className="form-select" value={statusUpdate.status} onChange={e => setStatusUpdate({...statusUpdate, status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Admin Notes (Optional)</label>
            <textarea className="form-textarea" value={statusUpdate.notes} onChange={e => setStatusUpdate({...statusUpdate, notes: e.target.value})} placeholder="Add processing notes or rejection reason..." />
          </div>

          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsStatusModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Updating...' : 'Update Status'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaderClaimsPage;
