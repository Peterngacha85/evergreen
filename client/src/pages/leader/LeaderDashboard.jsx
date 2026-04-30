import { useEffect, useState } from 'react';
import { getContributionSummary } from '../../api/contributions';
import { getChangeRequests } from '../../api/changeRequests';
import { getMembers } from '../../api/members';
import { useAuth } from '../../context/AuthContext';
import { Users, TrendingUp, AlertCircle, ShieldCheck, Shield } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, m, r] = await Promise.all([
          getContributionSummary(),
          getMembers(),
          getChangeRequests({ status: 'pending' })
        ]);
        setSummary(s.data);
        setMemberCount(m.data.length);
        setPendingReqs(r.data);
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
          <div><div className="stat-value">KES {(summary?.grandTotal || 0).toLocaleString()}</div><div className="stat-label">Total Funds Managed</div></div>
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
                    <div style={{ fontWeight: 700, color: 'var(--green-600)', minWidth: 100, textAlign: 'right' }}>KES {item.total.toLocaleString()}</div>
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

        {/* Change Password Card */}
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--green-700)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} /> Security & Password
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>Update your password to keep your account secure. (Requirement: 4 - 6 characters)</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const currentPassword = e.target.currentPassword.value;
            const newPassword = e.target.newPassword.value;
            const confirmPassword = e.target.confirmPassword.value;

            if (newPassword !== confirmPassword) {
              return toast.error('Passwords do not match');
            }
            if (newPassword.length < 4 || newPassword.length > 6) {
              return toast.error('Password must be 4 to 6 characters');
            }

            try {
              const { updateLeaderPassword } = await import('../../api/auth');
              await updateLeaderPassword({ currentPassword, newPassword });
              toast.success('Password updated successfully');
              e.target.reset();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to update password');
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" name="currentPassword" required className="form-input" style={{ background: 'var(--green-50)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" name="newPassword" required className="form-input" style={{ background: 'var(--green-50)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" name="confirmPassword" required className="form-input" style={{ background: 'var(--green-50)' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaderDashboard;
