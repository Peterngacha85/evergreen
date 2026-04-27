import { useEffect, useState } from 'react';
import { getFundsOverview } from '../../api/stats';
import { Landmark, ArrowUpCircle, ArrowDownCircle, Wallet, Users, Clock, Receipt } from 'lucide-react';

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
    { label: 'Claims Paid', value: stats.totalOutClaims, icon: ArrowDownCircle, color: '#dc2626', bg: '#fef2f2', trend: 'Outflow' },
    { label: 'Expenses Paid', value: stats.totalOutExpenses, icon: Receipt, color: '#f97316', bg: '#fff7ed', trend: 'Costs' },
  ];

  return (
    <div className="animate-fadein" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: '40px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Funds Available</h1>
          <p className="page-subtitle" style={{ fontSize: '1rem', marginTop: '8px' }}>Real-time financial summary of Evergreen Community</p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          padding: '10px 20px', 
          background: 'var(--white)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Clock size={18} className="text-muted" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-700)' }}>
            As per {lastUpdated}
          </span>
        </div>
      </div>

      <div className="grid grid-4 gap-8 mb-12">
        {cards.map((card, idx) => (
          <div key={idx} className="card" style={{ 
            padding: '32px', 
            position: 'relative', 
            overflow: 'hidden',
            borderBottom: `5px solid ${card.color}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 16, 
                background: card.bg, color: card.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <card.icon size={28} />
              </div>
              <div className="badge" style={{ background: card.bg, color: card.color, padding: '4px 12px' }}>{card.trend}</div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em' }}>
                {card.noKes ? '' : 'KES '}{card.value.toLocaleString()}
              </div>

              {stats.pendingClaims > 0 && card.label === 'Current Balance' && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: '0.8rem', fontWeight: 800 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.5s infinite' }} />
                  {stats.pendingClaims} PENDING CLAIMS
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 gap-8">
        <div className="card" style={{ padding: '40px' }}>
          <div className="flex justify-between items-center mb-10">
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Financial Distribution</h3>
            <div className="badge badge-gray" style={{ padding: '4px 12px' }}>Overview</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: '#2563eb' }} /> Inflow (Contributions)</span>
                <span style={{ fontWeight: 800 }}>100%</span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: '#2563eb' }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: '#dc2626' }} /> Outflow (Claims)</span>
                <span style={{ fontWeight: 800 }}>{((stats.totalOutClaims / stats.totalIn) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${(stats.totalOutClaims / stats.totalIn) * 100}%`, height: '100%', background: '#dc2626' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: '#f97316' }} /> Outflow (Expenses)</span>
                <span style={{ fontWeight: 800 }}>{((stats.totalOutExpenses / stats.totalIn) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${(stats.totalOutExpenses / stats.totalIn) * 100}%`, height: '100%', background: '#f97316' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--green-600)' }} /> Reserve (Available)</span>
                <span style={{ fontWeight: 800 }}>{((stats.balance / stats.totalIn) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
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
          padding: '60px 40px',
          border: 'none',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ 
            width: 100, height: 100, borderRadius: '50%', 
            background: 'rgba(255,255,255,0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24
          }}>
            <Landmark size={48} style={{ color: 'var(--green-300)' }} />
          </div>
          <h2 style={{ color: '#fff', marginBottom: 16, fontSize: '2rem', fontWeight: 800 }}>Evergreen Treasury</h2>
          <p style={{ opacity: 0.85, maxWidth: 360, fontSize: '1.05rem', lineHeight: 1.7 }}>
            This balance represents the liquid funds available for welfare activities and approved member claims.
          </p>
          <div style={{ 
            marginTop: 40, 
            padding: '24px 40px', 
            background: 'rgba(255,255,255,0.08)', 
            borderRadius: 24, 
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            width: '100%'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginBottom: 12 }}>Total Available Reserve</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-300)', letterSpacing: '-0.02em' }}>KES {stats.balance.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderFundsPage;
