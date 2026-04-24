import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, TrendingUp, Calendar, Award,
  FileText, GitPullRequestDraft, LogOut, ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

const MEMBER_NAV = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/contributions',   icon: TrendingUp,      label: 'Contributions'  },
  { to: '/events',          icon: Calendar,        label: 'Events'         },
  { to: '/officials',       icon: Award,           label: 'Officials'      },
  { to: '/claims',          icon: FileText,        label: 'My Claims'      },
];

const LEADER_NAV = [
  { to: '/leader/dashboard',      icon: LayoutDashboard,     label: 'Dashboard'        },
  { to: '/leader/members',        icon: Users,               label: 'Members'          },
  { to: '/leader/contributions',  icon: TrendingUp,          label: 'Contributions'    },
  { to: '/leader/events',         icon: Calendar,            label: 'Events'           },
  { to: '/leader/claims',         icon: FileText,            label: 'Claims'           },
  { to: '/leader/officials',      icon: Award,               label: 'Officials'        },
  { to: '/leader/change-requests',icon: GitPullRequestDraft, label: 'Change Requests'  },
];

const SUPERADMIN_NAV = [
  { to: '/leader/dashboard',      icon: LayoutDashboard,     label: 'Dashboard'        },
  { to: '/leader/members',        icon: Users,               label: 'Members'          },
  { to: '/leader/contributions',  icon: TrendingUp,          label: 'Contributions'    },
  { to: '/leader/events',         icon: Calendar,            label: 'Events'           },
  { to: '/leader/claims',         icon: FileText,            label: 'Claims'           },
  { to: '/leader/officials',      icon: Award,               label: 'Officials'        },
  { to: '/leader/change-requests',icon: GitPullRequestDraft, label: 'Change Requests'  },
  { to: '/leader/manage-leaders', icon: Shield,              label: 'Manage Leaders'   },
];

const Sidebar = ({ onClose }) => {
  const { user, logout, isMember, isSuperAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const navItems = isMember ? MEMBER_NAV : isSuperAdmin ? SUPERADMIN_NAV : LEADER_NAV;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate(isMember ? '/login' : '/leader/login');
  };

  return (
    <aside
      style={{
        width: collapsed ? 72 : 260,
        minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'fixed',
        top: 0, left: 0,
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <img src="/logo.png" alt="Evergreen" style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, objectFit: 'cover' }} />
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Evergreen
            </div>
            <div style={{ color: 'var(--sidebar-active)', fontSize: '0.7rem', fontWeight: 600 }}>
              Community Welfare
            </div>
          </div>
        )}
      </div>

      {/* User Profile Mini */}
      {!collapsed && (
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={user?.profilePhoto?.url} name={user?.name || user?.email || 'SA'} size="sm" />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Super Admin'}
            </div>
            <div style={{ color: 'var(--sidebar-active)', fontSize: '0.72rem', fontWeight: 500 }}>
              {user?.leaderRole || user?.role?.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('dashboard')}
            onClick={() => { if (onClose) onClose(); }}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              marginBottom: 2,
              color: isActive ? '#fff' : 'var(--sidebar-text)',
              background: isActive ? 'var(--sidebar-active)' : 'transparent',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.88rem',
              transition: 'all 0.15s',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse + Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 10,
            background: 'transparent', border: 'none',
            color: '#fca5a5', fontWeight: 600, fontSize: '0.88rem',
            cursor: 'pointer', width: '100%', whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
            padding: '8px 12px', borderRadius: 10,
            background: 'transparent', border: 'none',
            color: 'var(--sidebar-text)', cursor: 'pointer', width: '100%',
            transition: 'background 0.15s',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
