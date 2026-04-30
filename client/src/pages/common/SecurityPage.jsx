import { useState } from 'react';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateMemberPassword, updateLeaderPassword } from '../../api/auth';
import toast from 'react-hot-toast';

const SecurityPage = () => {
  const { user, isMember } = useAuth();
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 4) {
      return toast.error('Password must be at least 4 characters');
    }

    setLoading(true);
    try {
      if (isMember) {
        await updateMemberPassword({ currentPassword, newPassword });
      } else {
        await updateLeaderPassword({ currentPassword, newPassword });
      }
      toast.success('Password updated successfully');
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadein">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={28} /> Security Settings
        </h1>
        <p className="page-subtitle">Manage your account security and update your password</p>
      </div>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: '50%', background: 'var(--green-50)', 
            color: 'var(--green-600)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 16px' 
          }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-800)' }}>Change Password</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            We recommend using a strong password that you don't use elsewhere.
            <br />
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Requirement: Minimum 4 characters.</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-5">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPasswords.current ? "text" : "password"} 
                name="currentPassword" 
                required 
                className="form-input" 
                placeholder="Enter current password"
                style={{ paddingRight: '44px' }} 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))} 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: '4px' }}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPasswords.new ? "text" : "password"} 
                name="newPassword" 
                required 
                className="form-input" 
                placeholder="Enter new password"
                style={{ paddingRight: '44px' }} 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))} 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: '4px' }}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPasswords.confirm ? "text" : "password"} 
                name="confirmPassword" 
                required 
                className="form-input" 
                placeholder="Confirm new password"
                style={{ paddingRight: '44px' }} 
              />
              <button 
                type="button" 
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))} 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', padding: '4px' }}
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ marginTop: 10, height: 48, fontSize: '1rem' }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecurityPage;
