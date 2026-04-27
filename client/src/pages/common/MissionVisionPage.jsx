import { useEffect, useState } from 'react';
import { getMissionVision, updateMissionVision } from '../../api/missionVision';
import { useAuth } from '../../context/AuthContext';
import { Target, Eye, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const MissionVisionPage = () => {
  const { isMember } = useAuth();
  const [data, setData] = useState({ mission: '', vision: '' });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ mission: '', vision: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getMissionVision();
      setData(res.data);
      setFormData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Mission and Vision');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateMissionVision(formData);
      setData(formData);
      setIsEditing(false);
      toast.success('Mission and Vision updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Our Mission & Vision</h1>
          <p className="page-subtitle">The core values and goals of Evergreen Community</p>
        </div>
        {!isMember && !isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            <Edit3 size={18} /> Edit Mission & Vision
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="card animate-fadein" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
              <Target size={20} color="var(--primary)" /> Our Mission
            </label>
            <textarea 
              className="form-input" 
              style={{ minHeight: 150, padding: 16, fontSize: '1rem', lineHeight: 1.6 }}
              value={formData.mission}
              onChange={e => setFormData({ ...formData, mission: e.target.value })}
              placeholder="What is our mission?"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
              <Eye size={20} color="var(--primary)" /> Our Vision
            </label>
            <textarea 
              className="form-input" 
              style={{ minHeight: 150, padding: 16, fontSize: '1rem', lineHeight: 1.6 }}
              value={formData.vision}
              onChange={e => setFormData({ ...formData, vision: e.target.value })}
              placeholder="What is our vision?"
              required
            />
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)} disabled={submitting}>
              <X size={18} /> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Save size={18} />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
          {/* Mission Card */}
          <div className="card" style={{ 
            padding: 40, 
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', 
            border: '1px solid var(--green-100)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              opacity: 0.05, 
              transform: 'rotate(-15deg)' 
            }}>
              <Target size={160} />
            </div>
            
            <div style={{ 
              width: 56, height: 56, 
              background: 'var(--primary)', 
              borderRadius: 16, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              marginBottom: 24,
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
            }}>
              <Target size={28} />
            </div>
            
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 16, color: 'var(--green-900)' }}>Our Mission</h2>
            <div style={{ 
              fontSize: '1.1rem', 
              lineHeight: 1.8, 
              color: 'var(--gray-700)',
              whiteSpace: 'pre-wrap'
            }}>
              {data.mission || "Mission hasn't been set yet. A leader can update this information."}
            </div>
          </div>

          {/* Vision Card */}
          <div className="card" style={{ 
            padding: 40, 
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)', 
            border: '1px solid var(--blue-100)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              opacity: 0.05, 
              transform: 'rotate(-15deg)' 
            }}>
              <Eye size={160} />
            </div>

            <div style={{ 
              width: 56, height: 56, 
              background: 'var(--blue-600)', 
              borderRadius: 16, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              marginBottom: 24,
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
            }}>
              <Eye size={28} />
            </div>
            
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 16, color: 'var(--blue-900)' }}>Our Vision</h2>
            <div style={{ 
              fontSize: '1.1rem', 
              lineHeight: 1.8, 
              color: 'var(--gray-700)',
              whiteSpace: 'pre-wrap'
            }}>
              {data.vision || "Vision hasn't been set yet. A leader can update this information."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionVisionPage;
