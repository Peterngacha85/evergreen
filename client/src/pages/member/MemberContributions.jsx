import { useEffect, useState } from 'react';
import { getMyContributions } from '../../api/contributions';
import { format } from 'date-fns';

const MemberContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    getMyContributions().then(r => setContributions(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(contributions.map(c => c.category))];
  const filtered = filter ? contributions.filter(c => c.category === filter) : contributions;
  const total = filtered.reduce((a, c) => a + c.amount, 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Contribution History</h1>
          <p className="page-subtitle">Your complete contribution record</p>
        </div>
        <div style={{ background: 'var(--green-50)', border: '2px solid var(--green-200)', borderRadius: 'var(--radius-lg)', padding: '12px 20px', textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--green-600)', fontWeight: 600 }}>Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-700)' }}>₪ {total.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                <th>Description</th>
                <th>Date Paid</th>
                <th>Amount (₪)</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No contributions found</div></div></td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c._id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td><span className="badge badge-green">{c.category}</span></td>
                  <td>{c.description || '—'}</td>
                  <td>{format(new Date(c.datePaid), 'dd MMM yyyy')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--green-600)' }}>₪ {c.amount.toLocaleString()}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {c.recordedBy?.name} <span style={{ fontSize: '0.72rem' }}>({c.recordedBy?.leaderRole})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberContributions;
