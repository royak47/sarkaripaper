import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Section from './pages/Section';
import Detail from './pages/Detail';
import Search from './pages/Search';
import Saved from './pages/Saved';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="section/:key" element={<Section />} />
        <Route path="job/:slug" element={<Detail />} />
        <Route path="search" element={<Search />} />
        <Route path="saved" element={<Saved />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
