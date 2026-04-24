import { useState, useRef } from 'react';
import { Menu, Bell } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';

const TopBar = ({ title, onMenuClick }) => {
  const { user } = useAuth();

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
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user?.name || user?.email || 'Super Admin'}</div>
          <div style={{ fontSize: '0.75rem' }}>{user?.leaderRole || user?.role}</div>
        </div>
        <Avatar src={user?.profilePhoto?.url} name={user?.name || 'SA'} size="sm" />
      </div>
    </header>
  );
};

export default TopBar;
