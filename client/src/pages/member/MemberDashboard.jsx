import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, FileText, Wallet, Flag } from 'lucide-react';
import { getMyContributions } from '../../api/contributions';
import { getEvents } from '../../api/events';
import { getMyClaims } from '../../api/claims';
import { getActiveCampaign } from '../../api/campaigns';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import StatusBadge from '../../components/common/StatusBadge';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [contribs, setContribs] = useState([]);
  const [events, setEvents]     = useState([]);
  const [claims, setClaims]     = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [c, e, cl, ac] = await Promise.all([
          getMyContributions(),
          getEvents({ upcoming: 'true' }),
          getMyClaims(),
          getActiveCampaign(),
        ]);
        setContribs(c.data.slice(0, 5));
        setEvents(e.data.slice(0, 3));
        setClaims(cl.data.slice(0, 3));
        setActiveCampaign(ac.data);
      } catch {/* silent */} finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const myTotal = contribs.reduce((a, c) => a + c.amount, 0);
  const campaignProgress = activeCampaign?.targetAmount
    ? Math.min(100, ((activeCampaign.totalRaised || 0) / activeCampaign.targetAmount) * 100)
    : null;

  return (
    <div className="animate-fadein">
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg, var(--green-600), var(--green-500))', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: 'white', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 4 }}>Welcome back 👋</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.name}</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
              M.No: {user?.idNumber}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Member since {user?.joinDate ? format(new Date(user.joinDate), 'MMM yyyy') : '—'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Your Total Contributions</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>₪ {myTotal.toLocaleString()}</div>
        </div>
      </div>

      {/* Active Campaign Card */}
      {activeCampaign ? (
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          borderRadius: 'var(--radius-xl)', padding: '18px 24px', marginBottom: 24,
          color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.22)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flag size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>🟢 Active Campaign</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>{activeCampaign.title}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                ₪ {(activeCampaign.totalRaised || 0).toLocaleString()} raised · {activeCampaign.contributionCount || 0} contributions
              </div>
              {campaignProgress !== null && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 7, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${campaignProgress}%`, height: '100%', background: '#86efac', borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 4 }}>{campaignProgress.toFixed(0)}% of ₪ {activeCampaign.targetAmount.toLocaleString()} target</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--gray-50)', border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '14px 22px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <Flag size={20} style={{ color: 'var(--gray-400)' }} />
          <div style={{ fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.9rem' }}>No Active Contribution Campaign</div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><TrendingUp size={22} /></div>
          <div><div className="stat-value">{contribs.length}</div><div className="stat-label">Recent Contributions</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-lime"><Wallet size={22} /></div>
          <div><div className="stat-value">₪ {myTotal.toLocaleString()}</div><div className="stat-label">My Total Paid</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><Calendar size={22} /></div>
          <div><div className="stat-value">{events.length}</div><div className="stat-label">Upcoming Events</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-red"><FileText size={22} /></div>
          <div><div className="stat-value">{claims.length}</div><div className="stat-label">My Claims</div></div>
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
        {/* Recent contributions */}
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--green-700)', marginBottom: 16 }}>Recent Contributions</h3>
          {contribs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-title">No contributions yet</div></div>
          ) : contribs.map((c) => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.category}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{format(new Date(c.datePaid), 'dd MMM yyyy')}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--green-600)' }}>₪ {c.amount.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--green-700)', marginBottom: 16 }}>Upcoming Events</h3>
          {events.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-title">No upcoming events</div></div>
          ) : events.map((ev) => (
            <div key={ev._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ev.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                📅 {format(new Date(ev.date), 'EEE, dd MMM yyyy')}
                {ev.location && ` · 📍 ${ev.location}`}
              </div>
              <span className="badge badge-green" style={{ marginTop: 6 }}>{ev.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
