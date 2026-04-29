import { useEffect, useState } from 'react';
import { getContributions } from '../../api/contributions';
import { getCategories } from '../../api/categories';
import { Archive, Search, Filter, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const ContributionArchivePage = () => {
  const [contributions, setContributions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, cat] = await Promise.all([
          getContributions(),
          getCategories()
        ]);
        setContributions(c.data);
        setCategories(cat.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = contributions.filter(c => {
    const matchesSearch = !searchTerm || 
      c.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.member?.idNumber?.includes(searchTerm);
    const matchesCategory = !filterCategory || c.category === filterCategory;
    const cDate = new Date(c.datePaid).toISOString().split('T')[0];
    const matchesDateFrom = !dateFrom || cDate >= dateFrom;
    const matchesDateTo = !dateTo || cDate <= dateTo;
    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const totalAmount = filtered.reduce((a, c) => a + c.amount, 0);

  // Group by category for summary
  const categoryTotals = filtered.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + c.amount;
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Archive size={28} /> Contribution Archive
          </h1>
          <p className="page-subtitle">Complete contribution history for all members</p>
        </div>
        <div style={{ background: 'var(--green-50)', border: '2px solid var(--green-200)', borderRadius: 'var(--radius-lg)', padding: '12px 20px', textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--green-600)', fontWeight: 600 }}>Total ({filtered.length} records)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-700)' }}>KES {totalAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Category Summary Cards */}
      {Object.keys(categoryTotals).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {Object.entries(categoryTotals).map(([cat, total]) => (
            <div key={cat} className="stat-card" style={{ padding: '14px 16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{cat}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-700)' }}>KES {total.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input 
              type="text" className="form-input" placeholder="Search by member name or ID..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 42, height: 44, borderRadius: 10 }}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: 160, height: 44, borderRadius: 10 }}
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gray-50)', padding: '4px 10px', borderRadius: 10, border: '1px solid var(--border)', height: 44 }}>
            <input type="date" className="form-input" style={{ border: 'none', background: 'transparent', width: 120, padding: 0 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>→</span>
            <input type="date" className="form-input" style={{ border: 'none', background: 'transparent', width: 120, padding: 0 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo || filterCategory || searchTerm) && (
            <button className="btn btn-ghost" onClick={() => { setSearchTerm(''); setFilterCategory(''); setDateFrom(''); setDateTo(''); }}
              style={{ color: '#dc2626', fontWeight: 600, height: 44 }}>Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date Paid</th>
                <th>Description</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No contributions found</div></div></td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c._id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.member?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.member?.idNumber}</div>
                  </td>
                  <td><span className="badge badge-green">{c.category}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>KES {c.amount.toLocaleString()}</td>
                  <td>{format(new Date(c.datePaid), 'dd MMM yyyy')}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.description || '—'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{c.recordedBy?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContributionArchivePage;
