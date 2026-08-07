import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';

/** If you still see the old newspaper/tab UI, this build is NOT deployed. */
export const UI_VERSION = 'v2-premium-2026-08';

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <>
      <div className="ui-version-bar" role="status">
        Sarkari Paper {UI_VERSION} · New design active
      </div>
      <Header />
      <div className={`page ${pathname === '/' ? 'page--home' : ''}`}>
        <Outlet />
      </div>
      <Footer />
      <BottomNav />
    </>
  );
}
