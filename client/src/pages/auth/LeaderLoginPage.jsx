import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { leaderLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const LeaderLoginPage = () => {
  const [form, setForm] = useState({ idNumber: '', phoneNumber: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await leaderLogin(form);
      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/leader/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Branding */}
      <div className="login-branding">
        <img src="/logo.png" alt="Evergreen" style={{ width: 120, marginBottom: 24, borderRadius: 16 }} />
        <h1 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 12 }}>Leaders Portal</h1>
        <p style={{ fontSize: '1rem', opacity: 0.75, maxWidth: 320, textAlign: 'center', lineHeight: 1.7 }}>
          Manage members, record contributions, handle claims, and approve change requests.
        </p>
        <div className="login-tags" style={{ marginTop: 32, background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 24px', backdropFilter: 'blur(10px)' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: 8 }}>🔒 Secure Leader Access Only</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.65, lineHeight: 1.6 }}>
            All write operations require<br />approval from all other leaders.
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="login-form-panel">
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, background: '#dcfce7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color="var(--green-600)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-700)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Leaders Login</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evergreen Community</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Member Number (3 digits)</label>
              <input name="idNumber" value={form.idNumber} onChange={handleChange} className="form-input" placeholder="e.g. 001" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} className="form-input" placeholder="e.g. 0712345678" required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className="form-input" placeholder="Password" required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <LogIn size={18} />}
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a href="/login" style={{ fontSize: '0.82rem', color: 'var(--green-600)', fontWeight: 600 }}>← Member Login</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderLoginPage;
