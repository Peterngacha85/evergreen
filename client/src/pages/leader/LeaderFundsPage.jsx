import { useEffect, useState } from 'react';
import { getFundsOverview } from '../../api/stats';
import { Landmark, ArrowUpCircle, ArrowDownCircle, Wallet, Users, Clock } from 'lucide-react';

const LeaderFundsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFundsOverview().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  const lastUpdated = new Date().toLocaleString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const cards = [
    { label: 'Current Balance', value: stats.balance, icon: Wallet, color: 'var(--green-600)', bg: 'var(--green-50)', trend: 'Liquid' },
    { label: 'Total Contributions', value: stats.totalIn, icon: ArrowUpCircle, color: '#2563eb', bg: '#eff6ff', trend: 'Inflow' },
    { label: 'Total Claims Paid', value: stats.totalOut, icon: ArrowDownCircle, color: '#dc2626', bg: '#fef2f2', trend: 'Outflow' },
    { label: 'Active Members', value: stats.memberCount, icon: Users, color: '#7c3aed', bg: '#f5f3ff', noKes: true, trend: 'Growth' },
  ];

  return (
    <div className="animate-fadein">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Funds Available</h1>
          <p className="page-subtitle">Real-time financial summary of Evergreen Welfare</p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          padding: '8px 16px', 
          background: 'var(--white)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Clock size={16} className="text-muted" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>
            As per {lastUpdated}
          </span>
        </div>
      </div>

      <div className="grid grid-4 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="card" style={{ 
            padding: '24px', 
            position: 'relative', 
            overflow: 'hidden',
            borderBottom: `4px solid ${card.color}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 14, 
                background: card.bg, color: card.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <card.icon size={24} />
              </div>
              <div className="badge" style={{ background: card.bg, color: card.color }}>{card.trend}</div>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>
              {card.noKes ? '' : 'KES '}{card.value.toLocaleString()}
            </div>

            {stats.pendingClaims > 0 && card.label === 'Current Balance' && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.5s infinite' }} />
                {stats.pendingClaims} PENDING CLAIMS
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-2 gap-6">
        <div className="card" style={{ padding: '32px' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ margin: 0 }}>Financial Distribution</h3>
            <div className="badge badge-gray">Overview</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div className="flex justify-between mb-3" style={{ fontSize: '0.9rem' }}>
                <span className="flex items-center gap-2"><div style={{ width: 10, height: 10, borderRadius: 3, background: '#2563eb' }} /> Inflow (Contributions)</span>
                <span style={{ fontWeight: 700 }}>100%</span>
              </div>
              <div style={{ height: 10, background: 'var(--gray-100)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: '#2563eb' }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-3" style={{ fontSize: '0.9rem' }}>
                <span className="flex items-center gap-2"><div style={{ width: 10, height: 10, borderRadius: 3, background: '#dc2626' }} /> Outflow (Claims)</span>
                <span style={{ fontWeight: 700 }}>{((stats.totalOut / stats.totalIn) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--gray-100)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${(stats.totalOut / stats.totalIn) * 100}%`, height: '100%', background: '#dc2626' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-3" style={{ fontSize: '0.9rem' }}>
                <span className="flex items-center gap-2"><div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--green-600)' }} /> Reserve (Available)</span>
                <span style={{ fontWeight: 700 }}>{((stats.balance / stats.totalIn) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--gray-100)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${(stats.balance / stats.totalIn) * 100}%`, height: '100%', background: 'var(--green-600)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, var(--green-600), var(--green-800))', 
          color: '#fff',
          padding: '40px',
          border: 'none',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', 
            background: 'rgba(255,255,255,0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20
          }}>
            <Landmark size={40} style={{ color: 'var(--green-300)' }} />
          </div>
          <h2 style={{ color: '#fff', marginBottom: 12, fontSize: '1.75rem', fontWeight: 800 }}>Evergreen Treasury</h2>
          <p style={{ opacity: 0.85, maxWidth: 320, fontSize: '0.95rem', lineHeight: 1.6 }}>
            This balance represents the liquid funds available for welfare activities and approved member claims.
          </p>
          <div style={{ 
            marginTop: 32, 
            padding: '20px 32px', 
            background: 'rgba(255,255,255,0.08)', 
            borderRadius: 20, 
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            width: '100%'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>Total Available Reserve</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--green-300)' }}>KES {stats.balance.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderFundsPage;
