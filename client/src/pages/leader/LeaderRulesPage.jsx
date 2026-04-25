import { useEffect, useState } from 'react';
import { getRules, createRule, updateRule, deleteRule } from '../../api/welfareRules';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Plus, Edit2, Trash2, GripVertical, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const LeaderRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', content: '', category: 'general', order: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getRules();
      setRules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setIsEditMode(true);
      setFormData({ id: rule._id, title: rule.title, content: rule.content, category: rule.category, order: rule.order });
    } else {
      setIsEditMode(false);
      setFormData({ id: '', title: '', content: '', category: 'general', order: rules.length });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        await updateRule(formData.id, formData);
        toast.success('Rule updated');
      } else {
        await createRule(formData);
        toast.success('Rule created');
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
      await deleteRule(confirmDelete.id);
      toast.success('Rule deleted');
      setConfirmDelete({ open: false, id: null });
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Manage Rules</h1>
          <p className="page-subtitle">Add or edit welfare guidelines for all members</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={18} /> Add Rule</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Order</th>
                <th>Rule Title</th>
                <th>Category</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state">No rules defined yet.</div></td></tr>
              ) : rules.map(rule => (
                <tr key={rule._id}>
                  <td><div className="badge badge-gray">{rule.order}</div></td>
                  <td><div style={{ fontWeight: 600 }}>{rule.title}</div></td>
                  <td><span className="badge badge-lime">{rule.category}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(rule.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(rule)} className="btn btn-sm btn-ghost btn-icon"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteClick(rule._id)} className="btn btn-sm btn-ghost btn-icon" style={{ color: '#dc2626' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Rule' : 'Add New Rule'}>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Rule Title</label>
            <input 
              type="text" className="form-input" required placeholder="e.g. Contribution Deadlines" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>
          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="general">General</option>
                <option value="contributions">Contributions</option>
                <option value="claims">Claims</option>
                <option value="membership">Membership</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Display Order</label>
              <input 
                type="number" className="form-input" value={formData.order} 
                onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea 
              className="form-input" required style={{ minHeight: 180 }}
              placeholder="Detailed description of the rule..."
              value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
            />
          </div>
          <div className="flex justify-between" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Rule' : 'Save Rule'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={confirmDelete.open} 
        onClose={() => setConfirmDelete({ open: false, id: null })} 
        onConfirm={handleConfirmDelete}
        title="Delete Rule"
        message="Are you sure you want to delete this rule? It will be removed for all members immediately."
        confirmText="Delete Rule"
        loading={deleting}
      />
    </div>
  );
};

export default LeaderRulesPage;
