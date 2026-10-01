import { useEffect, useState } from 'react';
import { getSettings, updateMinContribution } from '../../api/settings';
import { Settings, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [minContribution, setMinContribution] = useState('');
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(res => { setMinContribution(res.data.minContribution ?? 0); setSaved(res.data.minContribution ?? 0); })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateMinContribution(Number(minContribution));
      setSaved(res.data.minContribution);
      toast.success('Default minimum contribution saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadein">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Organisation-wide defaults</p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
          <Settings size={22} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontWeight: 700, margin: 0 }}>Minimum Contribution per Member</h3>
        </div>
        <form onSubmit={handleSave} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Default amount (₪)</label>
            <input type="number" className="form-input" required min="0" value={minContribution}
              onChange={e => setMinContribution(e.target.value)} />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              Pre-filled as the minimum when a new campaign is started. Each campaign keeps its own minimum, so changing this
              does not affect campaigns already running — to change one of those, open the campaign and edit its minimum.
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Current default: <strong>₪ {Number(saved || 0).toLocaleString()}</strong></span>
            <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
