import { useEffect, useState } from 'react';
import { getUnpaidMembers } from '../../api/stats';
import { addContribution } from '../../api/contributions';
import { getCategories } from '../../api/categories';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { UserX, Phone, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const LeaderUnpaidPage = () => {
  const [unpaid, setUnpaid] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', category: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        getUnpaidMembers(),
        getCategories()
      ]);
      setUnpaid(res.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkPaid = (member) => {
    setSelectedMember(member);
    setPayForm({ 
      amount: '', 
      category: categories.length > 0 ? categories[0].name : '', 
      description: '' 
    });
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addContribution({
        memberId: selectedMember._id,
        amount: Number(payForm.amount),
        category: payForm.category,
        description: payForm.description || `Marked paid from unpaid list`,
        datePaid: new Date().toISOString().split('T')[0]
      });
      toast.success(`${selectedMember.name} marked as paid`);
      setIsPayModalOpen(false);
      fetchData(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Unpaid Members List</h1>
          <p className="page-subtitle">Members who haven't contributed in the last 31 days</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={18} /> Refresh</button>
      </div>

      <div className="card" style={{ background: 'var(--red-50)', border: '1px solid var(--red-200)', marginBottom: 24 }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--red-700)' }}>
          <AlertCircle size={24} />
          <p style={{ fontWeight: 600, margin: 0 }}>
            {unpaid.length} members are currently flagged as unpaid.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Last Contribution</th>
                <th>Amount</th>
                <th>Days Since</th>
                <th>Contact</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unpaid.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No unpaid members found. Everyone is up to date! 🎉</div></td></tr>
              ) : unpaid.map((d, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={d.member.profilePhoto?.url} name={d.member.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.member.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>M.No: {d.member.idNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {d.lastDate ? format(new Date(d.lastDate), 'dd MMM yyyy') : <span style={{ color: 'var(--red-500)', fontWeight: 600 }}>Never</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {d.amount ? `KES ${d.amount.toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <span className="badge" style={{ background: d.daysSince === 'Never' ? 'var(--red-100)' : 'var(--orange-100)', color: d.daysSince === 'Never' ? 'var(--red-700)' : 'var(--orange-700)' }}>
                      {d.daysSince} {d.daysSince === 'Never' ? '' : 'days'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <a href={`tel:${d.member.phoneNumber}`} className="btn btn-sm btn-ghost btn-icon" title="Call Member"><Phone size={16} /></a>
                      <button className="btn btn-sm btn-outline">Send Reminder</button>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => handleMarkPaid(d.member)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <CheckCircle size={14} /> Mark Paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark as Paid Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Record Payment — ${selectedMember?.name || ''}`}>
        <form onSubmit={handlePaySubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" required value={payForm.category} onChange={e => setPayForm({...payForm, category: e.target.value})}>
              <option value="">-- Choose Category --</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (KES)</label>
            <input type="number" className="form-input" required min="1" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input type="text" className="form-input" value={payForm.description} onChange={e => setPayForm({...payForm, description: e.target.value})} placeholder="e.g. Paid via M-Pesa" />
          </div>
          <div className="flex justify-between" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Confirm Payment'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaderUnpaidPage;
