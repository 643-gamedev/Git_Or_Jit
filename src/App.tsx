import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import NewRepoPage from './pages/NewRepoPage';
import RepositoryPage from './pages/RepositoryPage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import ExecutorPage from './pages/ExecutorPage';
import DownloadsPage from './pages/DownloadsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/explore" element={<><Navbar /><ExplorePage /></>} />
        <Route path="/downloads" element={<><Navbar /><DownloadsPage /></>} />
        <Route path="/dashboard" element={<ProtectedRoute><Navbar /><DashboardPage /></ProtectedRoute>} />
        <Route path="/new" element={<ProtectedRoute><Navbar /><NewRepoPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Navbar /><SettingsPage /></ProtectedRoute>} />
        <Route path="/executor" element={<ProtectedRoute><Navbar /><ExecutorPage /></ProtectedRoute>} />
        <Route path="/stars" element={<ProtectedRoute><Navbar /><DashboardPage /></ProtectedRoute>} />
        <Route path="/:username" element={<><Navbar /><ProfilePage /></>} />
        <Route path="/:owner/:repo" element={<><Navbar /><RepositoryPage /></>} />
        <Route path="/:owner/:repo/*" element={<><Navbar /><RepositoryPage /></>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
