import { useEffect, useState } from 'react';
import { getEvents } from '../../api/events';
import { format, isPast } from 'date-fns';
import { MapPin, Calendar } from 'lucide-react';

const categoryColor = { Meeting: 'badge-blue', Fundraiser: 'badge-lime', Social: 'badge-green', Emergency: 'badge-red', Other: 'badge-gray' };

const EventsPage = () => {
  const [events, setEvents]   = useState([]);
  const [filter, setFilter]   = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter === 'upcoming' ? { upcoming: 'true' } : {};
    getEvents(params).then(r => setEvents(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Stay updated on community activities</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['upcoming', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No events found</div>
          <div className="empty-state-text">Check back later</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {events.map(ev => {
            const past = isPast(new Date(ev.date));
            return (
              <div key={ev._id} className="card" style={{ borderLeft: `4px solid ${past ? 'var(--gray-300)' : 'var(--green-500)'}`, opacity: past ? 0.75 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span className={`badge ${categoryColor[ev.category] || 'badge-gray'}`}>{ev.category}</span>
                  {past && <span className="badge badge-gray">Past</span>}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--green-700)', marginBottom: 8 }}>{ev.title}</h3>
                {ev.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>{ev.description}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                    <Calendar size={14} />{format(new Date(ev.date), 'EEEE, dd MMMM yyyy')}
                  </div>
                  {ev.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                      <MapPin size={14} />{ev.location}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
