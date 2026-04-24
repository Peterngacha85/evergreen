import { useEffect, useState } from 'react';
import { getLeaders } from '../../api/leaders';
import Avatar from '../../components/common/Avatar';
import { Phone, Mail } from 'lucide-react';

const ROLE_ORDER = ['Chairman', 'Vice Chairman', 'Secretary', 'Treasurer', 'Organizer'];
const ROLE_COLORS = {
  'Chairman':      { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  'Vice Chairman': { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'Secretary':     { bg: '#fef9c3', text: '#b45309', border: '#fde047' },
  'Treasurer':     { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  'Organizer':     { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
};

const OfficialsPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaders().then(r => {
      const sorted = r.data.sort((a, b) => ROLE_ORDER.indexOf(a.leaderRole) - ROLE_ORDER.indexOf(b.leaderRole));
      setLeaders(sorted);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  // Chairman gets a hero card, rest in grid
  const chairman   = leaders.find(l => l.leaderRole === 'Chairman');
  const viceChair  = leaders.find(l => l.leaderRole === 'Vice Chairman');
  const rest       = leaders.filter(l => !['Chairman', 'Vice Chairman'].includes(l.leaderRole));

  const LeaderCard = ({ leader, large = false }) => {
    const colors = ROLE_COLORS[leader.leaderRole] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    return (
      <div style={{
        background: 'white', borderRadius: 'var(--radius-xl)', padding: large ? 32 : 24,
        border: `2px solid ${colors.border}`, boxShadow: 'var(--shadow-md)',
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      >
        <div style={{ position: 'relative' }}>
          <Avatar src={leader.profilePhoto?.url} name={leader.name} size={large ? '2xl' : 'xl'} />
          <div style={{
            position: 'absolute', bottom: 4, right: 4, width: 18, height: 18,
            background: 'var(--green-500)', borderRadius: '50%', border: '2px solid white',
          }} />
        </div>
        <div>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 'var(--radius-full)', background: colors.bg, color: colors.text, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {leader.leaderRole}
          </span>
        </div>
        <h3 style={{ fontWeight: 800, fontSize: large ? '1.3rem' : '1rem', color: 'var(--gray-800)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {leader.name}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Phone size={13} />{leader.phoneNumber}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadein">
      <div className="page-header">
        <h1 className="page-title">Our Officials</h1>
        <p className="page-subtitle">Meet the Evergreen Community leadership team</p>
      </div>

      {/* Hierarchy visual */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        {/* Tier 1 — Chairman */}
        {chairman && (
          <div style={{ width: '100%', maxWidth: 340 }}>
            <LeaderCard leader={chairman} large />
          </div>
        )}

        {/* Connector */}
        {chairman && viceChair && (
          <div style={{ width: 2, height: 32, background: 'var(--green-300)' }} />
        )}

        {/* Tier 2 — Vice Chairman */}
        {viceChair && (
          <div style={{ width: '100%', maxWidth: 300 }}>
            <LeaderCard leader={viceChair} />
          </div>
        )}

        {/* Connector line to rest */}
        {rest.length > 0 && viceChair && (
          <div style={{ width: 2, height: 32, background: 'var(--green-300)' }} />
        )}

        {/* Tier 3 — Rest */}
        {rest.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(rest.length, 3)}, 1fr)`, gap: 20, width: '100%', maxWidth: 900 }}>
            {rest.map(l => <LeaderCard key={l._id} leader={l} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficialsPage;
