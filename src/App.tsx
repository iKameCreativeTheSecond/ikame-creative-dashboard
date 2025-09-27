import { HashRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';

export default function App() {
  return (
    <HashRouter>
      <Routes>

        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}