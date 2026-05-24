import { useEffect, useState } from 'react';
import { getMyContributions } from '../../api/contributions';
import { getActiveCampaign, getCampaignHistory } from '../../api/campaigns';
import { format } from 'date-fns';
import { Flag, History, ListOrdered } from 'lucide-react';

const MemberContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'history'

  useEffect(() => {
    Promise.all([
      getMyContributions(),
      getActiveCampaign(),
      getCampaignHistory(),
    ])
      .then(([c, ac, hist]) => {
        setContributions(c.data);
        setActiveCampaign(ac.data);
        setCampaignHistory(hist.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(contributions.map(c => c.category))];
  const filtered = filter ? contributions.filter(c => c.category === filter) : contributions;
  const total = contributions.reduce((a, c) => a + c.amount, 0);

  const campaignProgress = activeCampaign?.targetAmount
    ? Math.min(100, ((activeCampaign.totalRaised || 0) / activeCampaign.targetAmount) * 100)
    : null;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Contribution Records</h1>
          <p className="page-subtitle">Your contributions and active welfare campaign</p>
        </div>
        <div style={{ background: 'var(--green-50)', border: '2px solid var(--green-200)', borderRadius: 'var(--radius-lg)', padding: '12px 20px', textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--green-600)', fontWeight: 600 }}>My Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-700)' }}>KSh {total.toLocaleString()}</div>
        </div>
      </div>

      {/* Active Campaign Card */}
      {activeCampaign ? (
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          borderRadius: 'var(--radius-xl)', padding: '20px 24px', marginBottom: 24,
          color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flag size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>🟢 Active Campaign</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{activeCampaign.title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: campaignProgress !== null ? 10 : 0 }}>
            <span style={{ background: 'rgba(255,255,255,0.18)', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
              {activeCampaign.category}
            </span>
            {activeCampaign.targetMember && (
              <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>For: <strong>{activeCampaign.targetMember.name}</strong></span>
            )}
          </div>
          {campaignProgress !== null ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', opacity: 0.85, marginBottom: 6 }}>
                <span>KSh {(activeCampaign.totalRaised || 0).toLocaleString()} raised</span>
                <span>Target: KSh {activeCampaign.targetAmount.toLocaleString()}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${campaignProgress}%`, height: '100%', background: '#86efac', borderRadius: 4 }} />
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>
              KSh {(activeCampaign.totalRaised || 0).toLocaleString()} raised · {activeCampaign.contributionCount || 0} contributions
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: 'var(--gray-50)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Flag size={20} style={{ color: 'var(--gray-400)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--gray-600)' }}>No Active Contribution Campaign</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Your group leaders will start a campaign when a member needs welfare support.
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--gray-100)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('my')}
          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
            background: activeTab === 'my' ? '#fff' : 'transparent', color: activeTab === 'my' ? 'var(--gray-900)' : 'var(--text-muted)',
            boxShadow: activeTab === 'my' ? '0 1px 6px rgba(0,0,0,0.1)' : 'none' }}
        >
          <ListOrdered size={16} /> My Contributions
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
            background: activeTab === 'history' ? '#fff' : 'transparent', color: activeTab === 'history' ? 'var(--gray-900)' : 'var(--text-muted)',
            boxShadow: activeTab === 'history' ? '0 1px 6px rgba(0,0,0,0.1)' : 'none' }}
        >
          <History size={16} /> Campaign History {campaignHistory.length > 0 && <span style={{ background: 'var(--green-100)', color: 'var(--green-700)', borderRadius: 20, padding: '0 7px', fontSize: '0.72rem', fontWeight: 700 }}>{campaignHistory.length}</span>}
        </button>
      </div>

      {activeTab === 'my' ? (
        <>
          {/* Category filter */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setFilter('')} className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-outline'}`}>All</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-outline'}`}>{cat}</button>
            ))}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category</th>
                    <th>Campaign / Type</th>
                    <th>Description</th>
                    <th>Date Paid</th>
                    <th>Amount (KSh)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No contributions found</div></div></td></tr>
                  ) : filtered.map((c, i) => (
                    <tr key={c._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td><span className="badge badge-green">{c.category}</span></td>
                      <td>
                        {c.campaign ? (
                          <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
                            {c.campaign?.title || 'Campaign'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Emergency Kit</span>
                        )}
                      </td>
                      <td>{c.description || '—'}</td>
                      <td>{format(new Date(c.datePaid), 'dd MMM yyyy')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--green-600)' }}>KSh {c.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Campaign History Tab */
        <div>
          {campaignHistory.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🏁</div>
                <div className="empty-state-title">No completed campaigns yet</div>
                <div className="empty-state-subtitle">Completed welfare campaigns will appear here.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {campaignHistory.map((camp, idx) => (
                <div key={camp._id} className="card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Flag size={16} style={{ color: 'var(--green-600)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '1rem' }}>{camp.title}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                            <span className="badge badge-green">{camp.category}</span>
                            {camp.targetMember && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>For {camp.targetMember.name}</span>}
                          </div>
                        </div>
                      </div>
                      {camp.payoutNotes && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8, paddingLeft: 44 }}>
                          📝 {camp.payoutNotes}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, paddingLeft: 44 }}>
                        Completed {camp.completedAt ? format(new Date(camp.completedAt), 'dd MMM yyyy') : '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: 'var(--green-700)', fontSize: '1.3rem' }}>
                        KSh {(camp.totalAmountRaised || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Raised</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 10px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                          ✓ Paid Out
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberContributions;
