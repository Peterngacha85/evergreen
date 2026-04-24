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
  '/rules':                   'Welfare Rules',
  '/leader/rules':            'Rules Management',
  '/leader/defaulters':       'Defaulters List',
  '/leader/funds':            'Funds Available',
  '/funds':                   'Funds Available',
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
      <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className="desktop-layout">
        <TopBar title={title} onMenuClick={() => setIsMobileOpen(true)} />
        <main style={{ padding: '32px', background: 'var(--bg)', minHeight: 'calc(100vh - 70px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
