import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { memberLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const MemberLoginPage = () => {
  const [form, setForm]     = useState({ idNumber: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await memberLogin(form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      
      // Redirect leaders to their dashboard, others to member dashboard
      if (data.user.role === 'leader' || data.user.role === 'superadmin') {
        navigate('/leader/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left branding panel */}
      <div className="login-branding">
        <img src="/logo.png" alt="Evergreen" style={{ width: 120, marginBottom: 24, borderRadius: 16 }} />
        <h1 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 12 }}>
          Evergreen Community
        </h1>
        <p style={{ fontSize: '1rem', opacity: 0.75, maxWidth: 320, textAlign: 'center', lineHeight: 1.7 }}>
          Your community welfare portal — contributions, events, and more, all in one place.
        </p>
        <div className="login-tags" style={{ marginTop: 48, display: 'flex', gap: 16 }}>
          {['Contributions', 'Events', 'Claims', 'Officials'].map(item => (
            <div key={item} style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 16px',
              fontSize: '0.8rem', fontWeight: 600, backdropFilter: 'blur(8px)',
            }}>{item}</div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, background: '#dcfce7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={22} color="var(--green-600)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-700)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Member Login</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evergreen Community</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Member Number (3 digits)</label>
              <input name="idNumber" value={form.idNumber} onChange={handleChange}
                className="form-input" placeholder="e.g. 001" required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className="form-input" placeholder="Enter your password" required
                  style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
              style={{ marginTop: 8, gap: 10 }}>
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <LogIn size={18} />}
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: 28, padding: '16px', background: 'var(--green-50)', borderRadius: 10, textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--green-700)', fontWeight: 500 }}>
              Are you a leader? <a href="/leader/login" style={{ color: 'var(--green-600)', fontWeight: 700 }}>Login here →</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberLoginPage;
