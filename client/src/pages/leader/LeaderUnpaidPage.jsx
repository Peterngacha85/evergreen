import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUnpaidMembers, getDeactivatedMembers } from '../../api/stats';
import { getActiveCampaigns } from '../../api/campaigns';
import { addContribution } from '../../api/contributions';
import { getCategories } from '../../api/categories';
import { reactivateMember } from '../../api/members';
import { validateSession } from '../../api/changeRequests';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import AccessRequiredModal from '../../components/common/AccessRequiredModal';
import DeactivateMemberModal from '../../components/common/DeactivateMemberModal';
import { Phone, AlertCircle, RefreshCw, CheckCircle, Search, Flag, UserX, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const EMERGENCY_KIT_CATEGORIES = ['registration fee', 'emergency fee', 'registration', 'emergency'];
const isEmergencyKitCat = (cat) => EMERGENCY_KIT_CATEGORIES.includes(cat?.toLowerCase());

const DAY_RANGES = {
  '':      { label: 'Any time overdue', test: () => true },
  'never': { label: 'Never contributed', test: (d) => d.daysSince === 'Never' },
  '31-60': { label: '31–60 days',        test: (d) => d.daysSince !== 'Never' && d.daysSince <= 60 },
  '61-90': { label: '61–90 days',        test: (d) => d.daysSince !== 'Never' && d.daysSince > 60 && d.daysSince <= 90 },
  '90+':   { label: 'Over 90 days',      test: (d) => d.daysSince !== 'Never' && d.daysSince > 90 },
};

// "Never" sorts as the most overdue
const daysValue = (d) => (d.daysSince === 'Never' ? Infinity : d.daysSince);

const LeaderUnpaidPage = () => {
  const { isMember, isSuperAdmin } = useAuth();
  const campaignPath = (id) => `${isMember ? '' : '/leader'}/campaigns/${id}`;

  const [unpaid, setUnpaid] = useState([]);
  const [deactivated, setDeactivated] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [reactivatingId, setReactivatingId] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [dayRange, setDayRange] = useState('');
  const [sortBy, setSortBy] = useState('number');

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', target: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, campRes, catRes, deactRes, session] = await Promise.all([
        getUnpaidMembers(),
        getActiveCampaigns(),
        isMember ? Promise.resolve({ data: [] }) : getCategories(),
        getDeactivatedMembers(),
        isMember || isSuperAdmin
          ? Promise.resolve({ data: { hasSession: isSuperAdmin } })
          : validateSession().catch(() => ({ data: { hasSession: false } })),
      ]);
      setUnpaid(res.data);
      setCampaigns(campRes.data);
      setCategories(catRes.data);
      setDeactivated(deactRes.data);
      setHasAccess(session.data.hasSession);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // The payment target is either an Emergency Kit category name or an
  // active campaign, encoded as "campaign:<id>" (campaign categories can't be
  // recorded without picking the campaign).
  const emergencyCategories = categories.filter(c => isEmergencyKitCat(c.name));
  const targetCampaign = payForm.target.startsWith('campaign:')
    ? campaigns.find(c => c._id === payForm.target.slice('campaign:'.length))
    : null;

  const handleTargetChange = (target) => {
    const campaign = target.startsWith('campaign:') ? campaigns.find(c => c._id === target.slice('campaign:'.length)) : null;
    setPayForm(prev => ({ ...prev, target, amount: campaign?.effectiveMinContribution || prev.amount }));
  };

  const handleMarkPaid = (member) => {
    setSelectedMember(member);
    setPayForm({ amount: '', target: emergencyCategories[0]?.name || '', description: '' });
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addContribution({
        memberId: selectedMember._id,
        amount: Number(payForm.amount),
        category: targetCampaign ? targetCampaign.category : payForm.target,
        campaignId: targetCampaign?._id,
        description: payForm.description || 'Marked paid from unpaid list',
        datePaid: new Date().toISOString().split('T')[0],
      });
      toast.success(`${selectedMember.name} marked as paid`);
      setIsPayModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = (member) => {
    if (!hasAccess && !isSuperAdmin) { setIsAccessModalOpen(true); return; }
    setDeactivating(member);
  };

  const handleReactivate = async (member) => {
    if (!hasAccess && !isSuperAdmin) { setIsAccessModalOpen(true); return; }
    setReactivatingId(member._id);
    try {
      await reactivateMember(member._id);
      toast.success(`${member.name} reactivated`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reactivate member');
    } finally {
      setReactivatingId(null);
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  const term = searchTerm.trim().toLowerCase();
  const visible = unpaid
    .filter(d => DAY_RANGES[dayRange].test(d))
    .filter(d => !term || d.member.name.toLowerCase().includes(term) || d.member.idNumber.includes(term) || (d.member.phoneNumber || '').includes(term))
    .sort((a, b) => sortBy === 'overdue'
      ? daysValue(b) - daysValue(a)
      : a.member.idNumber.localeCompare(b.member.idNumber));
  const hasFilters = term || dayRange || sortBy !== 'number';

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Unpaid Members</h1>
          <p className="page-subtitle">Who still owes on each active campaign, and who hasn't contributed in the last 31 days</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={18} /> Refresh</button>
      </div>

      {/* ── Per-campaign summary ────────────────────────────────────── */}
      {campaigns.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Active Campaigns</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {campaigns.map(c => (
              <Link key={c._id} to={campaignPath(c._id)} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: '16px 18px', display: 'block' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                  <Flag size={16} style={{ color: '#2563eb' }} />
                  <span style={{ fontWeight: 700 }}>{c.title}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Min ₪ {(c.effectiveMinContribution || 0).toLocaleString()} / member{c.targetMember && <> · For {c.targetMember.name}</>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span className="badge badge-red">{c.unpaidCount || 0} unpaid</span>
                  <span className="badge badge-yellow">{c.partialCount || 0} partial</span>
                  <span className="badge badge-green">{c.paidCount || 0} paid</span>
                </div>
                <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>₪ {(c.outstandingTotal || 0).toLocaleString()} outstanding</span>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Deactivated for missing a campaign deadline ─────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Deactivated Members ({deactivated.length})</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Members deactivated for non-payment, either automatically when a campaign&apos;s deadline passed or by a leader. They cannot log in and are not counted as active members{!isMember && ' until reactivated'}.
        </p>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Reason</th>
                  <th>Owed</th>
                  <th>Deactivated On</th>
                  {!isMember && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {deactivated.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state">No deactivated members.</div></td></tr>
                ) : deactivated.map(d => (
                  <tr key={d.member._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={d.member.profilePhoto?.url} name={d.member.name} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{d.member.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>M.No: {d.member.idNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div className="flex items-center gap-2"><UserX size={14} style={{ color: '#dc2626', flexShrink: 0 }} />{d.reason || 'Missed a campaign deadline'}</div>
                      {d.campaign && <Link to={campaignPath(d.campaign._id)} style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>View campaign →</Link>}
                    </td>
                    <td style={{ fontWeight: 700, color: '#dc2626' }}>{d.amountOwed ? `₪ ${d.amountOwed.toLocaleString()}` : '—'}</td>
                    <td>{d.deactivatedAt ? format(new Date(d.deactivatedAt), 'dd MMM yyyy') : '—'}</td>
                    {!isMember && (
                      <td>
                        <div className="flex gap-2">
                          {d.member.phoneNumber && <a href={`tel:${d.member.phoneNumber}`} className="btn btn-sm btn-ghost btn-icon" title="Call Member"><Phone size={16} /></a>}
                          <button className="btn btn-sm btn-primary" onClick={() => handleReactivate(d.member)} disabled={reactivatingId === d.member._id}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <UserCheck size={14} /> {reactivatingId === d.member._id ? 'Reactivating...' : 'Reactivate'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── No contribution in 31+ days ─────────────────────────────── */}
      <h3 style={{ fontWeight: 700, marginBottom: 12 }}>No Contribution in the Last 31 Days</h3>

      <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
        <div className="flex items-center gap-3" style={{ color: '#b91c1c' }}>
          <AlertCircle size={22} />
          <p style={{ fontWeight: 600, margin: 0 }}>
            {unpaid.length} members are flagged{visible.length !== unpaid.length && ` · ${visible.length} shown`}.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input type="text" className="form-input" placeholder="Search name, member no. or phone..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 42 }} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 180 }} value={dayRange} onChange={e => setDayRange(e.target.value)}>
          {Object.entries(DAY_RANGES).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 170 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="number">Sort: Member no.</option>
          <option value="overdue">Sort: Longest overdue</option>
        </select>
        {hasFilters && (
          <button className="btn btn-ghost" style={{ color: '#dc2626', fontWeight: 600 }}
            onClick={() => { setSearchTerm(''); setDayRange(''); setSortBy('number'); }}>Clear</button>
        )}
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
                {!isMember && <th>Contact</th>}
                {!isMember && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">
                  {unpaid.length === 0 ? 'No unpaid members found. Everyone is up to date! 🎉' : 'No members match these filters.'}
                </div></td></tr>
              ) : visible.map(d => (
                <tr key={d.member._id}>
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
                    {d.lastDate ? format(new Date(d.lastDate), 'dd MMM yyyy') : <span style={{ color: '#dc2626', fontWeight: 600 }}>Never</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {d.amount ? `₪ ${d.amount.toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${d.daysSince === 'Never' || d.daysSince > 90 ? 'badge-red' : 'badge-yellow'}`}>
                      {d.daysSince} {d.daysSince === 'Never' ? '' : 'days'}
                    </span>
                  </td>
                  {!isMember && (
                    <td>
                      <div className="flex gap-2">
                        <a href={`tel:${d.member.phoneNumber}`} className="btn btn-sm btn-ghost btn-icon" title="Call Member"><Phone size={16} /></a>
                        <button className="btn btn-sm btn-outline">Send Reminder</button>
                      </div>
                    </td>
                  )}
                  {!isMember && (
                    <td>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleMarkPaid(d.member)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <CheckCircle size={14} /> Mark Paid
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeactivate(d.member)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <UserX size={14} /> Deactivate
                        </button>
                      </div>
                    </td>
                  )}
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
            <label className="form-label">Pay Towards</label>
            <select className="form-select" required value={payForm.target} onChange={e => handleTargetChange(e.target.value)}>
              <option value="">-- Choose --</option>
              {campaigns.length > 0 && (
                <optgroup label="Active Campaigns">
                  {campaigns.map(c => (
                    <option key={c._id} value={`campaign:${c._id}`}>{c.title} ({c.category})</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Emergency Kit Categories">
                {emergencyCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₪)</label>
            <input type="number" className="form-input" required min="1" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
            {targetCampaign && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Minimum for this campaign: ₪ {(targetCampaign.effectiveMinContribution || 0).toLocaleString()}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input type="text" className="form-input" value={payForm.description} onChange={e => setPayForm({ ...payForm, description: e.target.value })} placeholder="e.g. M-Pesa code" />
          </div>
          <div className="flex justify-between" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Confirm Payment'}</button>
          </div>
        </form>
      </Modal>

      <DeactivateMemberModal member={deactivating} onClose={() => setDeactivating(null)}
        onDone={() => { setDeactivating(null); fetchData(); }} />

      <AccessRequiredModal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} />
    </div>
  );
};

export default LeaderUnpaidPage;
