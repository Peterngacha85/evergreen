import { useEffect, useState } from 'react';
import { getContributions, addContribution, updateContribution, deleteContribution } from '../../api/contributions';
import { getMembers } from '../../api/members';
import { validateSession } from '../../api/changeRequests';
import Modal from '../../components/common/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CATEGORIES = ['Monthly Dues', 'Medical Fund', 'Bereavement', 'Development Fund', 'Emergency'];

const LeaderContributionsPage = () => {
  const { isSuperAdmin } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', memberId: '', amount: '', category: DEFAULT_CATEGORIES[0], description: '', datePaid: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [c, m, s] = await Promise.all([
        getContributions(),
        getMembers(),
        !isSuperAdmin ? validateSession().catch(() => ({ data: { hasSession: false } })) : Promise.resolve({ data: { hasSession: true } })
      ]);
      setContributions(c.data);
      setMembers(m.data);
      setHasAccess(s.data.hasSession);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (contrib = null) => {
    if (!hasAccess && !isSuperAdmin) return toast.error('You need an approved change request session.');
    if (contrib) {
      setIsEditMode(true);
      setFormData({ 
        id: contrib._id, 
        memberId: contrib.member._id, 
        amount: contrib.amount, 
        category: contrib.category, 
        description: contrib.description || '', 
        datePaid: new Date(contrib.datePaid).toISOString().split('T')[0] 
      });
    } else {
      setIsEditMode(false);
      setFormData({ id: '', memberId: '', amount: '', category: DEFAULT_CATEGORIES[0], description: '', datePaid: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      if (isEditMode) {
        await updateContribution(formData.id, payload);
        toast.success('Contribution updated');
      } else {
        await addContribution(payload);
        toast.success('Contribution recorded');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!hasAccess && !isSuperAdmin) return toast.error('You need an approved change request session.');
    if (!window.confirm('Delete this contribution record?')) return;
    try {
      await deleteContribution(id);
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
        <div><h1 className="page-title">Manage Contributions</h1></div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} disabled={!hasAccess && !isSuperAdmin}><Plus size={18} /> Record Contribution</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date Paid</th>
                <th>Recorded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contributions.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No contributions recorded yet.</div></td></tr>
              ) : contributions.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.member?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.member?.idNumber}</div>
                  </td>
                  <td><span className="badge badge-green">{c.category}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>KES {c.amount.toLocaleString()}</td>
                  <td>{format(new Date(c.datePaid), 'dd MMM yyyy')}</td>
                  <td style={{ fontSize: '0.8rem' }}>{c.recordedBy?.name}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(c)} className="btn btn-sm btn-ghost btn-icon"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(c._id)} className="btn btn-sm btn-ghost btn-icon" style={{ color: '#dc2626' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Contribution' : 'Record Contribution'}>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          {!isEditMode && (
            <div className="form-group">
              <label className="form-label">Select Member</label>
              <select className="form-select" required value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})}>
                <option value="">-- Choose Member --</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.idNumber})</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (KES)</label>
            <input type="number" className="form-input" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Date Paid</label>
            <input type="date" className="form-input" required value={formData.datePaid} onChange={e => setFormData({...formData, datePaid: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Notes (Optional)</label>
            <input type="text" className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Record'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaderContributionsPage;
