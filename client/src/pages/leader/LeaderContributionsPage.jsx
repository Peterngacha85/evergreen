import { useEffect, useState, useCallback } from 'react';
import { getContributions, addContribution, updateContribution, deleteContribution } from '../../api/contributions';
import { getMembers } from '../../api/members';
import { getCategories, createCategory } from '../../api/categories';
import { validateSession } from '../../api/changeRequests';
import { getActiveCampaign, getCampaignHistory, createCampaign, completeCampaign } from '../../api/campaigns';
import { useSocket } from '../../context/SocketContext';
import Modal from '../../components/common/Modal';
import AccessRequiredModal from '../../components/common/AccessRequiredModal';
import { Plus, Edit2, Trash2, Search, Flag, CheckCircle, Clock, History, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const EMERGENCY_KIT_CATEGORIES = ['registration fee', 'emergency fee', 'registration', 'emergency'];

const LeaderContributionsPage = () => {
  const socket = useSocket();
  const { isSuperAdmin } = useAuth();

  // Data state
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Contribution modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', memberId: '', amount: '', category: '', description: '', datePaid: '' });
  const [submitting, setSubmitting] = useState(false);

  // Campaign modals
  const [isStartCampaignOpen, setIsStartCampaignOpen] = useState(false);
  const [isCompleteCampaignOpen, setIsCompleteCampaignOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [campaignForm, setCampaignForm] = useState({ title: '', category: '', description: '', targetAmount: '', targetMember: '' });
  const [completeForm, setCompleteForm] = useState({ payoutNotes: '', markClaimPaid: false });
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [c, m, s, cat, ac, hist] = await Promise.all([
        getContributions(),
        getMembers(),
        !isSuperAdmin ? validateSession().catch(() => ({ data: { hasSession: false } })) : Promise.resolve({ data: { hasSession: true } }),
        getCategories(),
        getActiveCampaign(),
        getCampaignHistory(),
      ]);
      setContributions(c.data);
      setMembers(m.data);
      setHasAccess(s.data.hasSession);
      setCategories(cat.data);
      setActiveCampaign(ac.data);
      setCampaignHistory(hist.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (socket) {
      socket.on('categoryAdded', (newCat) => {
        setCategories(prev => {
          if (prev.find(c => c._id === newCat._id)) return prev;
          return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name));
        });
      });
    }
    return () => { if (socket) socket.off('categoryAdded'); };
  }, [socket]);

  const isEmergencyKitCat = (cat) => EMERGENCY_KIT_CATEGORIES.includes(cat?.toLowerCase());

  const handleOpenModal = (contrib = null) => {
    if (!hasAccess && !isSuperAdmin) { setIsAccessModalOpen(true); return; }
    if (contrib) {
      setIsEditMode(true);
      setFormData({ id: contrib._id, memberId: contrib.member._id, amount: contrib.amount, category: contrib.category, description: contrib.description || '', datePaid: new Date(contrib.datePaid).toISOString().split('T')[0] });
    } else {
      setIsEditMode(false);
      const emergencyCategories = categories.filter(c => isEmergencyKitCat(c.name));
      const defaultCategory = activeCampaign
        ? activeCampaign.category
        : (emergencyCategories.length > 0 ? emergencyCategories[0].name : (categories.length > 0 ? categories[0].name : ''));
      setFormData({ id: '', memberId: '', amount: '', category: defaultCategory, description: '', datePaid: new Date().toISOString().split('T')[0] });
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
      const msg = err.response?.data?.message || 'Operation failed';
      if (err.response?.data?.requiresCampaign) {
        toast.error(msg, { duration: 5000 });
        setIsModalOpen(false);
        setIsStartCampaignOpen(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCampaign = async (e) => {
    e.preventDefault();
    if (!hasAccess && !isSuperAdmin) { setIsAccessModalOpen(true); return; }
    setCampaignSubmitting(true);
    try {
      await createCampaign({ ...campaignForm, targetAmount: campaignForm.targetAmount ? Number(campaignForm.targetAmount) : undefined, targetMember: campaignForm.targetMember || undefined });
      toast.success('Campaign started! Members can now contribute.');
      setIsStartCampaignOpen(false);
      setCampaignForm({ title: '', category: '', description: '', targetAmount: '', targetMember: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start campaign');
    } finally {
      setCampaignSubmitting(false);
    }
  };

  const handleCompleteCampaign = async (e) => {
    e.preventDefault();
    if (!hasAccess && !isSuperAdmin) { setIsAccessModalOpen(true); return; }
    setCampaignSubmitting(true);
    try {
      await completeCampaign(activeCampaign._id, completeForm);
      toast.success('Campaign completed & funds marked as paid out!');
      setIsCompleteCampaignOpen(false);
      setCompleteForm({ payoutNotes: '', markClaimPaid: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete campaign');
    } finally {
      setCampaignSubmitting(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategory({ name: newCategoryName, type: 'contribution' });
      toast.success('Category added');
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDelete = async (id) => {
    if (!hasAccess && !isSuperAdmin) { setIsAccessModalOpen(true); return; }
    if (!window.confirm('Delete this contribution record?')) return;
    try {
      await deleteContribution(id);
      toast.success('Record deleted');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const filteredContributions = contributions.filter(c => {
    const matchesSearch = c.member?.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.member?.idNumber.includes(searchTerm);
    const matchesCategory = filterCategory === '' || c.category === filterCategory;
    const cDate = new Date(c.datePaid).toISOString().split('T')[0];
    const matchesDateFrom = !dateFrom || cDate >= dateFrom;
    const matchesDateTo = !dateTo || cDate <= dateTo;
    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  const campaignProgress = activeCampaign?.targetAmount
    ? Math.min(100, ((activeCampaign.totalRaised || 0) / activeCampaign.targetAmount) * 100)
    : null;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Manage Contributions</h1>
          <p className="page-subtitle">Search and manage member financial records</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setIsHistoryOpen(true)} style={{ gap: 6 }}>
            <History size={17} /> Campaign History
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Record Contribution
          </button>
        </div>
      </div>

      {/* ── Active Campaign Banner ────────────────────────────────────── */}
      {activeCampaign ? (
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)',
          borderRadius: 'var(--radius-xl)', padding: '22px 28px', marginBottom: 24,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 24px rgba(37,99,235,0.22)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flag size={26} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                🟢 Active Contribution Campaign
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 6 }}>{activeCampaign.title}</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.18)', padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                  {activeCampaign.category}
                </span>
                {activeCampaign.targetMember && (
                  <span style={{ opacity: 0.85, fontSize: '0.82rem' }}>
                    For: <strong>{activeCampaign.targetMember.name}</strong>
                  </span>
                )}
                <span style={{ opacity: 0.8, fontSize: '0.82rem' }}>
                  Started {format(new Date(activeCampaign.createdAt), 'dd MMM yyyy')}
                </span>
              </div>
              {campaignProgress !== null && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', opacity: 0.85, marginBottom: 5 }}>
                    <span>Shekel {(activeCampaign.totalRaised || 0).toLocaleString()} raised</span>
                    <span>Target: Shekel {activeCampaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${campaignProgress}%`, height: '100%', background: '#86efac', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )}
              {campaignProgress === null && (
                <div style={{ marginTop: 8, opacity: 0.85, fontSize: '0.82rem' }}>
                  Shekel {(activeCampaign.totalRaised || 0).toLocaleString()} raised · {activeCampaign.contributionCount || 0} contributions
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => { if (!hasAccess && !isSuperAdmin) { setIsAccessModalOpen(true); return; } setIsCompleteCampaignOpen(true); }}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '10px 18px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, backdropFilter: 'blur(4px)' }}
          >
            <CheckCircle size={18} /> Close & Pay Out
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--gray-50)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flag size={22} style={{ color: 'var(--gray-400)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '1rem' }}>No Active Contribution Campaign</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Start a campaign to allow recording event-based contributions (Demise, Sickness, Farewell, etc.)
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { if (!hasAccess && !isSuperAdmin) { setIsAccessModalOpen(true); return; } setIsStartCampaignOpen(true); }}
          >
            <Plus size={17} /> Start Campaign
          </button>
        </div>
      )}

      {/* ── Search & Filter ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: '20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input type="text" className="form-input" placeholder="Search by member name or ID..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 48, height: 46, borderRadius: 12 }} />
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: 170, height: 46, borderRadius: 12 }}
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-50)', padding: '4px 12px', borderRadius: 12, border: '1px solid var(--border)', height: 46 }}>
            <input type="date" className="form-input" style={{ border: 'none', background: 'transparent', width: 130, padding: 0 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>→</span>
            <input type="date" className="form-input" style={{ border: 'none', background: 'transparent', width: 130, padding: 0 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo || filterCategory || searchTerm) && (
            <button className="btn btn-ghost" onClick={() => { setSearchTerm(''); setFilterCategory(''); setDateFrom(''); setDateTo(''); }}
              style={{ color: '#dc2626', fontWeight: 600, height: 46 }}>Clear</button>
          )}
        </div>
      </div>

      {/* ── Contributions Table ───────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Category</th>
                <th>Campaign</th>
                <th>Amount</th>
                <th>Date Paid</th>
                <th>Recorded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContributions.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">No matching contributions found.</div></td></tr>
              ) : filteredContributions.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.member?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.member?.idNumber}</div>
                  </td>
                  <td><span className="badge badge-green">{c.category}</span></td>
                  <td>
                    {c.campaign ? (
                      <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '2px 8px', borderRadius: 6, display: 'inline-block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.campaign?.title || 'Campaign'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Emergency Kit</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>Shekel {c.amount.toLocaleString()}</td>
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

      {/* ── Record/Edit Contribution Modal ────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Contribution' : 'Record Contribution'}>
        {!isEditMode && !activeCampaign && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Clock size={18} style={{ color: '#b45309', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.85rem' }}>No Active Campaign</div>
              <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: 2 }}>
                Only <strong>Registration Fee</strong> and <strong>Emergency Fee</strong> can be recorded without a campaign. For other categories, start a campaign first.
              </div>
            </div>
          </div>
        )}
        {!isEditMode && activeCampaign && !isEmergencyKitCat(formData.category) && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Flag size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.85rem' }}>Linked to: {activeCampaign.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: 2 }}>
                This contribution will be credited to the active campaign.
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          {!isEditMode && (
            <div className="form-group">
              <label className="form-label">Select Member</label>
              <select className="form-select" required value={formData.memberId} onChange={e => setFormData({ ...formData, memberId: e.target.value })}>
                <option value="">-- Choose Member --</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.idNumber})</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label">Category</label>
              <button type="button" onClick={() => setIsCategoryModalOpen(true)} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add New</button>
            </div>
            <select className="form-select" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              <option value="">-- Choose Category --</option>
              <optgroup label="Emergency Kit Categories">
                {categories.filter(c => isEmergencyKitCat(c.name)).map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </optgroup>
              {activeCampaign && !isEmergencyKitCat(activeCampaign.category) && (
                <optgroup label="Active Campaign">
                  <option key="active-campaign" value={activeCampaign.category}>{activeCampaign.category}</option>
                </optgroup>
              )}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (Shekel)</label>
            <input type="number" className="form-input" required min="1" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Date Paid</label>
            <input type="date" className="form-input" required value={formData.datePaid} onChange={e => setFormData({ ...formData, datePaid: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Notes (Optional)</label>
            <textarea className="form-input" rows="3" style={{ resize: 'none', height: 'auto' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Record'}</button>
          </div>
        </form>
      </Modal>

      {/* ── Start Campaign Modal ──────────────────────────────────────── */}
      <Modal isOpen={isStartCampaignOpen} onClose={() => setIsStartCampaignOpen(false)} title="Start Contribution Campaign">
        <form onSubmit={handleStartCampaign} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Campaign Title *</label>
            <input type="text" className="form-input" required placeholder="e.g. Support for John Doe's bereavement"
              value={campaignForm.title} onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" required value={campaignForm.category} onChange={e => setCampaignForm({ ...campaignForm, category: e.target.value })}>
              <option value="">-- Select event type --</option>
              {categories.filter(c => !isEmergencyKitCat(c.name)).map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Member Being Supported (Optional)</label>
            <select className="form-select" value={campaignForm.targetMember} onChange={e => setCampaignForm({ ...campaignForm, targetMember: e.target.value })}>
              <option value="">-- None / General --</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.idNumber})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target Amount (Shekel) — Optional</label>
            <input type="number" className="form-input" min="0" placeholder="Leave blank if open-ended"
              value={campaignForm.targetAmount} onChange={e => setCampaignForm({ ...campaignForm, targetAmount: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Notes (Optional)</label>
            <textarea className="form-input" rows="3" style={{ resize: 'none', height: 'auto' }}
              value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsStartCampaignOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={campaignSubmitting}>
              {campaignSubmitting ? 'Starting...' : '🚀 Start Campaign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Complete Campaign Modal ───────────────────────────────────── */}
      <Modal isOpen={isCompleteCampaignOpen} onClose={() => setIsCompleteCampaignOpen(false)} title="Close & Pay Out Campaign">
        {activeCampaign && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--green-700)', fontSize: '1rem', marginBottom: 4 }}>{activeCampaign.title}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--green-600)' }}>
              Total raised: <strong>Shekel {(activeCampaign.totalRaised || 0).toLocaleString()}</strong> · {activeCampaign.contributionCount || 0} contributions
            </div>
          </div>
        )}
        <form onSubmit={handleCompleteCampaign} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Payout Notes *</label>
            <textarea className="form-input" rows="4" required style={{ resize: 'none', height: 'auto' }}
              placeholder="e.g. Amount of Shekel 45,000 handed to Jane Mwangi on 23rd May 2026."
              value={completeForm.payoutNotes} onChange={e => setCompleteForm({ ...completeForm, payoutNotes: e.target.value })} />
          </div>
          {activeCampaign?.claim && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <input type="checkbox" checked={completeForm.markClaimPaid} onChange={e => setCompleteForm({ ...completeForm, markClaimPaid: e.target.checked })} />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gray-700)' }}>Also mark the linked welfare claim as "Paid"</span>
            </label>
          )}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: '0.82rem', color: '#991b1b' }}>
            ⚠️ This action is permanent. The campaign will be archived and no further contributions can be added to it.
          </div>
          <div className="flex justify-between" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCompleteCampaignOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={campaignSubmitting}
              style={{ background: '#16a34a' }}>
              {campaignSubmitting ? 'Completing...' : '✅ Complete & Archive'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Campaign History Modal ────────────────────────────────────── */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Contribution Campaign History">
        {campaignHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No completed campaigns yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaignHistory.map(camp => (
              <div key={camp._id} style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>{camp.title}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-green">{camp.category}</span>
                      {camp.targetMember && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>For {camp.targetMember.name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, color: 'var(--green-700)', fontSize: '1.1rem' }}>Shekel {(camp.totalAmountRaised || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Raised</div>
                  </div>
                </div>
                {camp.payoutNotes && (
                  <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    📝 {camp.payoutNotes}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Completed {camp.completedAt ? format(new Date(camp.completedAt), 'dd MMM yyyy') : '—'}
                  {camp.completedBy && ` by ${camp.completedBy.name}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Add Category Modal ────────────────────────────────────────── */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Add New Category">
        <form onSubmit={handleAddCategory} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input type="text" className="form-input" required placeholder="e.g. Farewell Gift"
              value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Category</button>
          </div>
        </form>
      </Modal>

      <AccessRequiredModal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} />
    </div>
  );
};

export default LeaderContributionsPage;
