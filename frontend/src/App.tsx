import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ViewPortfolio from './pages/public/ViewPortfolio';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDetail from './pages/admin/AdminDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import ToastContainer from './components/Toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/view/:uuid" element={<ViewPortfolio />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Private Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/:uuid" element={<AdminDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
