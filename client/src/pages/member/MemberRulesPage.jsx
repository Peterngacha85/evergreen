import { useEffect, useState } from 'react';
import { getRules } from '../../api/welfareRules';
import { Book, ChevronRight, Info } from 'lucide-react';

const MemberRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await getRules();
        setRules(res.data);
      } catch (err) {
        console.error('Failed to fetch rules');
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header">
        <h1 className="page-title">Rules & Regulations</h1>
        <p className="page-subtitle">Guidelines for Evergreen Community Welfare</p>
      </div>

      {rules.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Book size={48} style={{ color: 'var(--gray-300)', marginBottom: 16 }} />
          <h3>No rules have been added yet.</h3>
          <p style={{ color: 'var(--text-muted)' }}>Please check back later or contact an official.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {rules.map((rule, idx) => (
            <div key={rule._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ 
                padding: '16px 24px', 
                background: 'var(--gray-50)', 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: 'var(--green-600)', color: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 700
                }}>
                  {idx + 1}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-800)' }}>{rule.title}</h3>
                <span className="badge badge-gray ml-auto">{rule.category}</span>
              </div>
              <div style={{ padding: '24px', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {rule.content}
              </div>
              <div style={{ 
                padding: '12px 24px', 
                background: 'var(--bg)', 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Info size={14} />
                Last updated {new Date(rule.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 40, border: '1px dashed var(--green-200)', background: 'var(--green-50)' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ color: 'var(--green-600)' }}><Info size={24} /></div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--green-800)' }}>Member Responsibility</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--green-700)' }}>
              All members are required to read and understand these rules. Failure to adhere to the welfare guidelines may lead to suspension of benefits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberRulesPage;
