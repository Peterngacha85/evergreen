import { useEffect, useState } from 'react';
import { getContributionSummary } from '../../api/contributions';
import { getChangeRequests } from '../../api/changeRequests';
import { getMembers } from '../../api/members';
import { getActiveCampaign } from '../../api/campaigns';
import { useAuth } from '../../context/AuthContext';
import { Users, TrendingUp, AlertCircle, ShieldCheck, Flag } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, m, r, ac] = await Promise.all([
          getContributionSummary(),
          getMembers(),
          getChangeRequests({ status: 'pending' }),
          getActiveCampaign(),
        ]);
        setSummary(s.data);
        setMemberCount(m.data.length);
        setPendingReqs(r.data);
        setActiveCampaign(ac.data);
      } catch (err) {
        // Handle error quietly
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header">
        <h1 className="page-title">Leader Dashboard</h1>
        <p className="page-subtitle">Overview of community metrics and pending tasks</p>
      </div>

      {/* Action needed alert */}
      {pendingReqs.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#b45309' }}>
            <AlertCircle size={24} />
            <div>
              <div style={{ fontWeight: 700 }}>Action Required</div>
              <div style={{ fontSize: '0.85rem' }}>There are {pendingReqs.length} change requests waiting for your approval.</div>
            </div>
          </div>
          <Link to="/leader/change-requests" className="btn btn-sm" style={{ background: '#b45309', color: 'white' }}>View Requests</Link>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><TrendingUp size={24} /></div>
          <div><div className="stat-value">₪ {(summary?.grandTotal || 0).toLocaleString()}</div><div className="stat-label">Total Funds Managed</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><Users size={24} /></div>
          <div><div className="stat-value">{memberCount}</div><div className="stat-label">Active Members</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-lime"><ShieldCheck size={24} /></div>
          <div><div className="stat-value">{user?.leaderRole || 'Super Admin'}</div><div className="stat-label">Your Role</div></div>
        </div>
      </div>

      {/* Active Campaign Banner */}
      {activeCampaign ? (
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          borderRadius: 'var(--radius-xl)', padding: '18px 24px', marginBottom: 24,
          color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Flag size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>🟢 Active Campaign</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{activeCampaign.title}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 3 }}>
              ₪ {(activeCampaign.totalRaised || 0).toLocaleString()} raised · {activeCampaign.contributionCount || 0} contributions
            </div>
          </div>
          <Link to="/leader/contributions" style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem', flexShrink: 0 }}>
            Manage →
          </Link>
        </div>
      ) : (
        <div style={{
          background: 'var(--gray-50)', border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '14px 22px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Flag size={20} style={{ color: 'var(--gray-400)' }} />
            <span style={{ fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.9rem' }}>No Active Contribution Campaign</span>
          </div>
          <Link to="/leader/contributions" className="btn btn-sm btn-outline">Start Campaign</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--green-700)', marginBottom: 16 }}>Fund Categories</h3>
          {summary?.summary?.length === 0 ? (
            <div className="empty-state"><div className="empty-state-title">No funds recorded</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {summary?.summary?.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 600 }}>{item._id}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.count} records</div>
                    <div style={{ fontWeight: 700, color: 'var(--green-600)', minWidth: 100, textAlign: 'right' }}>₪ {item.total.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--green-700)', marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/leader/change-requests" className="btn btn-outline w-full" style={{ justifyContent: 'flex-start' }}>Request Change Access</Link>
            <Link to="/leader/members" className="btn btn-outline w-full" style={{ justifyContent: 'flex-start' }}>Manage Members</Link>
            <Link to="/leader/contributions" className="btn btn-outline w-full" style={{ justifyContent: 'flex-start' }}>Record Contribution</Link>
            <Link to="/leader/claims" className="btn btn-outline w-full" style={{ justifyContent: 'flex-start' }}>Process Claims</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderDashboard;
