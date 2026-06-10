import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import WeeklyPlan from './pages/WeeklyPlan';
import { GlobalData } from './common/GlobalData';

function ProtectedRoute({ element }: { element: React.ReactElement }) {
  const token = GlobalData.getUserToken();
  if (token == null || token === undefined || token === '') {
    return <Navigate to="/" replace />;
  }
  return element;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/admin" element={<ProtectedRoute element={<Admin />} />} />
        <Route path="/weekly-plan" element={<ProtectedRoute element={<WeeklyPlan />} />} />
      </Routes>
    </HashRouter>
  )
}