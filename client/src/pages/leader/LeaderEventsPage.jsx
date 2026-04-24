import { useEffect, useState } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../api/events';
import { getCategories, createCategory } from '../../api/categories';
import { validateSession } from '../../api/changeRequests';
import { useSocket } from '../../context/SocketContext';
import Modal from '../../components/common/Modal';
import AccessRequiredModal from '../../components/common/AccessRequiredModal';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const LeaderEventsPage = () => {
  const socket = useSocket();
  const { isSuperAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', description: '', date: '', location: '', category: '' });
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchData = async () => {
    try {
      const [e, s, cat] = await Promise.all([
        getEvents(),
        !isSuperAdmin ? validateSession().catch(() => ({ data: { hasSession: false } })) : Promise.resolve({ data: { hasSession: true } }),
        getCategories()
      ]);
      setEvents(e.data);
      setHasAccess(s.data.hasSession);
      const filteredCats = cat.data.filter(ct => ct.type === 'event' || ct.type === 'both');
      setCategories(filteredCats);
      if (filteredCats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: filteredCats[0].name }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('categoryAdded', (newCat) => {
        if (newCat.type === 'event' || newCat.type === 'both') {
          setCategories(prev => {
            if (prev.find(c => c._id === newCat._id)) return prev;
            return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name));
          });
        }
      });
    }
    return () => {
      if (socket) socket.off('categoryAdded');
    };
  }, [socket]);

  const handleOpenModal = (ev = null) => {
    if (!hasAccess && !isSuperAdmin) {
      setIsAccessModalOpen(true);
      return;
    }
    if (ev) {
      setIsEditMode(true);
      setFormData({ 
        id: ev._id, title: ev.title, description: ev.description || '', 
        date: new Date(ev.date).toISOString().slice(0,16), 
        location: ev.location || '', category: ev.category 
      });
    } else {
      setIsEditMode(false);
      setFormData({ 
        id: '', title: '', description: '', date: '', location: '', 
        category: categories.length > 0 ? categories[0].name : '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        await updateEvent(formData.id, formData);
        toast.success('Event updated');
      } else {
        await createEvent(formData);
        toast.success('Event created');
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
      await createCategory({ name: newCategoryName, type: 'event' });
      toast.success('Category added');
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDelete = async (id) => {
    if (!hasAccess && !isSuperAdmin) {
      setIsAccessModalOpen(true);
      return;
    }
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ev.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || ev.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Manage Events</h1>
          <p className="page-subtitle">Schedule and organize community gatherings</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={18} /> Create Event</button>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: 24, background: '#fff', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
            <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input 
              type="text" className="form-input" placeholder="Search event title or location..." 
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
            {(filterCategory || searchTerm) && (
              <button 
                className="btn btn-ghost" 
                onClick={() => { setSearchTerm(''); setFilterCategory(''); }}
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
                <th>Title & Info</th>
                <th>Date / Time</th>
                <th>Category</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state">No matching events found.</div></td></tr>
              ) : (
                filteredEvents.map(ev => (
                  <tr key={ev._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ev.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ev.description?.substring(0, 50) || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{format(new Date(ev.date), 'dd MMM yyyy')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(new Date(ev.date), 'HH:mm')}</div>
                    </td>
                    <td><span className="badge badge-lime">{ev.category}</span></td>
                    <td>{ev.location || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(ev)} className="btn btn-sm btn-ghost btn-icon"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(ev._id)} className="btn btn-sm btn-ghost btn-icon" style={{ color: '#dc2626' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Event' : 'Create Event'}>
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
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
            <label className="form-label">Date and Time</label>
            <input type="datetime-local" className="form-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Location (Optional)</label>
            <input type="text" className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Event'}</button>
          </div>
        </form>
      </Modal>

      <AccessRequiredModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />
      <AccessRequiredModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />

      {/* Add Category Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Add New Event Category">
        <form onSubmit={handleAddCategory} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input 
              type="text" className="form-input" required placeholder="e.g. Wedding Ceremony" 
              value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} 
            />
          </div>
          <div className="flex justify-between" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Category</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaderEventsPage;
