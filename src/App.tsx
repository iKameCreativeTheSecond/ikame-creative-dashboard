import { HashRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import WeeklyPlan from './pages/WeeklyPlan';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={ <Home /> } />
        <Route path="/admin" element={ <Admin /> } />
        <Route path="/weekly-plan" element={ <WeeklyPlan /> } />
      </Routes>
    </HashRouter>
  )
}