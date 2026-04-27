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
      // Sort by order number (handled by backend but good to ensure)
      const sorted = r.data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setLeaders(sorted);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  // Split into tiers based on order
  const tier1 = leaders.filter(l => (l.order === 1));
  const tier2 = leaders.filter(l => (l.order === 2 || l.order === 3));
  const tier3 = leaders.filter(l => (l.order >= 4 || !l.order));

  const LeaderCard = ({ leader, large = false }) => {
    // Determine colors based on order or role
    const isSpecial = leader.order >= 1 && leader.order <= 3;
    const colors = isSpecial 
      ? (leader.order === 1 ? { bg: '#dcfce7', text: '#15803d', border: '#86efac' } : { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' })
      : { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };

    // Customize for specific roles if needed, or use a default premium look
    const roleColor = leader.leaderRole.toUpperCase() === 'PATRON' ? { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' } : colors;

    return (
      <div style={{
        background: 'white', borderRadius: 'var(--radius-xl)', padding: large ? 32 : 24,
        border: `2px solid ${roleColor.border}`, boxShadow: 'var(--shadow-md)',
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        transition: 'transform 0.2s, box-shadow 0.2s',
        width: '100%'
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
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 'var(--radius-full)', background: roleColor.bg, color: roleColor.text, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, marginTop: 20 }}>
        
        {/* Tier 1 — Single Leader at Top */}
        {tier1.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
            {tier1.map(l => (
              <div key={l._id} style={{ width: '100%', maxWidth: 380 }}>
                <LeaderCard leader={l} large />
              </div>
            ))}
            {tier2.length > 0 && <div style={{ width: 2, height: 40, background: 'var(--green-200)' }} />}
          </div>
        )}

        {/* Tier 2 — 2-3 Leaders Side-by-Side */}
        {tier2.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${Math.min(tier2.length, 3)}, 1fr)`, 
              gap: 24, 
              width: '100%', 
              maxWidth: 800 
            }}>
              {tier2.map(l => <LeaderCard key={l._id} leader={l} />)}
            </div>
            {tier3.length > 0 && <div style={{ width: 2, height: 40, background: 'var(--green-200)' }} />}
          </div>
        )}

        {/* Tier 3 — Everyone Else in a Grid */}
        {tier3.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: 24, 
            width: '100%', 
            maxWidth: 1100 
          }}>
            {tier3.map(l => <LeaderCard key={l._id} leader={l} />)}
          </div>
        )}

        {leaders.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No officials have been registered yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficialsPage;
