import { useEffect, useState } from 'react';
import { getLeaders, createLeader, updateLeader, deleteLeader } from '../../api/leaders';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LEADER_ROLES = ['Chairman', 'Vice Chairman', 'Secretary', 'Treasurer', 'Organizer'];

const ManageLeadersPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', idNumber: '', phoneNumber: '', password: '', leaderRole: LEADER_ROLES[0], profilePhoto: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaders = async () => {
    try {
      const res = await getLeaders();
      setLeaders(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leaders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  const handleOpenModal = (leader = null) => {
    if (leader) {
      setIsEditMode(true);
      setFormData({ 
        id: leader._id, 
        name: leader.name, 
        idNumber: leader.idNumber, 
        phoneNumber: leader.phoneNumber, 
        leaderRole: leader.leaderRole,
        password: '', 
        profilePhoto: null 
      });
    } else {
      setIsEditMode(false);
      setFormData({ id: '', name: '', idNumber: '', phoneNumber: '', password: '', leaderRole: LEADER_ROLES[0], profilePhoto: null });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePhoto: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('phoneNumber', formData.phoneNumber);
    data.append('leaderRole', formData.leaderRole);
    if (formData.password) data.append('password', formData.password);
    if (formData.profilePhoto) data.append('profilePhoto', formData.profilePhoto);
    
    if (!isEditMode) {
      data.append('idNumber', formData.idNumber);
    }

    try {
      if (isEditMode) {
        await updateLeader(formData.id, data);
        toast.success('Leader updated successfully');
      } else {
        await createLeader(data);
        toast.success('Leader added successfully');
      }
      setIsModalOpen(false);
      fetchLeaders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to completely remove this leader?')) return;
    try {
      await deleteLeader(id);
      toast.success('Leader removed');
      fetchLeaders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={24} color="#dc2626" /> Manage Leaders
          </h1>
          <p className="page-subtitle">Super Admin control: Register and manage the community officials</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ background: '#111827' }}>
          <Plus size={18} /> Add Leader
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
          <table>
            <thead>
              <tr>
                <th>Official</th>
                <th>Role</th>
                <th>ID Number</th>
                <th>Phone</th>
                <th>Password</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaders.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">No leaders registered yet.</div></td></tr>
              ) : leaders.map(l => (
                <tr key={l._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={l.profilePhoto?.url} name={l.name} size="sm" />
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{l.name}</div>
                    </div>
                  </td>
                  <td><span className="badge badge-lime">{l.leaderRole}</span></td>
                  <td style={{ fontFamily: 'monospace' }}>{l.idNumber}</td>
                  <td>{l.phoneNumber}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--red-600)' }}>
                    {l.password?.startsWith('$') ? '••• (Hashed)' : l.password}
                  </td>
                  <td>{format(new Date(l.createdAt), 'dd MMM yyyy')}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(l)} className="btn btn-sm btn-ghost btn-icon" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(l._id)} className="btn btn-sm btn-ghost btn-icon" style={{ color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Leader' : 'Register New Leader'}>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
          </div>

          <div className="form-group">
            <label className="form-label">Official Role</label>
            <select className="form-select" required value={formData.leaderRole} onChange={e => setFormData({...formData, leaderRole: e.target.value})}>
              {LEADER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Profile Photo (Optional)</label>
            <input type="file" accept="image/*" className="form-input" style={{ padding: '8px 12px' }} onChange={handleFileChange} />
          </div>

          <div className="form-group">
            <label className="form-label">{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</label>
            <input type="password" className="form-input" required={!isEditMode} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          
          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#111827' }} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Leader'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageLeadersPage;
