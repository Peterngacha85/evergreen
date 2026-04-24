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
  const [sidebarW, setSidebarW] = useState(260);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Evergreen Community';

  // Listen to sidebar width changes via CSS variable
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector('aside');
      if (sidebar) setSidebarW(sidebar.offsetWidth);
    });
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['style'] });
      setSidebarW(sidebar.offsetWidth);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Mobile Backdrop */}
      <div 
        className={`sidebar-backdrop ${isMobileOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar Container */}
      <div className={`sidebar-container ${isMobileOpen ? 'open' : ''} desktop-sidebar`}>
        <Sidebar onClose={() => setIsMobileOpen(false)} />
      </div>

      <div className="desktop-layout" style={{ flex: 1, marginLeft: sidebarW, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.25s ease' }}>
        <TopBar title={title} onMenuClick={() => setIsMobileOpen(true)} />
        <main style={{ flex: 1, padding: '28px', background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
