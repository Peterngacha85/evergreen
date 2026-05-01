import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { superAdminLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const SuperAdminLoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await superAdminLogin(form);
      login(data.user, data.token);
      toast.success('Welcome, Super Admin!');
      navigate('/leader/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: 480, margin: 'auto', background: 'white', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, background: '#fee2e2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={22} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1f2937', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Super Admin Portal</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Restricted Access</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="form-input" placeholder="admin@email.com" required />
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

            <button type="submit" className="btn btn-lg w-full" disabled={loading} style={{ marginTop: 8, background: '#111827', color: 'white' }}>
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <LogIn size={18} />}
              {loading ? 'Authenticating…' : 'Access System'}
            </button>
          </form>
          
          {/* Copyright */}
          <div style={{ marginTop: 40, opacity: 0.5, fontSize: '0.7rem', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} Evergreen Community. <br/>
            Developed by <a href="https://fastweb.co.ke" target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'underline', fontWeight: 600 }}>Fastweb Technologies</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
