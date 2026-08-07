import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';

export default function Layout() {
  const { pathname } = useLocation();
  const hideBottom = false;

  return (
    <>
      <Header />
      <div className={`page ${pathname === '/' ? 'page--home' : ''}`}>
        <Outlet />
      </div>
      <Footer />
      {!hideBottom && <BottomNav />}
    </>
  );
}
