import { Link } from 'react-router-dom';

export default function Menu() {
  return (
    <nav className="drawer-nav">
      <Link to="/">Home</Link>
      <Link to="/section/latestjob">Latest Job</Link>
      <Link to="/section/result">Result</Link>
      <Link to="/section/admitcard">Admit Card</Link>
      <Link to="/section/online">New Vacancy</Link>
      <Link to="/search">Search</Link>
    </nav>
  );
}
