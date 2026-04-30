import { useEffect, useState } from 'react';
import { getMembers } from '../../api/members';
import Avatar from '../../components/common/Avatar';
import { Search, Users } from 'lucide-react';
import { format } from 'date-fns';

const MemberListPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMembers = async () => {
    try {
      const res = await getMembers();
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.idNumber.includes(searchTerm) ||
    m.phoneNumber.includes(searchTerm)
  );

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={28} /> Member Directory
        </h1>
        <p className="page-subtitle">View and connect with other members of the Evergreen community</p>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: 24, background: '#fff', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input 
            type="text" className="form-input" placeholder="Search members by name, ID or phone..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 48, height: 48, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Member No.</th>
                <th>Phone Number</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-title">No members found</div></div></td></tr>
              ) : filteredMembers.map(m => (
                <tr key={m._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={m.profilePhoto?.url} name={m.name} size="sm" />
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{m.name}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{m.idNumber}</td>
                  <td>{m.phoneNumber}</td>
                  <td>{format(new Date(m.joinDate), 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberListPage;
