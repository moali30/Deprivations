import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdvisorPage from './pages/AdvisorPage';
import ControlPage from './pages/ControlPage';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AdvisorPage />} />
          <Route path="control" element={<ControlPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
