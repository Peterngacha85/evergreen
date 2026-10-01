import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCampaignStatus, updateCampaignMinimum } from '../../api/campaigns';
import { addContribution, updateContribution } from '../../api/contributions';
import { validateSession } from '../../api/changeRequests';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import AccessRequiredModal from '../../components/common/AccessRequiredModal';
import { ArrowLeft, Flag, Search, Phone, Edit2, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = {
  paid:    { label: 'Paid',    className: 'badge badge-green'  },
  partial: { label: 'Partial', className: 'badge badge-yellow' },
  unpaid:  { label: 'Unpaid',  className: 'badge badge-red'    },
};

const STATUS_TABS = [
  { key: '',        label: 'All'     },
  { key: 'unpaid',  label: 'Unpaid'  },
  { key: 'partial', label: 'Partial' },
  { key: 'paid',    label: 'Paid'    },
];

const money = (n) => `₪ ${Number(n || 0).toLocaleString()}`;
const today = () => new Date().toISOString().split('T')[0];

const CampaignDetailPage = () => {
  const { id } = useParams();
  const { isMember, isSuperAdmin } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment modal: mode is 'add' (unpaid), 'topup' (partial) or 'edit' (any recorded payment)
  const [payment, setPayment] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', datePaid: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const [isMinModalOpen, setIsMinModalOpen] = useState(false);
  const [minValue, setMinValue] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [res, session] = await Promise.all([
        getCampaignStatus(id),
        isMember || isSuperAdmin
          ? Promise.resolve({ data: { hasSession: isSuperAdmin } })
          : validateSession().catch(() => ({ data: { hasSession: false } })),
      ]);
      setData(res.data);
      setHasAccess(session.data.hasSession);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  }, [id, isMember, isSuperAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const requireAccess = () => {
    if (hasAccess || isSuperAdmin) return true;
    setIsAccessModalOpen(true);
    return false;
  };

  const openPayment = (row, mode) => {
    if (!requireAccess()) return;
    setPayment({ row, mode });
    if (mode === 'add') {
      setPayForm({ amount: data.minContribution || '', datePaid: today(), description: '' });
    } else if (mode === 'topup') {
      setPayForm({ amount: row.outstanding || '', datePaid: today(), description: '' });
    } else {
      setPayForm({ amount: row.paid, datePaid: new Date(row.datePaid).toISOString().split('T')[0], description: row.description || '' });
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const { row, mode } = payment;
    const amount = Number(payForm.amount);
    setSubmitting(true);
    try {
      if (mode === 'add') {
        await addContribution({
          memberId: row.member._id,
          amount,
          category: data.campaign.category,
          campaignId: data.campaign._id,
          description: payForm.description,
          datePaid: payForm.datePaid,
        });
        toast.success(`Payment recorded for ${row.member.name}`);
      } else if (mode === 'topup') {
        // A member has a single record per campaign, so a top-up adds to it
        // and notes the extra payment in its description.
        const note = `Top-up ${money(amount)} on ${format(new Date(payForm.datePaid), 'dd MMM yyyy')}${payForm.description ? ` (${payForm.description})` : ''}`;
        await updateContribution(row.contributionId, {
          amount: row.paid + amount,
          description: row.description ? `${row.description}; ${note}` : note,
        });
        toast.success(`Top-up recorded for ${row.member.name}`);
      } else {
        await updateContribution(row.contributionId, {
          amount,
          datePaid: payForm.datePaid,
          description: payForm.description,
        });
        toast.success('Payment updated');
      }
      setPayment(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setSubmitting(false);
    }
  };

  const openMinModal = () => {
    if (!requireAccess()) return;
    setMinValue(data.minContribution);
    setIsMinModalOpen(true);
  };

  const handleMinSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateCampaignMinimum(id, Number(minValue));
      toast.success('Minimum contribution updated for this campaign');
      setIsMinModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update minimum');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  const backTo = isMember ? '/dashboard' : '/leader/contributions';

  if (error || !data) {
    return (
      <div className="animate-fadein">
        <Link to={backTo} className="btn btn-ghost" style={{ marginBottom: 16 }}><ArrowLeft size={16} /> Back</Link>
        <div className="card"><div className="empty-state">{error || 'Campaign not found.'}</div></div>
      </div>
    );
  }

  const { campaign, summary, rows, minContribution, usesDefaultMinimum } = data;
  const isActive = campaign.status === 'active';
  const canAct = !isMember && isActive;
  const counts = { '': rows.length, unpaid: summary.unpaidCount, partial: summary.partialCount, paid: summary.paidCount };

  const term = searchTerm.trim().toLowerCase();
  const visibleRows = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!term || r.member.name.toLowerCase().includes(term) || r.member.idNumber.includes(term))
  );

  const modalTitle = payment && {
    add: `Record Payment — ${payment.row.member.name}`,
    topup: `Top Up — ${payment.row.member.name}`,
    edit: `Edit Payment — ${payment.row.member.name}`,
  }[payment.mode];

  return (
    <div className="animate-fadein">
      <Link to={backTo} className="btn btn-ghost" style={{ marginBottom: 12 }}><ArrowLeft size={16} /> Back</Link>

      {/* ── Campaign header ─────────────────────────────────────────── */}
      <div style={{
        background: isActive ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)' : 'linear-gradient(135deg, #374151, #6b7280)',
        borderRadius: 'var(--radius-xl)', padding: '22px 28px', color: '#fff', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 240 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Flag size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
              {isActive ? '🟢 Active Campaign' : '✅ Closed Campaign'}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6 }}>{campaign.title}</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.18)', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>{campaign.category}</span>
              {campaign.targetMember && <span style={{ opacity: 0.85 }}>For: <strong>{campaign.targetMember.name}</strong></span>}
              <span style={{ opacity: 0.8 }}>Started {format(new Date(campaign.createdAt), 'dd MMM yyyy')}</span>
            </div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 18px', textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Minimum per member</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{money(minContribution)}</span>
            {canAct && (
              <button onClick={openMinModal} title="Change minimum for this campaign"
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: 6, color: '#fff', cursor: 'pointer', display: 'flex' }}>
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {usesDefaultMinimum && <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Using the global default</div>}
        </div>
      </div>

      {/* ── Summary tiles ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Expected to pay', value: summary.eligibleCount, color: 'var(--gray-800)' },
          { label: 'Paid',            value: summary.paidCount,     color: '#15803d' },
          { label: 'Partial',         value: summary.partialCount,  color: '#b45309' },
          { label: 'Unpaid',          value: summary.unpaidCount,   color: '#dc2626' },
          { label: 'Collected',       value: money(summary.totalCollected),   color: '#15803d' },
          { label: 'Outstanding',     value: money(summary.outstandingTotal), color: '#dc2626' },
        ].map(t => (
          <div key={t.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_TABS.map(tab => (
            <button key={tab.key} type="button" onClick={() => setStatusFilter(tab.key)}
              className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-ghost'}`}>
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input type="text" className="form-input" placeholder="Search by member name or number..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 42 }} />
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchData}><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* ── Members table ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Status</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Date Paid</th>
                {!isMember && <th>Contact</th>}
                {canAct && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">No members match this filter.</div></td></tr>
              ) : visibleRows.map(r => (
                <tr key={r.member._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={r.member.profilePhoto?.url} name={r.member.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.member.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          M.No: {r.member.idNumber}{!r.eligible && ' · not required to pay'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className={STATUS_BADGE[r.status].className}>{STATUS_BADGE[r.status].label}</span></td>
                  <td style={{ fontWeight: 700, color: r.paid ? 'var(--green-700)' : 'var(--text-muted)' }}>{r.paid ? money(r.paid) : '—'}</td>
                  <td style={{ fontWeight: 700, color: r.outstanding ? '#dc2626' : 'var(--text-muted)' }}>{r.outstanding ? money(r.outstanding) : '—'}</td>
                  <td>{r.datePaid ? format(new Date(r.datePaid), 'dd MMM yyyy') : '—'}</td>
                  {!isMember && (
                    <td>
                      {r.member.phoneNumber && (
                        <a href={`tel:${r.member.phoneNumber}`} className="btn btn-sm btn-ghost btn-icon" title={`Call ${r.member.phoneNumber}`}><Phone size={16} /></a>
                      )}
                    </td>
                  )}
                  {canAct && (
                    <td>
                      <div className="flex gap-2">
                        {r.status === 'unpaid' && (
                          <button className="btn btn-sm btn-primary" onClick={() => openPayment(r, 'add')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={14} /> Mark Paid
                          </button>
                        )}
                        {r.status === 'partial' && (
                          <button className="btn btn-sm btn-primary" onClick={() => openPayment(r, 'topup')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Plus size={14} /> Top Up
                          </button>
                        )}
                        {r.contributionId && (
                          <button className="btn btn-sm btn-ghost btn-icon" onClick={() => openPayment(r, 'edit')} title="Edit payment"><Edit2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment modal ───────────────────────────────────────────── */}
      <Modal isOpen={!!payment} onClose={() => setPayment(null)} title={modalTitle}>
        {payment && (
          <form onSubmit={handlePaymentSubmit} className="flex-col gap-4">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', color: '#1e40af' }}>
              <strong>{campaign.title}</strong> · minimum {money(minContribution)}
              {payment.mode !== 'add' && <> · currently paid {money(payment.row.paid)}</>}
            </div>
            <div className="form-group">
              <label className="form-label">{payment.mode === 'topup' ? 'Top-up Amount (₪)' : 'Amount (₪)'}</label>
              <input type="number" className="form-input" required min="1" value={payForm.amount}
                onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
              {payment.mode === 'topup' && payForm.amount && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  New total: {money(payment.row.paid + Number(payForm.amount))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Date Paid</label>
              <input type="date" className="form-input" required value={payForm.datePaid}
                onChange={e => setPayForm({ ...payForm, datePaid: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input type="text" className="form-input" value={payForm.description} placeholder="e.g. M-Pesa code"
                onChange={e => setPayForm({ ...payForm, description: e.target.value })} />
            </div>
            <div className="flex justify-between" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setPayment(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Change minimum modal ────────────────────────────────────── */}
      <Modal isOpen={isMinModalOpen} onClose={() => setIsMinModalOpen(false)} title="Change Minimum for This Campaign" maxWidth="440px">
        <form onSubmit={handleMinSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Minimum per member (₪)</label>
            <input type="number" className="form-input" required min="0" value={minValue} onChange={e => setMinValue(e.target.value)} />
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#92400e' }}>
            This changes <strong>{campaign.title}</strong> only. Members who paid less than the new amount will show as <strong>Partial</strong>. Other campaigns and the global default are not affected.
          </div>
          <div className="flex justify-between" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsMinModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Update Minimum'}</button>
          </div>
        </form>
      </Modal>

      <AccessRequiredModal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} />
    </div>
  );
};

export default CampaignDetailPage;
