import { useEffect, useState } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../api/events';
import { validateSession } from '../../api/changeRequests';
import Modal from '../../components/common/Modal';
import AccessRequiredModal from '../../components/common/AccessRequiredModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const EVENT_CATEGORIES = ['Meeting', 'Fundraiser', 'Social', 'Emergency', 'Other'];

const LeaderEventsPage = () => {
  const { isSuperAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', description: '', date: '', location: '', category: 'Meeting' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [e, s] = await Promise.all([
        getEvents(),
        !isSuperAdmin ? validateSession().catch(() => ({ data: { hasSession: false } })) : Promise.resolve({ data: { hasSession: true } })
      ]);
      setEvents(e.data);
      setHasAccess(s.data.hasSession);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
      setFormData({ id: '', title: '', description: '', date: '', location: '', category: 'Meeting' });
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

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">Manage Events</h1></div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} disabled={!hasAccess && !isSuperAdmin}><Plus size={18} /> Create Event</button>
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
              {events.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state">No events scheduled.</div></td></tr>
              ) : events.map(ev => (
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
              ))}
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
            <label className="form-label">Category</label>
            <select className="form-select" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
    </div>
  );
};

export default LeaderEventsPage;
