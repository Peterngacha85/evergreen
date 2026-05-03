import { useEffect, useState } from 'react';
import { getMyClaims } from '../../api/claims';
import { format } from 'date-fns';
import StatusBadge from '../../components/common/StatusBadge';

const MemberClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyClaims().then(r => setClaims(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header">
        <h1 className="page-title">My Claims</h1>
        <p className="page-subtitle">Track your medical, bereavement, and other claims</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title & Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📄</div><div className="empty-state-title">No claims found</div><div className="empty-state-text">You haven't made any claims yet.</div></div></td></tr>
              ) : claims.map(c => (
                <tr key={c._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: 2 }}>{c.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description}</div>
                  </td>
                  <td><span className="badge badge-gray">{c.claimType}</span></td>
                  <td style={{ fontWeight: 700 }}>₪ {c.amount.toLocaleString()}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberClaimsPage;
