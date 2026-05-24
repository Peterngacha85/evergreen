import { useEffect, useState } from 'react';
import { getFundsOverview } from '../../api/stats';
import { Landmark, ArrowUpCircle, ArrowDownCircle, Wallet, Clock, Flag, CheckCircle } from 'lucide-react';

const LeaderFundsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFundsOverview().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;
  if (!stats) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="card">Failed to load financial data. Please try again later.</div></div>;

  const lastUpdated = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const campaign = stats.campaignStats;
  const campaignProgress = campaign?.campaign?.targetAmount
    ? Math.min(100, (campaign.totalRaised / campaign.campaign.targetAmount) * 100)
    : null;

  return (
    <div className="animate-fadein" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: '40px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>Funds Available</h1>
          <p className="page-subtitle" style={{ fontSize: '1rem', marginTop: '8px' }}>Emergency Kit reserve &amp; active campaign tracker</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: 'var(--white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <Clock size={18} className="text-muted" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-700)' }}>As per {lastUpdated}</span>
        </div>
      </div>

      {/* Active Campaign (if any) */}
      {campaign ? (
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)',
          borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 32,
          color: '#fff', boxShadow: '0 6px 28px rgba(37,99,235,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flag size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>🟢 Active Contribution Campaign</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 6 }}>{campaign.campaign.title}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ background: 'rgba(255,255,255,0.18)', padding: '3px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>{campaign.campaign.category}</span>
                {campaign.campaign.targetMember && (
                  <span style={{ opacity: 0.85, fontSize: '0.85rem' }}>For: <strong>{campaign.campaign.targetMember.name}</strong></span>
                )}
                <span style={{ opacity: 0.75, fontSize: '0.82rem' }}>{campaign.contributionCount} contributions</span>
              </div>
              {campaignProgress !== null ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.85, marginBottom: 6 }}>
                    <span>KSh {campaign.totalRaised.toLocaleString()} raised</span>
                    <span>Target: KSh {campaign.campaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${campaignProgress}%`, height: '100%', background: '#86efac', borderRadius: 5, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 5 }}>{campaignProgress.toFixed(0)}% of target reached</div>
                </div>
              ) : (
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#86efac' }}>
                  KSh {campaign.totalRaised.toLocaleString()}
                  <span style={{ fontSize: '0.85rem', opacity: 0.75, fontWeight: 500, marginLeft: 8 }}>raised so far</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--gray-50)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '22px 28px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Flag size={22} style={{ color: 'var(--gray-400)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--gray-700)' }}>No Active Contribution Campaign</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Campaign contributions will appear here when a leader starts one.
            </div>
          </div>
        </div>
      )}

      {/* Emergency Kit Cards */}
      <div className="grid grid-3 gap-8 mb-12">
        {[
          { label: 'Emergency Kit Balance', value: stats.emergencyBalance, icon: Wallet, color: 'var(--green-600)', bg: 'var(--green-50)', trend: 'Available Reserve', highlight: true },
          { label: 'Total Fees Collected', value: stats.emergencyIn, icon: ArrowUpCircle, color: '#2563eb', bg: '#eff6ff', trend: 'Inflow' },
          { label: 'Total Expenses', value: stats.totalOutExpenses, icon: ArrowDownCircle, color: '#dc2626', bg: '#fef2f2', trend: 'Outflow' },
        ].map((card, idx) => (
          <div key={idx} className="card" style={{
            padding: '32px', position: 'relative', overflow: 'hidden',
            borderBottom: `5px solid ${card.color}`,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            ...(card.highlight ? { boxShadow: '0 4px 24px rgba(22,163,74,0.13)' } : {})
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={28} />
              </div>
              <div className="badge" style={{ background: card.bg, color: card.color, padding: '4px 12px' }}>{card.trend}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em' }}>
                KSh {card.value.toLocaleString()}
              </div>
              {stats.pendingClaims > 0 && card.highlight && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: '0.8rem', fontWeight: 800 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.5s infinite' }} />
                  {stats.pendingClaims} PENDING CLAIMS
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column: Distribution & Info */}
      <div className="grid grid-2 gap-8">
        <div className="card" style={{ padding: '40px' }}>
          <div className="flex justify-between items-center mb-10">
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Emergency Kit Distribution</h3>
            <div className="badge badge-gray" style={{ padding: '4px 12px' }}>Reserve Overview</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: '#2563eb' }} /> Fees Collected (Inflow)</span>
                <span style={{ fontWeight: 800 }}>100%</span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: '#2563eb' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: '#dc2626' }} /> Expenses (Outflow)</span>
                <span style={{ fontWeight: 800 }}>
                  {stats.emergencyIn > 0 ? ((stats.totalOutExpenses / stats.emergencyIn) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${stats.emergencyIn > 0 ? (stats.totalOutExpenses / stats.emergencyIn) * 100 : 0}%`, height: '100%', background: '#dc2626' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-4" style={{ fontSize: '0.95rem' }}>
                <span className="flex items-center gap-3"><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--green-600)' }} /> Available Balance</span>
                <span style={{ fontWeight: 800 }}>
                  {stats.emergencyIn > 0 ? ((stats.emergencyBalance / stats.emergencyIn) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div style={{ height: 12, background: 'var(--gray-100)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${stats.emergencyIn > 0 ? Math.max(0, stats.emergencyBalance / stats.emergencyIn) * 100 : 0}%`, height: '100%', background: 'var(--green-600)' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
          background: 'linear-gradient(135deg, var(--green-600), var(--green-800))',
          color: '#fff', padding: '60px 40px', border: 'none', boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Landmark size={48} style={{ color: 'var(--green-300)' }} />
          </div>
          <h2 style={{ color: '#fff', marginBottom: 16, fontSize: '2rem', fontWeight: 800 }}>Emergency Kit</h2>
          <p style={{ opacity: 0.85, maxWidth: 360, fontSize: '1.05rem', lineHeight: 1.7 }}>
            This reserve is built from Registration &amp; Emergency fees. Expenses are deducted from it. Campaign contributions are tracked separately.
          </p>
          <div style={{ marginTop: 40, padding: '24px 40px', background: 'rgba(255,255,255,0.08)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', width: '100%' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginBottom: 12 }}>Available Reserve</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-300)', letterSpacing: '-0.02em' }}>
              KSh {stats.emergencyBalance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderFundsPage;
