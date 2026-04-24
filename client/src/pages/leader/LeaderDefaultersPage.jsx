import { useEffect, useState } from 'react';
import { getDefaulters } from '../../api/stats';
import Avatar from '../../components/common/Avatar';
import { UserX, Mail, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const LeaderDefaultersPage = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDefaulters();
      setDefaulters(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Defaulters List</h1>
          <p className="page-subtitle">Members who haven't contributed in the last 30 days</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={18} /> Refresh</button>
      </div>

      <div className="card" style={{ background: 'var(--red-50)', border: '1px solid var(--red-200)', marginBottom: 24 }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--red-700)' }}>
          <AlertCircle size={24} />
          <p style={{ fontWeight: 600, margin: 0 }}>
            {defaulters.length} members are currently flagged as defaulters.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Last Contribution</th>
                <th>Amount</th>
                <th>Days Since</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state">No defaulters found. Everyone is up to date! 🎉</div></td></tr>
              ) : defaulters.map((d, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={d.member.profilePhoto?.url} name={d.member.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.member.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {d.member.idNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {d.lastDate ? format(new Date(d.lastDate), 'dd MMM yyyy') : <span style={{ color: 'var(--red-500)', fontWeight: 600 }}>Never</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {d.amount ? `KES ${d.amount.toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <span className="badge" style={{ background: d.daysSince === 'Never' ? 'var(--red-100)' : 'var(--orange-100)', color: d.daysSince === 'Never' ? 'var(--red-700)' : 'var(--orange-700)' }}>
                      {d.daysSince} {d.daysSince === 'Never' ? '' : 'days'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <a href={`tel:${d.member.phoneNumber}`} className="btn btn-sm btn-ghost btn-icon" title="Call Member"><Phone size={16} /></a>
                      <button className="btn btn-sm btn-outline">Send Reminder</button>
                    </div>
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

export default LeaderDefaultersPage;
