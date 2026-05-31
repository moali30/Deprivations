import { HashRouter, Routes, Route } from 'react-router-dom';
import AdvisorPage from './pages/AdvisorPage';
import ControlPage from './pages/ControlPage';
import StudentSearchPage from './pages/StudentSearchPage';
import Layout from './components/Layout';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AdvisorPage />} />
          <Route path="control" element={<ControlPage />} />
          <Route path="search" element={<StudentSearchPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
