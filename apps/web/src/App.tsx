import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/common/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-apple-canvas text-apple-gray-900 transition-colors dark:bg-darkroom-canvas dark:text-apple-gray-100 font-sans">
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
