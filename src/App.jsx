import { HashRouter, Routes, Route } from 'react-router-dom';
import AdvisorPage from './pages/AdvisorPage';
import ControlPage from './pages/ControlPage';
import Layout from './components/Layout';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AdvisorPage />} />
          <Route path="control" element={<ControlPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
