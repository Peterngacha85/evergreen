import { useEffect, useState } from 'react';
import { getLeaders, createLeader, updateLeader, deleteLeader } from '../../api/leaders';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Plus, Edit2, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getMembers } from '../../api/members';

const ManageLeadersPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', idNumber: '', phoneNumber: '', password: '', leaderRole: '', profilePhoto: null, memberId: '', order: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    try {
      const [leaderRes, memberRes] = await Promise.all([getLeaders(), getMembers()]);
      setLeaders(leaderRes.data);
      setMembers(memberRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (leader = null) => {
    setIsPromoting(false);
    if (leader) {
      setIsEditMode(true);
      setFormData({ 
        id: leader._id, 
        name: leader.name, 
        idNumber: leader.idNumber, 
        phoneNumber: leader.phoneNumber, 
        leaderRole: leader.leaderRole,
        password: '', 
        profilePhoto: null,
        memberId: '',
        order: leader.order || 0
      });
    } else {
      setIsEditMode(false);
      setFormData({ id: '', name: '', idNumber: '', phoneNumber: '', password: '', leaderRole: '', profilePhoto: null, memberId: '', order: leaders.length + 1 });
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
    if (isPromoting && formData.memberId) {
      data.append('memberId', formData.memberId);
      data.append('leaderRole', formData.leaderRole);
      data.append('order', formData.order);
    } else {
      data.append('name', formData.name);
      data.append('phoneNumber', formData.phoneNumber);
      data.append('leaderRole', formData.leaderRole);
      data.append('order', formData.order);
      if (formData.password) data.append('password', formData.password);
      if (formData.profilePhoto) data.append('profilePhoto', formData.profilePhoto);
      if (!isEditMode) {
        data.append('idNumber', formData.idNumber);
      }
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
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDelete({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteLeader(confirmDelete.id);
      toast.success('Leader removed');
      setConfirmDelete({ open: false, id: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deletion failed');
    } finally {
      setDeleting(false);
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
                <th>Member No.</th>
                <th>Phone</th>
                <th>Password</th>
                <th>Visible Pwd</th>
                <th>Order</th>
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
                   <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>
                    {l.password?.startsWith('$') ? <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>🔐 Hashed</span> : l.password}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--red-600)' }}>{l.plainPassword || '—'}</td>
                  <td><span className="badge badge-blue">{l.order || 0}</span></td>
                  <td>{format(new Date(l.createdAt), 'dd MMM yyyy')}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(l)} className="btn btn-sm btn-ghost btn-icon" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteClick(l._id)} className="btn btn-sm btn-ghost btn-icon" style={{ color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button>
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
          {!isEditMode && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.9rem', color: 'var(--green-700)', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={isPromoting} 
                  onChange={(e) => setIsPromoting(e.target.checked)} 
                  style={{ width: 16, height: 16 }}
                />
                Promote from existing members
              </label>
            </div>
          )}

          {isPromoting ? (
            <div className="form-group">
              <label className="form-label">Select Member</label>
              <select 
                className="form-select" 
                required 
                value={formData.memberId} 
                onChange={e => setFormData({...formData, memberId: e.target.value})}
              >
                <option value="">-- Select Member --</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.idNumber})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {!isEditMode && (
                  <div className="form-group">
                    <label className="form-label">Member Number (3 digits)</label>
                    <input type="text" className="form-input" required value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} placeholder="e.g. 001" maxLength={3} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Profile Photo (Optional)</label>
                <input type="file" accept="image/*" className="form-input" style={{ padding: '8px 12px' }} onChange={handleFileChange} />
              </div>

              <div className="form-group">
                <label className="form-label">{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="form-input" 
                    required={!isEditMode} 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    style={{ paddingRight: 44 }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--gray-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Official Role (Category)</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.leaderRole} 
              onChange={e => setFormData({...formData, leaderRole: e.target.value})} 
              placeholder="e.g. Patron, Treasurer, etc."
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Display Order (Hierarchy Position)</label>
            <input 
              type="number" 
              className="form-input" 
              required 
              value={formData.order} 
              onChange={e => setFormData({...formData, order: e.target.value})} 
              placeholder="1 for first, 2 for second, etc."
            />
          </div>

          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#111827' }} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Leader'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={confirmDelete.open} 
        onClose={() => setConfirmDelete({ open: false, id: null })} 
        onConfirm={handleConfirmDelete}
        title="Remove Leader"
        message="Are you sure you want to completely remove this official? This action will deactivate their access."
        confirmText="Remove Leader"
        loading={deleting}
      />
    </div>
  );
};

export default ManageLeadersPage;
