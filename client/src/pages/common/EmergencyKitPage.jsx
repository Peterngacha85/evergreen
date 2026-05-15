import { useEffect, useState } from 'react';
import { getFundsOverview } from '../../api/stats';
import { Activity, ArrowUpCircle, ShieldAlert, Receipt, Edit, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const EmergencyKitPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isMember } = useAuth();

  useEffect(() => {
    getFundsOverview().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;
  if (!stats) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="card">Failed to load financial data. Please try again later.</div></div>;

  const cards = [
    { label: 'Kit Balance', value: stats.emergencyBalance, icon: ShieldAlert, color: 'var(--blue-600)', bg: 'var(--blue-50)', trend: 'Available' },
    { label: 'Fees Collected', value: stats.emergencyIn, icon: ArrowUpCircle, color: '#2563eb', bg: '#eff6ff', trend: 'Inflow' },
    { label: 'Expenses Paid', value: stats.totalOutExpenses, icon: Receipt, color: '#f97316', bg: '#fff7ed', trend: 'Outflow' }
  ];

  return (
    <div className="animate-fadein" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: '40px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Emergency Kit</h1>
          <p className="page-subtitle" style={{ fontSize: '1rem', marginTop: '8px' }}>Registration & Emergency Fees vs Community Expenses</p>
        </div>
        {!isMember && (
          <div style={{ display: 'flex', gap: '12px' }}>
             <button className="btn btn-ghost" onClick={() => navigate('/leader/contributions')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
               <DollarSign size={16} /> Manage Fees
             </button>
             <button className="btn btn-primary" onClick={() => navigate('/leader/expenses')} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#ef4444' }}>
               <Edit size={16} /> Manage Expenses
             </button>
          </div>
        )}
      </div>

      <div className="grid grid-3 gap-8 mb-12">
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
                ₪ {card.value.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 gap-8">
        <div className="card" style={{ padding: '40px' }}>
          <div className="flex justify-between items-center mb-10">
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Kit Distribution</h3>
            <div className="badge badge-gray" style={{ padding: '4px 12px' }}>Overview</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: '#2563eb' }} /> Inflow (Fees)</span>
                <span style={{ fontWeight: 800 }}>100%</span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: '#2563eb' }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: '#f97316' }} /> Outflow (Expenses)</span>
                <span style={{ fontWeight: 800 }}>{stats.emergencyIn > 0 ? ((stats.totalOutExpenses / stats.emergencyIn) * 100).toFixed(1) : '0.0'}%</span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${stats.emergencyIn > 0 ? (stats.totalOutExpenses / stats.emergencyIn) * 100 : 0}%`, height: '100%', background: '#f97316' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--blue-600)' }} /> Reserve (Available)</span>
                <span style={{ fontWeight: 800 }}>{stats.emergencyIn > 0 ? ((stats.emergencyBalance / stats.emergencyIn) * 100).toFixed(1) : '0.0'}%</span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${stats.emergencyIn > 0 ? (stats.emergencyBalance / stats.emergencyIn) * 100 : 0}%`, height: '100%', background: 'var(--blue-600)' }} />
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
          background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', 
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
            <Activity size={48} style={{ color: '#93c5fd' }} />
          </div>
          <h2 style={{ color: '#fff', marginBottom: 16, fontSize: '2rem', fontWeight: 800 }}>Emergency Kit</h2>
          <p style={{ opacity: 0.85, maxWidth: 360, fontSize: '1.05rem', lineHeight: 1.7 }}>
            Funds strictly allocated from Registration and Emergency Fees, utilized for covering operational community expenses.
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
            <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginBottom: 12 }}>Kit Balance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#bfdbfe', letterSpacing: '-0.02em' }}>₪ {stats.emergencyBalance.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyKitPage;
