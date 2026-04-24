import { useEffect, useState } from 'react';
import { getContributions, addContribution, updateContribution, deleteContribution } from '../../api/contributions';
import { getMembers } from '../../api/members';
import { getCategories, createCategory } from '../../api/categories';
import { validateSession } from '../../api/changeRequests';
import { useSocket } from '../../context/SocketContext';
import Modal from '../../components/common/Modal';
import AccessRequiredModal from '../../components/common/AccessRequiredModal';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const LeaderContributionsPage = () => {
  const socket = useSocket();
  const { isSuperAdmin } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', memberId: '', amount: '', category: '', description: '', datePaid: '' });
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = async () => {
    try {
      const [c, m, s, cat] = await Promise.all([
        getContributions(),
        getMembers(),
        !isSuperAdmin ? validateSession().catch(() => ({ data: { hasSession: false } })) : Promise.resolve({ data: { hasSession: true } }),
        getCategories()
      ]);
      setContributions(c.data);
      setMembers(m.data);
      setHasAccess(s.data.hasSession);
      setCategories(cat.data);
      if (cat.data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: cat.data[0].name }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('categoryAdded', (newCat) => {
        setCategories(prev => {
          if (prev.find(c => c._id === newCat._id)) return prev;
          return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name));
        });
      });
    }
    return () => {
      if (socket) socket.off('categoryAdded');
    };
  }, [socket]);

  const handleOpenModal = (contrib = null) => {
    if (!hasAccess && !isSuperAdmin) {
      setIsAccessModalOpen(true);
      return;
    }
    if (contrib) {
      setIsEditMode(true);
      setFormData({ 
        id: contrib._id, 
        memberId: contrib.member._id, 
        amount: contrib.amount, 
        category: contrib.category, 
        description: contrib.description || '', 
        datePaid: new Date(contrib.datePaid).toISOString().split('T')[0] 
      });
    } else {
      setIsEditMode(false);
      setFormData({ 
        id: '', 
        memberId: '', 
        amount: '', 
        category: categories.length > 0 ? categories[0].name : '', 
        description: '', 
        datePaid: new Date().toISOString().split('T')[0] 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      if (isEditMode) {
        await updateContribution(formData.id, payload);
        toast.success('Contribution updated');
      } else {
        await addContribution(payload);
        toast.success('Contribution recorded');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await createCategory({ name: newCategoryName, type: 'contribution' });
      toast.success('Category added');
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      // Socket will update the list for everyone
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDelete = async (id) => {
    if (!hasAccess && !isSuperAdmin) {
      setIsAccessModalOpen(true);
      return;
    }
    if (!window.confirm('Delete this contribution record?')) return;
    try {
      await deleteContribution(id);
      toast.success('Record deleted');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const filteredContributions = contributions.filter(c => {
    const matchesSearch = c.member?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.member?.idNumber.includes(searchTerm);
    const matchesCategory = filterCategory === '' || c.category === filterCategory;
    
    const cDate = new Date(c.datePaid).toISOString().split('T')[0];
    const matchesDateFrom = !dateFrom || cDate >= dateFrom;
    const matchesDateTo = !dateTo || cDate <= dateTo;

    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Manage Contributions</h1>
          <p className="page-subtitle">Search and manage member financial records</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={18} /> Record Contribution</button>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: 24, background: '#fff', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
            <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input 
              type="text" className="form-input" placeholder="Search by member name or ID number..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 48, height: 48, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select 
              className="form-select" 
              style={{ width: 'auto', minWidth: 180, height: 48, borderRadius: 12 }}
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-50)', padding: '4px 12px', borderRadius: 12, border: '1px solid var(--border)', height: 48 }}>
              <input 
                type="date" className="form-input" style={{ border: 'none', background: 'transparent', width: 130, padding: 0 }}
                value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              />
              <span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>→</span>
              <input 
                type="date" className="form-input" style={{ border: 'none', background: 'transparent', width: 130, padding: 0 }}
                value={dateTo} onChange={e => setDateTo(e.target.value)}
              />
            </div>

            {(dateFrom || dateTo || filterCategory || searchTerm) && (
              <button 
                className="btn btn-ghost" 
                onClick={() => { setSearchTerm(''); setFilterCategory(''); setDateFrom(''); setDateTo(''); }}
                style={{ color: '#dc2626', fontWeight: 600, height: 48 }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date Paid</th>
                <th>Recorded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContributions.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No matching contributions found.</div></td></tr>
              ) : filteredContributions.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.member?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.member?.idNumber}</div>
                  </td>
                  <td><span className="badge badge-green">{c.category}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>KES {c.amount.toLocaleString()}</td>
                  <td>{format(new Date(c.datePaid), 'dd MMM yyyy')}</td>
                  <td style={{ fontSize: '0.8rem' }}>{c.recordedBy?.name}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(c)} className="btn btn-sm btn-ghost btn-icon"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(c._id)} className="btn btn-sm btn-ghost btn-icon" style={{ color: '#dc2626' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Contribution' : 'Record Contribution'}>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          {!isEditMode && (
            <div className="form-group">
              <label className="form-label">Select Member</label>
              <select className="form-select" required value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})}>
                <option value="">-- Choose Member --</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.idNumber})</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label">Category</label>
              <button type="button" onClick={() => setIsCategoryModalOpen(true)} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add New</button>
            </div>
            <select className="form-select" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="">-- Choose Category --</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (KES)</label>
            <input type="number" className="form-input" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Date Paid</label>
            <input type="date" className="form-input" required value={formData.datePaid} onChange={e => setFormData({...formData, datePaid: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Notes (Optional)</label>
            <textarea 
              className="form-input" 
              rows="3"
              style={{ resize: 'none', height: 'auto' }}
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>
          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Record'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Add New Category">
        <form onSubmit={handleAddCategory} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input 
              type="text" className="form-input" required placeholder="e.g. Test Firmanty" 
              value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} 
            />
          </div>
          <div className="flex justify-between" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Category</button>
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

export default LeaderContributionsPage;
