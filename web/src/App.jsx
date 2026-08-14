import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import Today from './pages/Today';
import History from './pages/History';
import Bodyweight from './pages/Bodyweight';
import Journal from './pages/Journal';
import VersionBadge from './VersionBadge';

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <div className="topbar">
          <div className="eyebrow">Fitness Coach</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1>Iron Ledger</h1>
            <VersionBadge />
          </div>
        </div>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/history" element={<History />} />
          <Route path="/bodyweight" element={<Bodyweight />} />
          <Route path="/journal" element={<Journal />} />
        </Routes>
        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Heute
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Verlauf
            </NavLink>
            <NavLink to="/bodyweight" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Gewicht
            </NavLink>
            <NavLink to="/journal" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Tagebuch
            </NavLink>
          </div>
        </nav>
      </div>
    </HashRouter>
  );
}
