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

  const cards = [
    { label: 'Current Balance', value: stats.balance, icon: Wallet, color: 'var(--green-600)', bg: 'var(--green-50)' },
    { label: 'Total Contributions', value: stats.totalIn, icon: ArrowUpCircle, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Total Claims Paid', value: stats.totalOut, icon: ArrowDownCircle, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Active Members', value: stats.memberCount, icon: Users, color: '#7c3aed', bg: '#f5f3ff', noKes: true },
  ];

  return (
    <div className="animate-fadein">
      <div className="page-header">
        <h1 className="page-title">Funds Available</h1>
        <p className="page-subtitle">Real-time financial summary of Evergreen Welfare</p>
      </div>

      <div className="grid grid-4 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: card.bg, color: card.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <card.icon size={24} />
              </div>
              {stats.pendingClaims > 0 && card.label === 'Current Balance' && (
                <div className="badge badge-red">-{stats.pendingClaims} Pending Claims</div>
              )}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {card.noKes ? '' : 'KES '}{card.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 gap-6">
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Financial Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="flex justify-between mb-2" style={{ fontSize: '0.9rem' }}>
                <span>Inflow (Contributions)</span>
                <span style={{ fontWeight: 600 }}>100%</span>
              </div>
              <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: '#2563eb' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2" style={{ fontSize: '0.9rem' }}>
                <span>Outflow (Claims)</span>
                <span style={{ fontWeight: 600 }}>{((stats.totalOut / stats.totalIn) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(stats.totalOut / stats.totalIn) * 100}%`, height: '100%', background: '#dc2626' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2" style={{ fontSize: '0.9rem' }}>
                <span>Reserve (Available)</span>
                <span style={{ fontWeight: 600 }}>{((stats.balance / stats.totalIn) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(stats.balance / stats.totalIn) * 100}%`, height: '100%', background: 'var(--green-600)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(to bottom right, var(--green-600), var(--green-800))', color: '#fff' }}>
          <Landmark size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
          <h2 style={{ color: '#fff', marginBottom: 8 }}>Evergreen Treasury</h2>
          <p style={{ opacity: 0.9, maxWidth: 300, fontSize: '0.95rem' }}>
            This balance represents the liquid funds available for welfare activities and approved claims.
          </p>
          <div style={{ marginTop: 24, padding: '12px 24px', background: 'rgba(255,255,255,0.1)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>Total Reserve</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>KES {stats.balance.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderFundsPage;
