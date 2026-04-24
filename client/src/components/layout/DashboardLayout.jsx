import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const PAGE_TITLES = {
  '/dashboard':               'Dashboard',
  '/contributions':           'My Contributions',
  '/events':                  'Upcoming Events',
  '/officials':               'Our Officials',
  '/claims':                  'My Claims',
  '/leader/dashboard':        'Leader Dashboard',
  '/leader/members':          'Members',
  '/leader/contributions':    'Contributions',
  '/leader/events':           'Events',
  '/leader/claims':           'Claims',
  '/leader/officials':        'Officials',
  '/leader/change-requests':  'Change Requests',
  '/leader/manage-leaders':   'Manage Leaders',
};

const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Evergreen Community';

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar with mobile state toggle */}
      <div className={`sidebar-container ${isMobileOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setIsMobileOpen(false)} />
      </div>

      <div className="desktop-layout">
        <TopBar title={title} onMenuClick={() => setIsMobileOpen(true)} />
        <main style={{ padding: '24px', background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
