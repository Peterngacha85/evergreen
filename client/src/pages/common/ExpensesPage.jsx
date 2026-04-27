import { useEffect, useState } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../api/expenses';
import { useAuth } from '../../context/AuthContext';
import { Plus, Receipt, Trash2, Edit2, Search, Calendar as CalendarIcon, DollarSign, Tag } from 'lucide-react';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ExpensesPage = () => {
  const { isMember } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), category: 'General' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await getExpenses();
      setExpenses(res.data);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setIsEditMode(true);
      setFormData({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        description: expense.description || '',
        date: format(new Date(expense.date), 'yyyy-MM-dd'),
        category: expense.category || 'General'
      });
    } else {
      setIsEditMode(false);
      setFormData({ id: '', title: '', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), category: 'General' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        await updateExpense(formData.id, formData);
        toast.success('Expense updated');
      } else {
        await createExpense(formData);
        toast.success('Expense recorded');
      }
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(confirmDelete.id);
      toast.success('Expense removed');
      setConfirmDelete({ open: false, id: null });
      fetchExpenses();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 30
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Receipt size={24} color="var(--red-600)" /> Community Expenses
          </h1>
          <p className="page-subtitle">Tracking all costs and expenditures of Evergreen Community</p>
        </div>
        {!isMember && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ background: '#ef4444', whiteSpace: 'nowrap' }}>
            <Plus size={18} /> Record Expense
          </button>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div className="card flex items-center gap-4" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Expenses</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-800)' }}>KES {totalExpenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="card flex items-center gap-4" style={{ borderLeft: '4px solid var(--blue-500)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-500)' }}>
            <Tag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Transaction Count</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-800)' }}>{filteredExpenses.length}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 350 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search expenses or categories..." 
              style={{ paddingLeft: 40 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Recorded By</th>
                {!isMember && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={isMember ? 5 : 6}><div className="empty-state">No expenses found matching your search.</div></td></tr>
              ) : filteredExpenses.map(exp => (
                <tr key={exp._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} color="var(--text-muted)" />
                      {format(new Date(exp.date), 'dd MMM yyyy')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{exp.title}</div>
                    {exp.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.description}</div>}
                  </td>
                  <td><span className="badge badge-blue">{exp.category}</span></td>
                  <td style={{ fontWeight: 800, color: '#ef4444' }}>- KES {exp.amount.toLocaleString()}</td>
                  <td><div style={{ fontSize: '0.85rem' }}>{exp.addedBy}</div></td>
                  {!isMember && (
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-icon btn-sm btn-ghost" onClick={() => handleOpenModal(exp)}><Edit2 size={16} /></button>
                        <button className="btn btn-icon btn-sm btn-ghost" style={{ color: '#ef4444' }} onClick={() => setConfirmDelete({ open: true, id: exp._id })}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Expense' : 'Record New Expense'}>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Expense Title</label>
            <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Hall Rental for AGM" />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Amount (KES)</label>
              <input type="number" className="form-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input type="text" className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Rental, Logistics" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Additional details about this expenditure..." />
          </div>

          <div className="flex justify-between" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#ef4444' }} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This will adjust the available funds accordingly."
        confirmText="Delete Record"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default ExpensesPage;
