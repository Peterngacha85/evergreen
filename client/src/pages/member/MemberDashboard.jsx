import { useEffect, useState } from 'react';
import { Users, TrendingUp, Calendar, FileText, Wallet, Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getContributionSummary } from '../../api/contributions';
import { getMyContributions } from '../../api/contributions';
import { getEvents } from '../../api/events';
import { getMyClaims } from '../../api/claims';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import StatusBadge from '../../components/common/StatusBadge';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary]   = useState(null);
  const [contribs, setContribs] = useState([]);
  const [events, setEvents]     = useState([]);
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, c, e, cl] = await Promise.all([
          getContributionSummary(),
          getMyContributions(),
          getEvents({ upcoming: 'true' }),
          getMyClaims(),
        ]);
        setSummary(s.data);
        setContribs(c.data.slice(0, 5));
        setEvents(e.data.slice(0, 3));
        setClaims(cl.data.slice(0, 3));
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

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><TrendingUp size={22} /></div>
          <div><div className="stat-value">{contribs.length}</div><div className="stat-label">Recent Contributions</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-lime"><Wallet size={22} /></div>
          <div><div className="stat-value">₪ {(summary?.grandTotal || 0).toLocaleString()}</div><div className="stat-label">Total Welfare Fund</div></div>
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
