import { useState, useRef } from 'react';
import { Menu, Camera } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { updateLeaderProfile } from '../../api/auth';
import toast from 'react-hot-toast';

const TopBar = ({ title, onMenuClick }) => {
  const { user, login } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await updateLeaderProfile({ profilePhoto: file });
      
      // Update local storage/context with new photo
      const updatedUser = { ...user, profilePhoto: res.data.profilePhoto };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Trigger a re-render/context update if possible. 
      // Since useAuth might not have a direct setter, we can just reload or rely on next login, 
      // but a better way is to update the context state.
      window.location.reload(); // Simple way for now to sync everything
      
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <header
      style={{
        height: 64,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          className="mobile-menu-btn" 
          onClick={onMenuClick}
          style={{ background: 'none', border: 'none', color: 'var(--green-700)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Menu size={24} />
        </button>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-600)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="hidden-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user?.name || user?.email || 'Super Admin'}</div>
          <div style={{ fontSize: '0.75rem' }}>{user?.leaderRole || user?.role}</div>
        </div>
        
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleAvatarClick}>
          <Avatar src={user?.profilePhoto?.url} name={user?.name || 'SA'} size="sm" />
          <div style={{ 
            position: 'absolute', 
            bottom: -2, 
            right: -2, 
            background: 'var(--primary)', 
            borderRadius: '50%', 
            padding: 4, 
            color: '#fff',
            border: '2px solid #fff',
            display: 'flex',
            opacity: uploading ? 0.5 : 1
          }}>
            <Camera size={12} />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
