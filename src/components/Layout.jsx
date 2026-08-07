import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Masthead from './Masthead';
import TabBar from './TabBar';
import Footer from './Footer';

export default function Layout() {
  const { pathname } = useLocation();
  const showMasthead = pathname === '/';

  return (
    <>
      <Header />
      {showMasthead && <Masthead />}
      <TabBar />
      <div className="page">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
