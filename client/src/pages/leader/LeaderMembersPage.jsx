import { useEffect, useState } from 'react';
import { getMembers, createMember, updateMember, updateMemberPhoto, deleteMember } from '../../api/members';
import { validateSession } from '../../api/changeRequests';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import AccessRequiredModal from '../../components/common/AccessRequiredModal';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const LeaderMembersPage = () => {
  const { isSuperAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', idNumber: '', phoneNumber: '', password: '', profilePhoto: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      const [m, s] = await Promise.all([
        getMembers(),
        !isSuperAdmin ? validateSession().catch(() => ({ data: { hasSession: false } })) : Promise.resolve({ data: { hasSession: true } })
      ]);
      setMembers(m.data);
      setHasAccess(s.data.hasSession);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpenModal = (member = null) => {
    if (!hasAccess && !isSuperAdmin) {
      setIsAccessModalOpen(true);
      return;
    }
    if (member) {
      setIsEditMode(true);
      setFormData({ id: member._id, name: member.name, idNumber: member.idNumber, phoneNumber: member.phoneNumber, password: '', profilePhoto: null });
    } else {
      setIsEditMode(false);
      setFormData({ id: '', name: '', idNumber: '', phoneNumber: '', password: '', profilePhoto: null });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePhoto: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        // Update details first
        await updateMember(formData.id, { name: formData.name, phoneNumber: formData.phoneNumber, ...(formData.password && { password: formData.password }) });
        // Update photo if provided
        if (formData.profilePhoto) {
          const photoData = new FormData();
          photoData.append('profilePhoto', formData.profilePhoto);
          await updateMemberPhoto(formData.id, photoData);
        }
        toast.success('Member updated successfully');
      } else {
        const data = new FormData();
        data.append('name', formData.name);
        data.append('idNumber', formData.idNumber);
        data.append('phoneNumber', formData.phoneNumber);
        if (formData.password) data.append('password', formData.password);
        if (formData.profilePhoto) data.append('profilePhoto', formData.profilePhoto);
        
        await createMember(data);
        toast.success('Member added successfully');
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!hasAccess && !isSuperAdmin) {
      setIsAccessModalOpen(true);
      return;
    }
    if (!window.confirm('Are you sure you want to deactivate this member?')) return;
    try {
      await deleteMember(id);
      toast.success('Member deactivated');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.idNumber.includes(searchTerm) ||
    m.phoneNumber.includes(searchTerm)
  );

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Manage Members</h1>
          <p className="page-subtitle">Register new members or update existing profiles</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} disabled={!hasAccess && !isSuperAdmin}>
          <Plus size={18} /> Add Member
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input 
              type="text" className="form-input" placeholder="Search by name, ID or phone..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>ID Number</th>
                <th>Phone</th>
                <th>Password</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-title">No members found</div></div></td></tr>
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
                  <td style={{ fontFamily: 'monospace', color: 'var(--red-600)' }}>
                    {m.password?.startsWith('$') ? '••• (Hashed)' : m.password}
                  </td>
                  <td>{format(new Date(m.joinDate), 'dd MMM yyyy')}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(m)} className="btn btn-sm btn-ghost btn-icon" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(m._id)} className="btn btn-sm btn-ghost btn-icon" style={{ color: '#dc2626' }} title="Deactivate"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Member' : 'Add New Member'}>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          {!isEditMode && (
            <div className="form-group">
              <label className="form-label">National ID Number</label>
              <input type="text" className="form-input" required value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-input" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</label>
            <input type="password" className="form-input" required={!isEditMode} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Profile Photo (Optional)</label>
            <input type="file" accept="image/*" className="form-input" style={{ padding: '8px 12px' }} onChange={handleFileChange} />
          </div>
          
          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Member'}</button>
          </div>
        </form>
      </Modal>

      <AccessRequiredModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />
    </div>
  );
};

export default LeaderMembersPage;
